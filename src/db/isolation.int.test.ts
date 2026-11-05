import { sql } from "drizzle-orm";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withUser } from "@/db/client";
import { createAccount, getAccount, listAccounts } from "@/db/repos/accounts";
import { adminPool, appDb, seedAccount, seedUser } from "@/db/test/helpers";

// Two barriers (CLAUDE.md): ownership checks in the data-access layer, and row-level security in
// the database. Each is tested on its own so a failure in one cannot hide behind the other.
const app = appDb(1); // one connection, so any leaked session state would show up immediately
let admin: Pool;
let alice: string;
let bob: string;
let aliceAccount: string;
let bobAccount: string;

beforeAll(async () => {
  admin = adminPool();
  const stamp = Date.now();
  alice = await seedUser(admin, `alice-${stamp}@example.test`);
  bob = await seedUser(admin, `bob-${stamp}@example.test`);
  aliceAccount = await seedAccount(admin, alice, "Alice current");
  bobAccount = await seedAccount(admin, bob, "Bob current");
});
afterAll(async () => {
  await app.close();
  await admin.end();
});

describe("data-access layer (barrier 1)", () => {
  it("returns your own account", async () => {
    const account = await withUser(app.db, alice, (tx) => getAccount(tx, alice, aliceAccount));
    expect(account?.name).toBe("Alice current");
  });

  it("returns undefined, not the row, for another user's account (the API maps this to 404)", async () => {
    const account = await withUser(app.db, alice, (tx) => getAccount(tx, alice, bobAccount));
    expect(account).toBeUndefined();
  });

  it("lists only your accounts", async () => {
    const accounts = await withUser(app.db, alice, (tx) => listAccounts(tx, alice));
    expect(accounts.map((a) => a.id)).toContain(aliceAccount);
    expect(accounts.map((a) => a.id)).not.toContain(bobAccount);
  });

  it("creates accounts owned by the caller", async () => {
    const created = await withUser(app.db, alice, (tx) =>
      createAccount(tx, alice, { name: "Savings", type: "savings", currency: "NGN" }),
    );
    expect(created.userId).toBe(alice);
  });

  it("rejects a malformed user id before touching the database", async () => {
    await expect(withUser(app.db, "not-a-uuid", async () => 1)).rejects.toThrow(/user id/i);
  });
});

// Drizzle wraps driver errors ("Failed query: ..."); the Postgres error, with its SQLSTATE, is on cause.
async function pgError(promise: Promise<unknown>): Promise<{ code?: string; message: string }> {
  try {
    await promise;
  } catch (e) {
    return ((e as { cause?: unknown }).cause ?? e) as { code?: string; message: string };
  }
  throw new Error("Expected the query to be rejected, but it succeeded");
}

