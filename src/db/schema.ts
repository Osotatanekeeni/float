import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgRole,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// The role every request runs as (SET LOCAL ROLE in withUser). It owns nothing and cannot bypass RLS.
// Created by the first migration; drizzle only needs to know it exists.
export const appRole = pgRole("float_app").existing();

// Every user-owned table carries user_id and this policy. The setting is empty outside withUser,
// so an unauthenticated query matches no rows.
const currentUser = sql`nullif(current_setting('app.user_id', true), '')::uuid`;
const ownRows = (name: string, column: string) =>
  pgPolicy(name, { as: "permissive", for: "all", to: appRole, using: sql`${sql.raw(column)} = ${currentUser}`, withCheck: sql`${sql.raw(column)} = ${currentUser}` });

const minor = (name: string) => bigint(name, { mode: "number" });
const MAX_MINOR = 10_000_000_000_000; // PRD section 8: amounts bounded to +/- 100 billion naira
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const accountType = pgEnum("account_type", ["bank", "savings", "cash", "foreign", "other"]);
export const forecastMode = pgEnum("forecast_mode", ["cautious", "expected", "optimistic"]);
export const transactionKind = pgEnum("transaction_kind", ["income", "expense", "transfer_in", "transfer_out", "adjustment"]);
export const occurrenceStatus = pgEnum("occurrence_status", ["expected", "received", "paid", "late", "skipped", "missed", "overdue"]);
export const ruleType = pgEnum("rule_type", ["income", "expense"]);
export const certainty = pgEnum("certainty", ["confirmed", "estimated", "uncertain"]);
export const expenseKind = pgEnum("expense_kind", ["bill", "subscription", "debt", "variable", "planned", "one_time"]);

// Also the Auth.js user record (name, email_verified, image) so auth needs no second users table.
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name"),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    baseCurrency: char("base_currency", { length: 3 }).notNull().default("NGN"),
    timezone: text("timezone").notNull().default("Africa/Lagos"),
    bufferMinor: minor("buffer_minor").notNull().default(0),
    defaultMode: forecastMode("default_mode").notNull().default("cautious"),
    createdAt: createdAt(),
  },
  (t) => [ownRows("users_own_row", "id"), check("users_buffer_nonneg", sql`${t.bufferMinor} >= 0`)],
).enableRLS();

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountType("type").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    includeInForecast: boolean("include_in_forecast").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("accounts_own_rows", "user_id"),
    unique("accounts_id_user_unique").on(t.id, t.userId),
    index("accounts_user_idx").on(t.userId),
    check("accounts_name_length", sql`char_length(${t.name}) between 1 and 60`),
    check("accounts_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
).enableRLS();

export const imports = pgTable(
  "imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull(),
    fileHash: text("file_hash").notNull(),
    rowCount: bigint("row_count", { mode: "number" }).notNull(),
    mapping: jsonb("mapping").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("imports_own_rows", "user_id"),
    unique("imports_id_user_unique").on(t.id, t.userId),
    unique("imports_account_file_unique").on(t.accountId, t.fileHash),
    foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }).onDelete("cascade"),
  ],
).enableRLS();

export const fxRates = pgTable(
  "fx_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fromCurrency: char("from_currency", { length: 3 }).notNull(),
    toCurrency: char("to_currency", { length: 3 }).notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    effectiveDate: date("effective_date", { mode: "string" }).notNull(),
    sourceNote: text("source_note"),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("fx_rates_own_rows", "user_id"),
    index("fx_rates_lookup_idx").on(t.userId, t.fromCurrency, t.toCurrency, t.effectiveDate),
    check("fx_rates_positive", sql`${t.rate} > 0`),
    check("fx_rates_distinct", sql`${t.fromCurrency} <> ${t.toCurrency}`),
  ],
).enableRLS();

export const incomeSources = pgTable(
  "income_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    accountId: uuid("account_id").notNull(),
    amountMinor: minor("amount_minor").notNull(),
    amountMaxMinor: minor("amount_max_minor"),
    rrule: text("rrule").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    certainty: certainty("certainty").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("income_sources_own_rows", "user_id"),
    unique("income_sources_id_user_unique").on(t.id, t.userId),
    index("income_sources_user_idx").on(t.userId),
    foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }),
    check("income_amount_positive", sql`${t.amountMinor} > 0 and ${t.amountMinor} <= ${sql.raw(String(MAX_MINOR))}`),
    check("income_range_order", sql`${t.amountMaxMinor} is null or ${t.amountMaxMinor} >= ${t.amountMinor}`),
    check("income_end_after_start", sql`${t.endDate} is null or ${t.endDate} > ${t.startDate}`),
  ],
).enableRLS();

export const expenseRules = pgTable(
  "expense_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    accountId: uuid("account_id").notNull(),
    amountMinor: minor("amount_minor").notNull(),
    kind: expenseKind("kind").notNull(),
    category: text("category"),
    rrule: text("rrule").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    paused: boolean("paused").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("expense_rules_own_rows", "user_id"),
    unique("expense_rules_id_user_unique").on(t.id, t.userId),
    index("expense_rules_user_idx").on(t.userId),
    foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }),
    check("expense_amount_positive", sql`${t.amountMinor} > 0 and ${t.amountMinor} <= ${sql.raw(String(MAX_MINOR))}`),
    check("expense_end_after_start", sql`${t.endDate} is null or ${t.endDate} > ${t.startDate}`),
  ],
).enableRLS();

