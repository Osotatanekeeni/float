# ADR 0004: Authentication with Auth.js magic links

- Status: accepted
- Date: 2026-11-05
- Requirement: PRD section 8 (authentication, access control); section 9 (rate limiting)

## Decisions

1. **Auth.js v5 (`next-auth@5.0.0-beta.32`, pinned), email magic link only.** v5 is still tagged beta on npm
   (`latest` is v4), but it is the line that supports Next 16 and the App Router. No passwords exist, so there is
   no password recovery. Google sign-in and optional TOTP come later.

2. **Database sessions, not JWTs.** A session row can be deleted, so "sign out everywhere" really ends every
   device (`signOutEverywhere`). Sessions last 30 idle days (the expiry slides forward at most daily). The cookie
   is HttpOnly, SameSite=Lax and Secure in production. Magic links work once and expire after 15 minutes.

3. **The sign-in limit (5 per 15 minutes per email) lives in Postgres**, in `rate_limits`, so it holds across
   serverless instances. One atomic upsert statement counts the attempt, so concurrent requests cannot both pass
   (tested with 12 parallel attempts over two pools). It is a fixed window, which allows a short burst of up to
   twice the limit across a boundary; accepted for sign-in links. Keys are a SHA-256 of the lower-cased email, so
   addresses are not stored in the clear. Old rows are not pruned yet; a scheduled job will.

4. **The limit is enforced inside the provider's `sendVerificationRequest`**, so it applies however a request
   arrives, not only through the form. Auth.js turns any provider error into `?error=Configuration`, so after a
   failed attempt the action calls `isOverSignInLimit` (read-only) to tell rate limiting from other failures and
   shows a specific message.

5. **Deny by default.** `proxy.ts` redirects page requests, and answers 401 to API requests, that have no session
   cookie, unless the path is on a short public list. That is only a fast first gate. Pages and handlers still
   verify the session in the database (`requireUserId`, `withAuth`), which is what authorises. A new route is
   therefore protected even if its author forgets.

6. **Credential tables are owner-only.** `verification_tokens` and `rate_limits` have RLS on, no policy and no
   grant for `float_app`; `sessions` and `auth_accounts` have the standard per-user policy. Auth.js uses the owner
   connection (`getAdminDb`), which an ESLint rule keeps out of request code. See ADR 0003.

7. **Console email transport until Resend is configured.** It prints the link, and refuses to run in production
   so a link can never reach production logs. Replacing it is one function behind the `Mailer` interface.

## Consequences

- `AUTH_SECRET` is required (32 or more characters) and validated at boot.
- Changing a route's visibility means editing the public list in `src/server/auth/access.ts`; its test fails
  for look-alike paths.
- The on-screen rate-limit message is covered by unit and integration tests of its parts, but the action itself
  needs an end-to-end test (Playwright, added with the PWA shell and CI).