describe("row-level security (barrier 2): deliberately no ownership filter in these queries", () => {
  it("sees only your rows with a bare SELECT", async () => {
    const rows = await withUser(app.db, alice, (tx) => tx.execute(sql`SELECT id, user_id FROM accounts`));
    expect(rows.rows.length).toBeGreaterThan(0);
    expect(rows.rows.every((r) => r.user_id === alice)).toBe(true);
  });

  it("returns nothing when asked for another user's row by id", async () => {
    const rows = await withUser(app.db, alice, (tx) => tx.execute(sql`SELECT id FROM accounts WHERE id = ${bobAccount}`));
    expect(rows.rows).toHaveLength(0);
  });

  it("updates and deletes zero of another user's rows", async () => {
    const result = await withUser(app.db, alice, async (tx) => {
      const upd = await tx.execute(sql`UPDATE accounts SET name = 'pwned' WHERE id = ${bobAccount}`);
      const del = await tx.execute(sql`DELETE FROM accounts WHERE id = ${bobAccount}`);
      return [upd.rowCount, del.rowCount];
    });
    expect(result).toEqual([0, 0]);
    const { rows } = await admin.query("SELECT name FROM accounts WHERE id = $1", [bobAccount]);
    expect(rows[0].name).toBe("Bob current");
  });

  it("refuses to insert a row owned by someone else (WITH CHECK)", async () => {
    const error = await pgError(
      withUser(app.db, alice, (tx) =>
        tx.execute(sql`INSERT INTO accounts (user_id, name, type, currency) VALUES (${bob}, 'planted', 'cash', 'NGN')`),
      ),
    );
    expect(error.code).toBe("42501"); // insufficient_privilege, raised by the RLS WITH CHECK
    expect(error.message).toMatch(/row-level security/i);
  });

  it("refuses to reassign your row to someone else", async () => {
    const error = await pgError(
      withUser(app.db, alice, (tx) => tx.execute(sql`UPDATE accounts SET user_id = ${bob} WHERE id = ${aliceAccount}`)),
    );
    expect(error.code).toBe("42501");
    expect(error.message).toMatch(/row-level security/i);
  });

  it("fails closed: with no user set, the app role sees nothing", async () => {
    const { rows } = await app.pool
      .connect()
      .then(async (client) => {
        try {
          await client.query("BEGIN");
          await client.query("SET LOCAL ROLE float_app");
          return await client.query("SELECT count(*)::int AS n FROM accounts");
        } finally {
          await client.query("ROLLBACK");
          client.release();
        }
      });
    expect(rows[0].n).toBe(0);
  });

  it("does not leak the user or role into the next use of a pooled connection", async () => {
    await withUser(app.db, alice, (tx) => tx.execute(sql`SELECT 1`));
    const client = await app.pool.connect();
    try {
      const { rows } = await client.query(
        "SELECT current_user AS who, coalesce(current_setting('app.user_id', true), '') AS uid",
      );
      expect(rows[0].who).not.toBe("float_app");
      expect(rows[0].uid).toBe("");
    } finally {
      client.release();
    }
  });

  it("switches users cleanly between consecutive transactions on one connection", async () => {
    const a = await withUser(app.db, alice, (tx) => tx.execute(sql`SELECT count(*)::int AS n FROM accounts WHERE id = ${bobAccount}`));
    const b = await withUser(app.db, bob, (tx) => tx.execute(sql`SELECT count(*)::int AS n FROM accounts WHERE id = ${bobAccount}`));
    expect([a.rows[0].n, b.rows[0].n]).toEqual([0, 1]);
  });

  it("applies to the child tables too", async () => {
    const stamp = Date.now();
    await admin.query(
      "INSERT INTO transactions (user_id, account_id, date, amount_minor, kind, description) VALUES ($1, $2, '2026-11-05', 5000, 'income', $3)",
      [bob, bobAccount, `bob-secret-${stamp}`],
    );
    const rows = await withUser(app.db, alice, (tx) => tx.execute(sql`SELECT id FROM transactions WHERE account_id = ${bobAccount}`));
    expect(rows.rows).toHaveLength(0);
  });
});

describe("the app role is genuinely subject to RLS", () => {
  it("is not an owner and cannot bypass row security", async () => {
    const { rows } = await admin.query("SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'float_app'");
    expect(rows[0]).toEqual({ rolbypassrls: false, rolsuper: false });
    const owned = await admin.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'float_app'");
    expect(owned.rows[0].n).toBe(0);
  });

  it("every table holding user data has RLS enabled and a policy", async () => {
    const { rows } = await admin.query<{ table: string; rls: boolean; policies: number }>(`
      SELECT c.relname AS table, c.relrowsecurity AS rls,
             (SELECT count(*)::int FROM pg_policies p WHERE p.tablename = c.relname AND p.schemaname = 'public') AS policies
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      WHERE c.relkind = 'r'
        AND (c.relname = 'users' OR EXISTS (
          SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public' AND col.table_name = c.relname AND col.column_name = 'user_id'))
    `);
    expect(rows.length).toBeGreaterThanOrEqual(13);
    for (const r of rows) {
      expect(r.rls, `${r.table} has RLS enabled`).toBe(true);
      expect(r.policies, `${r.table} has a policy`).toBeGreaterThan(0);
    }
  });
});
