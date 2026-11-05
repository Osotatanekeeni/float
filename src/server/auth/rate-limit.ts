import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Db } from "@/db/client";

export const SIGN_IN_LIMIT = 5;
export const SIGN_IN_WINDOW_SECONDS = 15 * 60;

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

const keyFor = (email: string) => `signin:${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}`;

/**
 * Counts one sign-in attempt for this email and says whether it may proceed.
 *
 * Fixed window, kept in Postgres so every serverless instance shares it. The upsert is a single atomic
 * statement, so concurrent attempts cannot both slip under the limit. A fixed window allows a short
 * burst of up to twice the limit across a window boundary; that is accepted for sign-in links.
 * Must run on the owner connection: float_app has no access to this table.
 */
export async function consumeSignInAttempt(db: Db, email: string, now: Date): Promise<RateLimitResult> {
  const key = keyFor(email);
  const result = await db.execute<{ count: number; window_start: Date }>(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, ${now}, 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start + make_interval(secs => ${SIGN_IN_WINDOW_SECONDS}) <= ${now}
                   THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start + make_interval(secs => ${SIGN_IN_WINDOW_SECONDS}) <= ${now}
                          THEN ${now} ELSE rate_limits.window_start END
    RETURNING count, window_start
  `);
  const { count, window_start } = result.rows[0];
  if (count <= SIGN_IN_LIMIT) return { allowed: true };
  const elapsed = Math.floor((now.getTime() - new Date(window_start).getTime()) / 1000);
  return { allowed: false, retryAfterSeconds: Math.max(1, SIGN_IN_WINDOW_SECONDS - elapsed) };
}

export type LimitStatus = { limited: false } | { limited: true; retryAfterSeconds: number };

/**
 * Whether this email has already been refused in the current window, without counting an attempt.
 * Auth.js reports every provider error as ?error=Configuration, so after a failed sign-in the action uses
 * this to tell "too many attempts" from other failures. It is true only once an attempt beyond the limit
 * was made, so a failure on the fifth (allowed) attempt is not misreported as rate limiting.
 */
export async function isOverSignInLimit(db: Db, email: string, now: Date): Promise<LimitStatus> {
  const result = await db.execute<{ count: number; window_start: Date }>(
    sql`SELECT count, window_start FROM rate_limits WHERE key = ${keyFor(email)}`,
  );
  const row = result.rows[0];
  if (!row) return { limited: false };
  const elapsed = Math.floor((now.getTime() - new Date(row.window_start).getTime()) / 1000);
  if (elapsed >= SIGN_IN_WINDOW_SECONDS || row.count <= SIGN_IN_LIMIT) return { limited: false };
  return { limited: true, retryAfterSeconds: Math.max(1, SIGN_IN_WINDOW_SECONDS - elapsed) };
}
