import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { sessions } from "@/db/schema";

/** Ends every session for the user, on every device. Returns how many were ended. */
export async function signOutEverywhere(db: Db, userId: string): Promise<number> {
  const ended = await db.delete(sessions).where(eq(sessions.userId, userId)).returning({ token: sessions.sessionToken });
  return ended.length;
}
