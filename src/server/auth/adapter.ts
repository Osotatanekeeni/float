import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Db } from "@/db/client";
import { authAccounts, sessions, users, verificationTokens } from "@/db/schema";

/**
 * Auth.js adapter over Float's tables. The cast exists because our tables call .enableRLS(), which removes
 * that method from the table type while the adapter's expected types still list it. The columns do match;
 * auth-tables.int.test.ts exercises the adapter against the real tables to prove it.
 */
export function createAdapter(db: Db) {
  return DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: authAccounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  } as never);
}
