-- Default privileges (migration 0000) give float_app access to every new table. These two hold sign-in
-- credentials and counters and are only ever used through the owner connection, so take that access away.
REVOKE ALL ON TABLE "verification_tokens" FROM float_app;--> statement-breakpoint
REVOKE ALL ON TABLE "rate_limits" FROM float_app;
