import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "@/db/client";
import { adminPool, seedUser, testUrl } from "@/db/test/helpers";
import { createAdapter } from "./adapter";
import { signOutEverywhere } from "./sessions";

const admin = createDb(testUrl(), { max: 2 });
const adapter = createAdapter(admin.db);
let pool: Pool;

beforeAll(() => {
  pool = adminPool();
});
afterAll(async () => {
  await Promise.all([admin.close(), pool.end()]);
});

const email = () => `auth-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
const future = (ms: number) => new Date(Date.now() + ms);

describe("Auth.js adapter over the Float schema", () => {
  it("creates a user with Float's defaults and finds them by email", async () => {
    const e = email();
    const created = await adapter.createUser!({ id: "ignored", email: e, emailVerified: new Date() });
    const found = await adapter.getUserByEmail!(e);
    expect(found?.id).toBe(created.id);
    const { rows } = await pool.query("SELECT base_currency, timezone, default_mode FROM users WHERE id = $1", [created.id]);
    expect(rows[0]).toEqual({ base_currency: "NGN", timezone: "Africa/Lagos", default_mode: "cautious" });
  });

  it("verification tokens are single-use", async () => {
    const e = email();
    await adapter.createVerificationToken!({ identifier: e, token: "tok-1", expires: future(60_000) });
    expect(await adapter.useVerificationToken!({ identifier: e, token: "tok-1" })).not.toBeNull();
    expect(await adapter.useVerificationToken!({ identifier: e, token: "tok-1" })).toBeNull();
  });

  it("stores and resolves database sessions", async () => {
    const user = await adapter.createUser!({ id: "x", email: email(), emailVerified: new Date() });
    await adapter.createSession!({ sessionToken: "sess-a", userId: user.id, expires: future(60_000) });
    const found = await adapter.getSessionAndUser!("sess-a");
    expect(found?.user.id).toBe(user.id);
    await adapter.deleteSession!("sess-a");
    expect(await adapter.getSessionAndUser!("sess-a")).toBeNull();
  });
});

describe("signOutEverywhere (PRD section 8)", () => {
  it("ends every session for the user and leaves other users' sessions alone", async () => {
    const mine = await seedUser(pool, email());
    const theirs = await seedUser(pool, email());
    for (const token of ["m1", "m2", "m3"].map((t) => `${t}-${mine}`)) {
      await adapter.createSession!({ sessionToken: token, userId: mine, expires: future(60_000) });
    }
    await adapter.createSession!({ sessionToken: `t1-${theirs}`, userId: theirs, expires: future(60_000) });

    expect(await signOutEverywhere(admin.db, mine)).toBe(3);
    const { rows } = await pool.query("SELECT user_id FROM sessions WHERE user_id = ANY($1)", [[mine, theirs]]);
    expect(rows).toEqual([{ user_id: theirs }]);
  });
});

describe("privileges: the request role cannot touch credentials", () => {
  const asApp = async (query: string) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE float_app");
      return await client.query(query);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  };

  it("cannot read verification tokens or rate-limit counters", async () => {
    await expect(asApp("SELECT * FROM verification_tokens")).rejects.toThrow(/permission denied/i);
    await expect(asApp("SELECT * FROM rate_limits")).rejects.toThrow(/permission denied/i);
  });

  it("sees no session rows without a user context", async () => {
    expect((await asApp("SELECT count(*)::int AS n FROM sessions")).rows[0].n).toBe(0);
    expect((await asApp("SELECT count(*)::int AS n FROM auth_accounts")).rows[0].n).toBe(0);
  });
});
