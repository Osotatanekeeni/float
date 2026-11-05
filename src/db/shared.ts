import "server-only";
import { createDb } from "@/db/client";
import { getEnv } from "@/lib/env";

// One pool per server instance, kept on globalThis so dev hot-reload does not open a new pool each time.
const store = globalThis as unknown as { __floatDb?: ReturnType<typeof createDb> };

export function sharedDb() {
  store.__floatDb ??= createDb(getEnv().DATABASE_URL, { max: 5 });
  return store.__floatDb.db;
}
