CREATE TYPE "public"."account_type" AS ENUM('bank', 'savings', 'cash', 'foreign', 'other');--> statement-breakpoint
CREATE TYPE "public"."certainty" AS ENUM('confirmed', 'estimated', 'uncertain');--> statement-breakpoint
CREATE TYPE "public"."expense_kind" AS ENUM('bill', 'subscription', 'debt', 'variable', 'planned', 'one_time');--> statement-breakpoint
CREATE TYPE "public"."forecast_mode" AS ENUM('cautious', 'expected', 'optimistic');--> statement-breakpoint
CREATE TYPE "public"."occurrence_status" AS ENUM('expected', 'received', 'paid', 'late', 'skipped', 'missed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."transaction_kind" AS ENUM('income', 'expense', 'transfer_in', 'transfer_out', 'adjustment');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"currency" char(3) NOT NULL,
	"include_in_forecast" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "accounts_name_length" CHECK (char_length("accounts"."name") between 1 and 60),
	CONSTRAINT "accounts_currency_format" CHECK ("accounts"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"input_hash" text NOT NULL,
	"output" jsonb NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_outputs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_minor" bigint NOT NULL,
	"target_date" date,
	"linked_expense_rule_id" uuid,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commitments_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "commitments_target_positive" CHECK ("commitments"."target_minor" > 0 and "commitments"."target_minor" <= 10000000000000)
);
--> statement-breakpoint
ALTER TABLE "commitments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "expense_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"kind" "expense_kind" NOT NULL,
	"category" text,
	"rrule" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_rules_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "expense_amount_positive" CHECK ("expense_rules"."amount_minor" > 0 and "expense_rules"."amount_minor" <= 10000000000000),
	CONSTRAINT "expense_end_after_start" CHECK ("expense_rules"."end_date" is null or "expense_rules"."end_date" > "expense_rules"."start_date")
);
--> statement-breakpoint
ALTER TABLE "expense_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_currency" char(3) NOT NULL,
	"to_currency" char(3) NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"effective_date" date NOT NULL,
	"source_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fx_rates_positive" CHECK ("fx_rates"."rate" > 0),
	CONSTRAINT "fx_rates_distinct" CHECK ("fx_rates"."from_currency" <> "fx_rates"."to_currency")
);
--> statement-breakpoint
ALTER TABLE "fx_rates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"file_hash" text NOT NULL,
	"row_count" bigint NOT NULL,
	"mapping" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "imports_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "imports_account_file_unique" UNIQUE("account_id","file_hash")
);
--> statement-breakpoint
ALTER TABLE "imports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"amount_max_minor" bigint,
	"rrule" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"certainty" "certainty" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "income_sources_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "income_amount_positive" CHECK ("income_sources"."amount_minor" > 0 and "income_sources"."amount_minor" <= 10000000000000),
	CONSTRAINT "income_range_order" CHECK ("income_sources"."amount_max_minor" is null or "income_sources"."amount_max_minor" >= "income_sources"."amount_minor"),
	CONSTRAINT "income_end_after_start" CHECK ("income_sources"."end_date" is null or "income_sources"."end_date" > "income_sources"."start_date")
);
--> statement-breakpoint
ALTER TABLE "income_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rule_type" "rule_type" NOT NULL,
	"rule_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"status" "occurrence_status" DEFAULT 'expected' NOT NULL,
	"actual_date" date,
	"actual_amount_minor" bigint,
	"override_amount_minor" bigint,
	"override_certainty" "certainty",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "occurrences_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "occurrences_rule_date_unique" UNIQUE("rule_type","rule_id","scheduled_date")
);
--> statement-breakpoint
ALTER TABLE "occurrences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"commitment_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_amount_bound" CHECK ("reservations"."amount_minor" between -10000000000000 and 10000000000000)
);
--> statement-breakpoint
ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"changes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount_minor" bigint NOT NULL,
	"kind" "transaction_kind" NOT NULL,
	"category" text,
	"description" text,
	"occurrence_id" uuid,
	"transfer_group_id" uuid,
	"import_id" uuid,
	"fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_amount_bound" CHECK ("transactions"."amount_minor" between -10000000000000 and 10000000000000)
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"base_currency" char(3) DEFAULT 'NGN' NOT NULL,
	"timezone" text DEFAULT 'Africa/Lagos' NOT NULL,
	"buffer_minor" bigint DEFAULT 0 NOT NULL,
	"default_mode" "forecast_mode" DEFAULT 'cautious' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_buffer_nonneg" CHECK ("users"."buffer_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_outputs" ADD CONSTRAINT "ai_outputs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_linked_expense_rule_id_user_id_expense_rules_id_user_id_fk" FOREIGN KEY ("linked_expense_rule_id","user_id") REFERENCES "public"."expense_rules"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_rules" ADD CONSTRAINT "expense_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_rules" ADD CONSTRAINT "expense_rules_account_id_user_id_accounts_id_user_id_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."accounts"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imports" ADD CONSTRAINT "imports_account_id_user_id_accounts_id_user_id_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."accounts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_account_id_user_id_accounts_id_user_id_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."accounts"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_commitment_id_user_id_commitments_id_user_id_fk" FOREIGN KEY ("commitment_id","user_id") REFERENCES "public"."commitments"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_account_id_user_id_accounts_id_user_id_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."accounts"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_user_id_accounts_id_user_id_fk" FOREIGN KEY ("account_id","user_id") REFERENCES "public"."accounts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_occurrence_id_user_id_occurrences_id_user_id_fk" FOREIGN KEY ("occurrence_id","user_id") REFERENCES "public"."occurrences"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_id_user_id_imports_id_user_id_fk" FOREIGN KEY ("import_id","user_id") REFERENCES "public"."imports"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_outputs_cache_unique" ON "ai_outputs" USING btree ("user_id","kind","input_hash");--> statement-breakpoint
CREATE INDEX "alerts_user_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "commitments_user_idx" ON "commitments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "expense_rules_user_idx" ON "expense_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fx_rates_lookup_idx" ON "fx_rates" USING btree ("user_id","from_currency","to_currency","effective_date");--> statement-breakpoint
CREATE INDEX "income_sources_user_idx" ON "income_sources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "occurrences_user_date_idx" ON "occurrences" USING btree ("user_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "reservations_commitment_idx" ON "reservations" USING btree ("commitment_id");--> statement-breakpoint
CREATE INDEX "scenarios_user_idx" ON "scenarios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_account_date_idx" ON "transactions" USING btree ("account_id","date");--> statement-breakpoint
CREATE INDEX "transactions_description_trgm_idx" ON "transactions" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "transactions_fingerprint_idx" ON "transactions" USING btree ("account_id","fingerprint");--> statement-breakpoint
CREATE POLICY "accounts_own_rows" ON "accounts" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "ai_outputs_own_rows" ON "ai_outputs" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "alerts_own_rows" ON "alerts" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "commitments_own_rows" ON "commitments" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "expense_rules_own_rows" ON "expense_rules" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "fx_rates_own_rows" ON "fx_rates" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "imports_own_rows" ON "imports" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "income_sources_own_rows" ON "income_sources" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "occurrences_own_rows" ON "occurrences" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "reservations_own_rows" ON "reservations" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "scenarios_own_rows" ON "scenarios" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "transactions_own_rows" ON "transactions" AS PERMISSIVE FOR ALL TO "float_app" USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "users_own_row" ON "users" AS PERMISSIVE FOR ALL TO "float_app" USING (id = nullif(current_setting('app.user_id', true), '')::uuid) WITH CHECK (id = nullif(current_setting('app.user_id', true), '')::uuid);