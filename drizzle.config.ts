import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Migrations need the direct (unpooled) connection.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? "" },
  entities: { roles: { provider: "neon" } },
});
