import express from "express"
import cors from "cors"

import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk";
import env from "./lib/env";
import keepAliveCron from "./lib/cron";

import * as Sentry from "@sentry/node";

import fs from "node:fs"
import path from "node:path"

import meRouter from "./routes/me.route";
import productRouter from "./routes/product.route";
import streamRouter from "./routes/stream.route";
import checkoutRouter from "./routes/checkout.route";
import { polarWebhookHandler } from "./webhooks/polar";
import { sentryClerkUserMiddleware } from "./middleware/sentryClerkUser";


const app = express();

const rawJson = express.raw({ type: 'application/json', limit: "1mb" }) 
app.use(cors())
app.use(clerkMiddleware())
app.use(sentryClerkUserMiddleware)

app.post('/webhooks/clerk', rawJson, (req, res) => {
    void clerkWebhookHandler(req, res)
})

app.post('/webhooks/polar', rawJson, (req, res) => {
    void polarWebhookHandler(req, res)
})

app.use(express.json())

app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true })
})

app.use("/api/me", meRouter)
app.use("/api/products", productRouter)
app.use("/api/stream", streamRouter)
app.use("/api/checkout", checkoutRouter)

const publicDir = path.join(process.cwd(), "public");
if(fs.existsSync(publicDir)) {
    app.use(express.static(publicDir))

    app.get("/*any", (req, res, next) => {
        if(req.method !== "GET" && req.method !== "HEAD"){
            next();
            return;
        }

        if(!req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
            next();
            return;
        }

        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    })
}

Sentry.setupExpressErrorHandler(app);
// todo: add error handler middlewere

app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const sentryId = (res as express.Response & { sentry?: string }).sentry;

    res.status(500).json({
        error: "Internal Server Error",
        ...(sentryId !== "undefined" && { sentryId }),
    })
});

app.listen(env.PORT, () => {
    console.log(`server running on http://localhost:${env.PORT}`)
    if(env.NODE_ENV === "production") {
        keepAliveCron.start()
    }
})