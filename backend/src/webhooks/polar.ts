import type { Request, Response } from "express"
import { checkoutSessions, orderItems, orders } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { Webhook } from "standardwebhooks";
import env from "../lib/env";

function headerString(headers: Request["headers"], name: string) {
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
}

const checkoutSessionIdFromMetadata = (order: Record<string, unknown>)=> {
    const metadata = order.metadata;
    if(!metadata || typeof metadata !== "object") return undefined;
    const sessionId = (metadata as Record<string, unknown>).checkout_session_id;
    return typeof sessionId === "string" ? sessionId : undefined;
}

const alreadyPaid = async (polarOrderId?: string, checkoutId?: string) => {
    if(polarOrderId) {
        const [row] = await db
            .select()
            .from(orders)
            .where(eq(orders.polarOrderId, polarOrderId))
            .limit(1);

            if(row?.status === "paid") return true;
    }

    if(checkoutId) {
        const [row] = await db
            .select()
            .from(orders)
            .where(eq(orders.polarOrderId, checkoutId))
            .limit(1);

            if(row?.status === "paid") return true;
    }
    return false;
}

const fulfillCheckoutSession = async (
    sessionId: string, 
    polarOrderId?: string | undefined, 
    checkoutId?: string | undefined
) => {
    return await db.transaction(async (tx) => {
        const [session] = await tx
            .select()
            .from(checkoutSessions)
            .where(eq(checkoutSessions.id, sessionId))
            .for("update")
            .limit(1);
        
        if(!session) return false;

        const [order] = await tx.insert(orders).values({
                userId: session.userId,
                status: "paid",
                totalCents: session.totalCents,
                polarcheckoutId: checkoutId ?? session.polarCheckoutId ?? null,
                ...(polarOrderId ? { polarOrderId } : {}),
            })
            .returning();


        if(session.lines.length) {
            await tx.insert(orderItems).values(
                session.lines.map((line) => ({
                    orderId: order.id,
                    productId: line.productId,
                    quantity: line.quantity,
                    unitPriceCents: line.unitPriceCents
                }))
            )
        }

        await tx.delete(checkoutSessions).where(eq(checkoutSessions.id, sessionId));

        return true;
    })
}
 

export const polarWebhookHandler = async (req: Request, res: Response) => {
    try {
        if(!env.POLAR_WEBHOOK_SECRET) {
            res.status(500).json({ error: "Polar webhook secret is not configured" })
            return;
        }

        const raw = req.body instanceof Buffer ? req.body : Buffer.from(String(req.body));
        const wh = new Webhook(Buffer.from(env.POLAR_WEBHOOK_SECRET, "utf-8").toString("base64"));

        const id = headerString(req.headers, "webhook-id");
        const ts = headerString(req.headers, "webhook-timestamp");
        const sig = headerString(req.headers, "webhook-signature");

        if(!id || !ts || !sig) {
            res.status(400).json({ error: "Missing required webhook headers" })
            return;
        }

        wh.verify(raw, {"webhook-id": id, "webhook-timestamp": ts, "webhook-signature": sig});

        const event = JSON.parse(raw.toString("utf-8")) as {
            type: string,
            data?: Record<string, unknown>,
        };

        if (event.type === "order.paid" && event.data) {
            const data = event.data;
            const polarOrderId = typeof data.id === "string" ? data.id : undefined;
            const checkoutId = typeof data.checkout_id === "string" ? data.checkout_id : undefined;

            if(await alreadyPaid(polarOrderId, checkoutId)) {
                res.status(200).json({ ok: true, duplicate: true })
                return;
            }

            const sessionId = checkoutSessionIdFromMetadata(data)
            if(sessionId) {
                const ok = await fulfillCheckoutSession(sessionId, polarOrderId, checkoutId);

                if(ok) {
                    res.status(200).json({ ok: true })
                    return;
                }

                if(await alreadyPaid(polarOrderId, checkoutId)) {
                    res.status(200).json({ ok: true, duplicate: true })
                    return;
                }

                console.log("Polar order.paid: could not fulfill checkout session", {
                    sessionId,
                    checkoutId,
                })

                res.status(500).json({ error: "checkout fulfillment failed" });
                return;
            }
        }

        res.status(200).json({ ok: true });


    }catch (error) { 
        console.error("Error handling Polar webhook:", error);
        res.status(400).json({ error: "Webhook verification failed" })
    }
} 