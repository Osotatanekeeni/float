import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminPool, seedAccount, seedUser } from "@/db/test/helpers";

let pool: Pool;
let userId: string;
let accountId: string;

beforeAll(async () => {
  pool = adminPool();
  userId = await seedUser(pool, `schema-${Date.now()}@example.test`);
  accountId = await seedAccount(pool, userId, "Current account");
});
afterAll(() => pool.end());

const tables = async () =>
  (await pool.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1")).rows.map(
    (r) => r.tablename,
  );

describe("migrations (PRD section 5)", () => {
  it("create every domain entity", async () => {
    expect(await tables()).toEqual(
      expect.arrayContaining([
        "accounts",
        "ai_outputs",
        "alerts",
        "commitments",
        "expense_rules",
        "fx_rates",
        "imports",
        "income_sources",
        "occurrences",
        "reservations",
        "scenarios",
        "transactions",
        "users",
      ]),
    );
  });

  it("enable the pg_trgm extension for transaction search", async () => {
    const { rows } = await pool.query("SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'");
    expect(rows).toHaveLength(1);
  });

  it("index transactions on (account_id, date) and trigram on description", async () => {
    const { rows } = await pool.query<{ indexdef: string }>(
      "SELECT indexdef FROM pg_indexes WHERE tablename = 'transactions'",
    );
    const defs = rows.map((r) => r.indexdef.toLowerCase());
    expect(defs.some((d) => d.includes("(account_id, date)"))).toBe(true);
    expect(defs.some((d) => d.includes("gin") && d.includes("gin_trgm_ops") && d.includes("description"))).toBe(true);
  });
});

