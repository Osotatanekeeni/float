import { randomUUID } from "node:crypto";
import type { Db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { SESSION_MAX_AGE_SECONDS } from "./config";

// Reserved .test domain: it can never receive real mail.
export const DEV_EMAIL = "dev@float.test";

type Env = { NODE_ENV?: string; VERCEL?: string };

/** Only under `next dev`, and never on Vercel. Anything else (production, test, unset) is off. */
export function isDevLoginEnabled(env: Env): boolean {
  return env.NODE_ENV === "development" && !env.VERCEL;
}

export function assertDevLoginEnabled(env: Env): void {
  if (!isDevLoginEnabled(env)) throw new Error("Dev sign-in is only available in local development");
}

/**
 * Signs in a fixed local user without email, for trying the app on a laptop. It writes the same kind of
 * session row a magic link does, so everything downstream (proxy, layout, handlers) behaves identically.
 * Runs on the owner connection, like Auth.js itself.
 */
export async function createDevSession(db: Db, now: Date) {
  const [user] = await db
    .insert(users)
    .values({ email: DEV_EMAIL, name: "Dev user", emailVerified: now })
    .onConflictDoUpdate({ target: users.email, set: { emailVerified: now } })
    .returning({ id: users.id });

  const token = randomUUID();
  const expires = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  await db.insert(sessions).values({ sessionToken: token, userId: user.id, expires });
  return { token, userId: user.id, expires };
}
