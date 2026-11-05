import { and, eq } from "drizzle-orm";
import type { Tx } from "@/db/client";
import { users } from "@/db/schema";

export async function getProfile(tx: Tx, userId: string) {
  const [row] = await tx
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      baseCurrency: users.baseCurrency,
      timezone: users.timezone,
      bufferMinor: users.bufferMinor,
      defaultMode: users.defaultMode,
    })
    .from(users)
    .where(and(eq(users.id, userId)));
  return row;
}
