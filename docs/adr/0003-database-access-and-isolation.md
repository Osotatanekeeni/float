# ADR 0003: Database access and per-user data isolation

- Status: accepted
- Date: 2026-11-05
- Requirement: FLT-ACC-01 (schema); PRD section 8 (access control, data isolation)

## Context

Float holds a person's whole financial picture. CLAUDE.md requires authorisation on the server for every
route, with row-level security (RLS) as a second barrier, and the connection is a pooled Neon one, so a
session is shared between requests.

## Decisions

1. **Two independent barriers, each tested alone.** Repository functions take the user id and filter on it
   (barrier 1). Every user-owned table also has an RLS policy on `user_id` (barrier 2). The isolation tests
   run the RLS cases with deliberately unfiltered SQL so a failure in one barrier cannot hide behind the other.

2. **`withUser(db, userId, fn)` is the only door to user data.** It opens a transaction, sets the user with
   `set_config('app.user_id', ..., true)` and runs `SET LOCAL ROLE float_app`. Both are transaction-local, so
   they revert at commit or rollback and cannot leak to the next request on a pooled connection (a session
   `SET` would). A test uses a one-connection pool to prove nothing carries over.

3. **RLS needs a role that cannot bypass it.** The default Neon owner role has `BYPASSRLS`, so policies would
   be a silent no-op if the app queried as that role. The first migration creates `float_app` (no login, no
   bypass, owns nothing) and grants it table privileges through default privileges; `withUser` drops to it.
   A test asserts the role is not an owner and cannot bypass, and a mutation check (removing the
   `SET LOCAL ROLE` line) was confirmed to fail seven RLS tests.

4. **Fail closed.** Policies compare `user_id` to `nullif(current_setting('app.user_id', true), '')::uuid`, so
   with no user set no row matches. Every policy has the same expression for `USING` and `WITH CHECK`, so a
   user can neither read nor plant nor reassign a row. A metadata test fails if a table with a `user_id`
   column (or `users`) lacks RLS or a policy, so a new table cannot ship unprotected.

5. **Children cannot belong to a different user than their parent.** `user_id` is denormalised onto every
   child table (so policies are a simple column check) and the foreign keys are composite, for example
   `transactions (account_id, user_id)` references `accounts (id, user_id)`. The one exception is
   `occurrences.rule_id`, which points at either income or expense rules and so cannot be a foreign key; the
   data-access layer verifies the rule's owner before creating an occurrence.

6. **Privileged access is separate and rare.** Auth.js and background jobs run before or outside a user
   context and use the owner connection directly (not `withUser`). That path is not available to request
   handlers and gets its own review when added.

7. **node-postgres (`pg`) with Drizzle**, not the Neon HTTP driver, because interactive transactions are
   required for items 2 and 3. Request handlers run on the Node runtime.

8. **Integration tests run on a dedicated Neon `test` branch**, which global setup wipes and re-migrates before
   each run (equivalent to a reset, without depending on the Neon CLI in CI). Setup refuses to run if the test
   URL points at the same database as `DATABASE_URL` or `DATABASE_URL_UNPOOLED`. Local development uses the
   `dev` branch; `main` is production.

## Consequences

- Application code must never import the owner connection into route handlers or repositories.
- New tables need `user_id`, a policy via the shared helper, composite foreign keys to user-owned parents, and
  a repository with ownership filters; the metadata test enforces the policy part.
- Amounts are `bigint` (mode number) with a check bound of 10^13 minor units, matching ADR 0001.
