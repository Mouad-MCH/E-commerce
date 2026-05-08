import { UserRole } from "../db/schema";
import type { ENV } from "./env";
import { StreamChat } from "stream-chat";



export function streamChatDisplayName (
    role: UserRole,
    displayName: string | null,
    email: string
): string {

    const base = displayName ?? email.split("@")[0];
    if(role === "admin") return `Admin . ${base}`;
    if(role === "support") return `Support . ${base}`;

    return base;
}

export const getStreamChatServer = (env: ENV) => {
    return StreamChat.getInstance(env.STREAM_API_KEY, env.STREAM_API_SECRET)
}

export const streamUserId = (clerkUserId: string) => {
    return `clerk_${clerkUserId}`;
}