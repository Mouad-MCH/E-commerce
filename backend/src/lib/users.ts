import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users } from "../db/schema";



export const getLocalUser = async (clerkUserId: string) => {
    const [row] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1)
    return row
}