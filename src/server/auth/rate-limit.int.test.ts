import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { adminPool, testUrl } from "@/db/test/helpers";
import { SIGN_IN_LIMIT, SIGN_IN_WINDOW_SECONDS, consumeSignInAttempt, isOverSignInLimit } from "./rate-limit";

// PRD section 9: sign-in is limited to 5 per 15 minutes per email. The counter lives in Postgres so the
// limit holds across serverless instances, which the concurrency test simulates with separate pools.
const t0 = new Date("2026-11-05T10:00:00Z");
const after = (seconds: number) => new Date(t0.getTime() + seconds * 1000);
let admin: Pool;
let a: ReturnType<typeof createDb>;
let b: ReturnType<typeof createDb>;
let n = 0;
const email = () => `limit-${Date.now()}-${n++}@example.test`;

beforeAll(() => {
  admin = adminPool();
  a = createDb(testUrl(), { max: 5 });
  b = createDb(testUrl(), { max: 5 });
});
afterAll(async () => {
  await Promise.all([a.close(), b.close(), admin.end()]);
});

describe("consumeSignInAttempt", () => {
  it("is 5 attempts per 15 minutes", () => {
    expect(SIGN_IN_LIMIT).toBe(5);
    expect(SIGN_IN_WINDOW_SECONDS).toBe(15 * 60);
  });

  it("allows the first five and blocks the sixth, saying when to retry", async () => {
    const e = email();
    for (let i = 1; i <= 5; i++) {
      const r = await consumeSignInAttempt(a.db, e, after(i));
      expect(r.allowed, `attempt ${i}`).toBe(true);
    }
    const blocked = await consumeSignInAttempt(a.db, e, after(6));
    expect(blocked.allowed).toBe(false);
    // The window opened at the first attempt (t0 + 1s); the sixth came 5s later.
    if (!blocked.allowed) expect(blocked.retryAfterSeconds).toBe(SIGN_IN_WINDOW_SECONDS - 5);
  });

  it("keeps blocking until the window passes, then starts a fresh one", async () => {
    const e = email();
    for (let i = 0; i < 5; i++) await consumeSignInAttempt(a.db, e, t0);
    expect((await consumeSignInAttempt(a.db, e, after(SIGN_IN_WINDOW_SECONDS - 1))).allowed).toBe(false);
    expect((await consumeSignInAttempt(a.db, e, after(SIGN_IN_WINDOW_SECONDS))).allowed).toBe(true);
    for (let i = 0; i < 4; i++) {
      expect((await consumeSignInAttempt(a.db, e, after(SIGN_IN_WINDOW_SECONDS + 1))).allowed).toBe(true);
    }
    expect((await consumeSignInAttempt(a.db, e, after(SIGN_IN_WINDOW_SECONDS + 2))).allowed).toBe(false);
  });

  it("limits each email separately", async () => {
    const [x, y] = [email(), email()];
    for (let i = 0; i < 6; i++) await consumeSignInAttempt(a.db, x, t0);
    expect((await consumeSignInAttempt(a.db, y, t0)).allowed).toBe(true);
  });

  it("treats case and surrounding spaces as the same email", async () => {
    const e = email();
    for (let i = 0; i < 5; i++) await consumeSignInAttempt(a.db, ` ${e.toUpperCase()} `, t0);
    expect((await consumeSignInAttempt(a.db, e, t0)).allowed).toBe(false);
  });

  it("holds across instances: 12 simultaneous attempts over two pools allow exactly 5", async () => {
    const e = email();
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => consumeSignInAttempt((i % 2 ? a : b).db, e, t0)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("does not store the email address in the clear", async () => {
    const e = email();
    await consumeSignInAttempt(a.db, e, t0);
    const { rows } = await admin.query("SELECT key FROM rate_limits");
    expect(rows.length).toBeGreaterThan(0);
    expect(JSON.stringify(rows)).not.toContain(e);
  });
});

// After a failed sign-in the action asks this, without consuming an attempt, to tell "too many attempts"
// apart from other failures (Auth.js reports every provider error as ?error=Configuration).
describe("isOverSignInLimit", () => {
  it("is false for an email never seen, and does not create a counter", async () => {
    const e = email();
    expect(await isOverSignInLimit(a.db, e, t0)).toEqual({ limited: false });
    const { rows } = await admin.query("SELECT 1 FROM rate_limits WHERE key LIKE 'signin:%' AND window_start = $1 AND count = 0", [t0]);
    expect(rows).toHaveLength(0);
  });

  it("stays false through exactly five allowed attempts, becomes true on the refused sixth", async () => {
    const e = email();
    for (let i = 0; i < 5; i++) await consumeSignInAttempt(a.db, e, t0);
    expect(await isOverSignInLimit(a.db, e, t0)).toEqual({ limited: false });
    await consumeSignInAttempt(a.db, e, after(30));
    expect(await isOverSignInLimit(a.db, e, after(30))).toEqual({ limited: true, retryAfterSeconds: SIGN_IN_WINDOW_SECONDS - 30 });
  });

  it("does not consume an attempt", async () => {
    const e = email();
    for (let i = 0; i < 5; i++) await consumeSignInAttempt(a.db, e, t0);
    for (let i = 0; i < 20; i++) await isOverSignInLimit(a.db, e, t0);
    expect((await consumeSignInAttempt(a.db, e, t0)).allowed).toBe(false); // the 6th, not the 26th, tipped it
    expect(await isOverSignInLimit(a.db, e, after(SIGN_IN_WINDOW_SECONDS))).toEqual({ limited: false });
  });
});
