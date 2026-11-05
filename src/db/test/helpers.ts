import { existsSync } from "node:fs";
import { Pool } from "pg";
import { createDb } from "@/db/client";

if (existsSync(".env")) process.loadEnvFile(".env");

export function testUrl(): string {
  const url = process.env.TEST_DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("TEST_DATABASE_URL_UNPOOLED is not set");
  return url;
}

/** Owner connection that bypasses RLS: used only to seed and to inspect, never as "the app". */
export function adminPool(): Pool {
  return new Pool({ connectionString: testUrl(), max: 2 });
}

/** The application path: Drizzle over a pool, queried through withUser. */
export function appDb(max = 4) {
  return createDb(testUrl(), { max });
}

export async function seedUser(pool: Pool, email: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    "INSERT INTO users (email) VALUES ($1) RETURNING id",
    [email],
  );
  return rows[0].id;
}

export async function seedAccount(pool: Pool, userId: string, name: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    "INSERT INTO accounts (user_id, name, type, currency) VALUES ($1, $2, 'bank', 'NGN') RETURNING id",
    [userId, name],
  );
  return rows[0].id;
}
