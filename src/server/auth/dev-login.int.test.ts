import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminPool, appDb } from "@/db/test/helpers";
import { DEV_EMAIL, createDevSession } from "./dev-login";
import { SESSION_MAX_AGE_SECONDS } from "./config";

const admin = appDb(2);
let pool: Pool;

beforeAll(() => {
  pool = adminPool();
});
afterAll(async () => {
  await Promise.all([admin.close(), pool.end()]);
});

const now = new Date("2026-11-08T10:00:00Z");

describe("createDevSession", () => {
  it("creates the dev user once and reuses it on every call", async () => {
    const a = await createDevSession(admin.db, now);
    const b = await createDevSession(admin.db, now);
    expect(b.userId).toBe(a.userId);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM users WHERE email = $1", [DEV_EMAIL]);
    expect(rows[0].n).toBe(1);
  });

  it("stores a session for that user that lasts the normal 30 days", async () => {
    const { token, userId, expires } = await createDevSession(admin.db, now);
    expect(expires.getTime()).toBe(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
    const { rows } = await pool.query("SELECT user_id, expires FROM sessions WHERE session_token = $1", [token]);
    expect(rows[0].user_id).toBe(userId);
    expect(new Date(rows[0].expires).getTime()).toBe(expires.getTime());
  });

  it("gives each call a fresh, unguessable token", async () => {
    const [a, b] = [await createDevSession(admin.db, now), await createDevSession(admin.db, now)];
    expect(a.token).not.toBe(b.token);
    expect(a.token).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("marks the dev user's email verified, like a real magic-link sign-in", async () => {
    await createDevSession(admin.db, now);
    const { rows } = await pool.query("SELECT email_verified FROM users WHERE email = $1", [DEV_EMAIL]);
    expect(rows[0].email_verified).not.toBeNull();
  });
});
