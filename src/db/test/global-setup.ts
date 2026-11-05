import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { existsSync } from "node:fs";
import { Pool } from "pg";

function hostOf(url: string | undefined): string | undefined {
  try {
    return url ? new URL(url).hostname.replace("-pooler", "") : undefined;
  } catch {
    return undefined;
  }
}

// Wipes the Neon test branch and re-applies every migration, so each run starts from a known state.
// It refuses to run against anything that could be the dev or production branch.
export default async function setup() {
  if (existsSync(".env")) process.loadEnvFile(".env");

  const testUrl = process.env.TEST_DATABASE_URL_UNPOOLED;
  if (!testUrl) throw new Error("TEST_DATABASE_URL_UNPOOLED is not set; integration tests need the Neon test branch");

  const testHost = hostOf(testUrl);
  for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"] as const) {
    if (hostOf(process.env[name]) === testHost) {
      throw new Error(`Refusing to reset: TEST_DATABASE_URL_UNPOOLED points at the same database as ${name}`);
    }
  }

  const pool = new Pool({ connectionString: testUrl, max: 1 });
  try {
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
    await pool.query("CREATE SCHEMA public");
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  } finally {
    await pool.end();
  }
}
