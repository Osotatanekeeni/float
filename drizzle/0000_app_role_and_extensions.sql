-- float_app is the role every request runs as (SET LOCAL ROLE in src/db/client.ts). It owns nothing and has
-- no BYPASSRLS: the default Neon owner role bypasses row-level security, so policies only bite as this role.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'float_app') THEN
    CREATE ROLE float_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;--> statement-breakpoint
-- The migrating (owner) role must be able to SET ROLE to it; PostgreSQL 16+ does not grant that by default.
GRANT float_app TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO float_app;--> statement-breakpoint
-- Tables created by later migrations (by this same role) become usable by float_app automatically;
-- row-level security still decides which rows.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO float_app;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
