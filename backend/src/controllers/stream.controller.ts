import { clerkClient, getAuth } from "@clerk/express"
import { Request, Response, NextFunction } from "express"
import { getLocalUser } from "../lib/users";
import { getStreamChatServer, streamChatDisplayName, streamUserId } from "../lib/stream";
import env from "../lib/env";


export const createStreamToken = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { userId, isAuthenticated } = getAuth(req);

        if(!isAuthenticated || !userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const localUser = await getLocalUser(userId);

        if(!localUser) {
            res.status(503).json({ error: "Account not synced yet" });
            return
        }

        const server = getStreamChatServer(env)

        const clerkUser = await clerkClient.users.getUser(userId)


        const combiend = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

        const name = streamChatDisplayName(
            localUser.role, 
            localUser.displayName ?? combiend ?? clerkUser.username, 
            localUser.email
        )

        const image = clerkUser.imageUrl || undefined;
        const sid = streamUserId(userId);

        await server.upsertUser({ id: sid, name, image })

        const token = server.createToken(sid);

        res.json({token, apiKey: env.STREAM_API_KEY, userId: sid});
    }catch(e){
        next(e)
    }
}