// rule_id points at income_sources or expense_rules depending on rule_type, so it cannot be a foreign
// key; the data-access layer checks the rule belongs to the user before creating an occurrence.
export const occurrences = pgTable(
  "occurrences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ruleType: ruleType("rule_type").notNull(),
    ruleId: uuid("rule_id").notNull(),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    status: occurrenceStatus("status").notNull().default("expected"),
    actualDate: date("actual_date", { mode: "string" }),
    actualAmountMinor: minor("actual_amount_minor"),
    overrideAmountMinor: minor("override_amount_minor"),
    overrideCertainty: certainty("override_certainty"),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("occurrences_own_rows", "user_id"),
    unique("occurrences_id_user_unique").on(t.id, t.userId),
    unique("occurrences_rule_date_unique").on(t.ruleType, t.ruleId, t.scheduledDate),
    index("occurrences_user_date_idx").on(t.userId, t.scheduledDate),
  ],
).enableRLS();

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    amountMinor: minor("amount_minor").notNull(),
    kind: transactionKind("kind").notNull(),
    category: text("category"),
    description: text("description"),
    occurrenceId: uuid("occurrence_id"),
    transferGroupId: uuid("transfer_group_id"),
    importId: uuid("import_id"),
    fingerprint: text("fingerprint"),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("transactions_own_rows", "user_id"),
    index("transactions_account_date_idx").on(t.accountId, t.date),
    index("transactions_description_trgm_idx").using("gin", sql`${t.description} gin_trgm_ops`),
    index("transactions_fingerprint_idx").on(t.accountId, t.fingerprint),
    foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }).onDelete("cascade"),
    foreignKey({ columns: [t.occurrenceId, t.userId], foreignColumns: [occurrences.id, occurrences.userId] }),
    foreignKey({ columns: [t.importId, t.userId], foreignColumns: [imports.id, imports.userId] }),
    check("transactions_amount_bound", sql`${t.amountMinor} between -${sql.raw(String(MAX_MINOR))} and ${sql.raw(String(MAX_MINOR))}`),
  ],
).enableRLS();

export const commitments = pgTable(
  "commitments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetMinor: minor("target_minor").notNull(),
    targetDate: date("target_date", { mode: "string" }),
    linkedExpenseRuleId: uuid("linked_expense_rule_id"),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("commitments_own_rows", "user_id"),
    unique("commitments_id_user_unique").on(t.id, t.userId),
    index("commitments_user_idx").on(t.userId),
    foreignKey({ columns: [t.linkedExpenseRuleId, t.userId], foreignColumns: [expenseRules.id, expenseRules.userId] }),
    check("commitments_target_positive", sql`${t.targetMinor} > 0 and ${t.targetMinor} <= ${sql.raw(String(MAX_MINOR))}`),
  ],
).enableRLS();

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    commitmentId: uuid("commitment_id").notNull(),
    accountId: uuid("account_id").notNull(),
    amountMinor: minor("amount_minor").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    ownRows("reservations_own_rows", "user_id"),
    index("reservations_commitment_idx").on(t.commitmentId),
    foreignKey({ columns: [t.commitmentId, t.userId], foreignColumns: [commitments.id, commitments.userId] }).onDelete("cascade"),
    foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }),
    // A top-up is positive and a release is negative (COM-03), so only the bound is enforced.
    check("reservations_amount_bound", sql`${t.amountMinor} between -${sql.raw(String(MAX_MINOR))} and ${sql.raw(String(MAX_MINOR))}`),
  ],
).enableRLS();

export const scenarios = pgTable(
  "scenarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    changes: jsonb("changes").notNull(),
    createdAt: createdAt(),
  },
  (t) => [ownRows("scenarios_own_rows", "user_id"), index("scenarios_user_idx").on(t.userId)],
).enableRLS();

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    data: jsonb("data").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [ownRows("alerts_own_rows", "user_id"), index("alerts_user_idx").on(t.userId)],
).enableRLS();

// Records model and prompt_version with every output (CLAUDE.md AI rules); cached by input hash.
export const aiOutputs = pgTable(
  "ai_outputs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    inputHash: text("input_hash").notNull(),
    output: jsonb("output").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    createdAt: createdAt(),
  },
  (t) => [ownRows("ai_outputs_own_rows", "user_id"), uniqueIndex("ai_outputs_cache_unique").on(t.userId, t.kind, t.inputHash)],
).enableRLS();

// Auth.js tables. Column names follow @auth/drizzle-adapter. Auth.js runs before a user context exists,
// so the adapter uses the owner connection (src/db/admin.ts); the policies below still stop the request
// role from reading anyone's sessions or linked sign-in accounts.
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [ownRows("sessions_own_rows", "user_id"), index("sessions_user_idx").on(t.userId)],
).enableRLS();

// OAuth sign-in links (Google is added later). Named auth_accounts: "accounts" is the money accounts table.
export const authAccounts = pgTable(
  "auth_accounts",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    ownRows("auth_accounts_own_rows", "user_id"),
    index("auth_accounts_user_idx").on(t.userId),
  ],
).enableRLS();

// Credential-like tables with no user_id: no policy and no grant for the request role (see the
// revoke migration), so only the owner connection can touch them.
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
).enableRLS();

// Fixed-window counters shared by every instance. The key is a hash, never the email address.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
}).enableRLS();