describe("constraints", () => {
  const insertTx = (amount: number | string, kind = "income") =>
    pool.query(
      "INSERT INTO transactions (user_id, account_id, date, amount_minor, kind) VALUES ($1, $2, '2026-11-05', $3, $4)",
      [userId, accountId, amount, kind],
    );

  it("stores amounts as integer minor units and bounds them to 10^13 (PRD: +/- 100 billion naira)", async () => {
    await expect(insertTx(10_000_000_000_000)).resolves.toBeDefined();
    await expect(insertTx(-10_000_000_000_000, "expense")).resolves.toBeDefined();
    await expect(insertTx(10_000_000_000_001)).rejects.toThrow(/check/i);
  });

  it("rejects unknown transaction kinds", async () => {
    await expect(insertTx(100, "gift")).rejects.toThrow();
  });

  it("validates account name length 1-60 and a 3-letter currency", async () => {
    const insert = (name: string, currency = "NGN") =>
      pool.query("INSERT INTO accounts (user_id, name, type, currency) VALUES ($1, $2, 'cash', $3)", [userId, name, currency]);
    await expect(insert("")).rejects.toThrow(/check/i);
    await expect(insert("x".repeat(61))).rejects.toThrow(/check/i);
    await expect(insert("Cash", "NAIRA")).rejects.toThrow();
    await expect(insert("x".repeat(60))).resolves.toBeDefined();
  });

  it("stores fx rates as numeric(18,8), positive, between different currencies", async () => {
    const insert = (rate: string, from = "USD", to = "NGN") =>
      pool.query(
        "INSERT INTO fx_rates (user_id, from_currency, to_currency, rate, effective_date) VALUES ($1, $2, $3, $4, '2026-11-01')",
        [userId, from, to, rate],
      );
    await expect(insert("1520.12345678")).resolves.toBeDefined();
    await expect(insert("0")).rejects.toThrow(/check/i);
    await expect(insert("-5")).rejects.toThrow(/check/i);
    await expect(insert("1", "NGN", "NGN")).rejects.toThrow(/check/i);
    const { rows } = await pool.query("SELECT rate::text FROM fx_rates WHERE rate = 1520.12345678 AND user_id = $1", [userId]);
    expect(rows[0].rate).toBe("1520.12345678");
  });

  it("allows one occurrence per (rule_type, rule_id, scheduled_date)", async () => {
    const rule = (await pool.query("INSERT INTO expense_rules (user_id, name, account_id, amount_minor, kind, rrule, start_date) VALUES ($1, 'Rent', $2, 20000000, 'bill', 'FREQ=MONTHLY', '2026-11-01') RETURNING id", [userId, accountId])).rows[0].id;
    const insert = () =>
      pool.query("INSERT INTO occurrences (user_id, rule_type, rule_id, scheduled_date) VALUES ($1, 'expense', $2, '2026-11-19')", [userId, rule]);
    await insert();
    await expect(insert()).rejects.toThrow(/unique|duplicate/i);
  });

  it("allows one import per (account_id, file_hash)", async () => {
    const insert = () =>
      pool.query("INSERT INTO imports (user_id, account_id, file_hash, row_count, mapping) VALUES ($1, $2, 'abc123', 4, '{}')", [userId, accountId]);
    await insert();
    await expect(insert()).rejects.toThrow(/unique|duplicate/i);
  });

  it("validates income amount ranges and date order", async () => {
    const insert = (min: number, max: number | null, end: string | null) =>
      pool.query(
        "INSERT INTO income_sources (user_id, name, account_id, amount_minor, amount_max_minor, rrule, start_date, end_date, certainty) VALUES ($1, 'Client', $2, $3, $4, 'FREQ=MONTHLY', '2026-11-01', $5, 'estimated')",
        [userId, accountId, min, max, end],
      );
    await expect(insert(15_000_000, 25_000_000, null)).resolves.toBeDefined();
    await expect(insert(0, null, null)).rejects.toThrow(/check/i);
    await expect(insert(25_000_000, 15_000_000, null)).rejects.toThrow(/check/i);
    await expect(insert(100, null, "2026-10-01")).rejects.toThrow(/check/i);
  });

  it("caches an AI output once per (user, kind, input_hash)", async () => {
    const insert = () =>
      pool.query("INSERT INTO ai_outputs (user_id, kind, input_hash, output, model, prompt_version) VALUES ($1, 'explain', 'h1', '{}', 'm', 'v1')", [userId]);
    await insert();
    await expect(insert()).rejects.toThrow(/unique|duplicate/i);
  });

  it("cascades: deleting a user removes their data", async () => {
    const other = await seedUser(pool, `cascade-${Date.now()}@example.test`);
    await seedAccount(pool, other, "Doomed");
    await pool.query("DELETE FROM users WHERE id = $1", [other]);
    const { rows } = await pool.query("SELECT 1 FROM accounts WHERE user_id = $1", [other]);
    expect(rows).toHaveLength(0);
  });
});

describe("a child row can never belong to a different user than its parent", () => {
  it("rejects a transaction whose user_id differs from its account's owner", async () => {
    const intruder = await seedUser(pool, `intruder-${Date.now()}@example.test`);
    await expect(
      pool.query("INSERT INTO transactions (user_id, account_id, date, amount_minor, kind) VALUES ($1, $2, '2026-11-05', 100, 'income')", [intruder, accountId]),
    ).rejects.toThrow(/foreign key/i);
  });

  it("rejects a reservation that mixes one user's commitment with another user's account", async () => {
    const other = await seedUser(pool, `mix-${Date.now()}@example.test`);
    const otherAccount = await seedAccount(pool, other, "Theirs");
    const commitment = (await pool.query("INSERT INTO commitments (user_id, name, target_minor) VALUES ($1, 'Rent', 20000000) RETURNING id", [userId])).rows[0].id;
    await expect(
      pool.query("INSERT INTO reservations (user_id, commitment_id, account_id, amount_minor) VALUES ($1, $2, $3, 100)", [userId, commitment, otherAccount]),
    ).rejects.toThrow(/foreign key/i);
  });
});
