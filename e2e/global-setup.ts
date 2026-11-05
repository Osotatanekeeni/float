import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import setupDatabase from "../src/db/test/global-setup";

export const SESSION_COOKIE = "__Secure-authjs.session-token";

// Resets the Neon test branch, then signs in a seeded user by writing a real session row, so the tests
// exercise the app's actual session check instead of a bypass.
export default async function globalSetup() {
  await setupDatabase();

  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL_UNPOOLED });
  const token = randomUUID();
  try {
    const { rows } = await pool.query<{ id: string }>("INSERT INTO users (email) VALUES ('e2e@example.test') RETURNING id");
    await pool.query("INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, now() + interval '1 day')", [token, rows[0].id]);
  } finally {
    await pool.end();
  }

  await mkdir("e2e/.auth", { recursive: true });
  await writeFile(
    "e2e/.auth/state.json",
    JSON.stringify({
      cookies: [{ name: SESSION_COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, secure: true, sameSite: "Lax", expires: -1 }],
      origins: [],
    }),
  );
}
