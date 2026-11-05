import { and, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { accounts } from "@/db/schema";

type NewAccount = Pick<typeof accounts.$inferInsert, "name" | "type" | "currency">;

// Every repository function takes the user id and filters on it (barrier 1); row-level security
// repeats the check in the database (barrier 2). Both must hold independently.

export async function createAccount(tx: Tx, userId: string, input: NewAccount) {
  const [row] = await tx.insert(accounts).values({ ...input, userId }).returning();
  return row;
}

export async function getAccount(tx: Tx, userId: string, id: string) {
  const [row] = await tx.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  return row;
}

export async function listAccounts(tx: Tx, userId: string) {
  return tx.select().from(accounts).where(eq(accounts.userId, userId));
}
