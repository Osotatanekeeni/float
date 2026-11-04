# Float

Personal cash-flow planning for people with irregular income (freelancers, contractors). Users enter
balances, income (with certainty) and expenses; a deterministic engine projects 90 days, shows the
lowest point, and computes a Safe-to-Spend figure. Users test "what if" scenarios before spending.

**Status:** planned, not built yet. This is a portfolio project, built by Tats with Claude.

## Source of truth

- The PRD in this folder (`Float PRD.pdf`) is the specification. If code and PRD disagree, ask which one is right; don't silently pick.
- Requirement IDs use the prefix `FLT-` (for example `FLT-XXX-01`). Reference them in commit messages, branch names and test names.
- The live, editable PRD is the Claude Docs version; the PDF is an export of it.

## Product decisions (settled — don't re-litigate without asking)

- D1 Safe-to-Spend always uses Cautious mode (confirmed income only), whatever mode the chart shows.
- D2 The headline is total Safe-to-Spend; the per-day figure is secondary.
- D3 Accounts are required; a guest demo profile needs no sign-up.
- D4 No live bank connections. Manual balances and CSV import only.
- D5 Exchange rates are entered by the user with a date. No live FX feed in the MVP.
- D6 Forecast horizon is 90 days.
- D7 AI explains and helps build scenarios; the engine computes every number.
- D8 No investment, tax or credit advice.
- Variable expenses are estimated recurring amounts, not a separate type. Insights are rule-based.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router), React, TypeScript strict, Tailwind, shadcn/ui (customised per DESIGN.md), Lucide icons |
| State | TanStack Query for server data; Zustand for unsaved scenario state |
| Forms | React Hook Form + Zod (shared with the API) |
| Backend | Next.js route handlers. No separate API, no queue |
| Forecast engine | Pure TypeScript package: recurrence, conversion, accumulation, Safe-to-Spend, scenarios. Runs in the browser and on the server |
| Recurrence | rrule.js (RFC 5545) |
| Dates | date-fns + date-fns-tz |
| Money | Integer minor units; decimal.js for rate multiplication |
| Database | Neon PostgreSQL + Drizzle, RLS per user |
| Auth | Auth.js (magic link, Google), optional TOTP |
| Background jobs | Inngest: daily forecast per user, buffer alerts, due-date reminders |
| Push | Web Push (VAPID), email fallback via Resend |

Hosting: Vercel for the web app, Neon for Postgres, Cloudflare R2 for any file storage. Monitoring: Sentry, pino, web-vitals, PostHog (IP anonymised).

## Non-negotiable invariants (never violate these; flag it if a request would)

1. AI never calculates. Every number shown comes from the engine.
2. The engine is pure and deterministic and gives identical results in the browser and on the server.
3. Money is integer minor units with a currency code; conversions use decimal.js and the user's stored rate, labelled with its date.
4. Safe-to-Spend never counts estimated or unconfirmed income (D1).
5. Scenarios never change real data until the user saves or applies them.
6. Any number in an AI explanation must appear in the engine payload sent to the model, or the explanation is discarded.
7. Engine changes keep every property test and worked example in the PRD passing (including the ₦167,000 Safe-to-Spend example).

## AI rules

- AI output is always labelled and visually distinct from verified records.
- AI never writes to the database directly. It returns a draft or a proposal; a person confirms.
- AI output is validated with a Zod schema; on failure, retry once, then show a clear error.
- Every AI feature needs a loading/streaming state, a failure state, and a non-AI path that still
  works when the model is down.
- Respect the usage limits and cost controls in the PRD. Store `model` and `prompt_version` with
  every AI output. Prompts live in the repo and are versioned.
- **AI provider: OpenAI** (decided 2026-11-04). This replaces Anthropic Claude (and Voyage AI in
  WaitWhat) wherever the PRD or DESIGN.md names them; don't ask about that conflict again.
- Use the official `openai` SDK on the server only, reading `OPENAI_API_KEY` from `.env` (plus
  `OPENAI_BASE_URL` if the key belongs to an OpenAI-compatible gateway). Use structured outputs
  (JSON schema) and tool calling where the PRD calls for them. Check current model names and SDK
  usage in OpenAI's docs before writing AI code; don't rely on memory. Keep model names in one
  config module, not scattered through the code.
- The key never reaches the browser, a client bundle, a log line, a test snapshot or a commit.

## Shared standards (all seven portfolio products)

These apply to every product in the suite. Product-specific rules above win if they conflict.

- **Platform:** responsive web app + installable PWA. Never React Native, never a native app.
  Everything core must work from a URL in a phone browser.
- **Mobile first:** design and build the 375 px layout first. Don't shrink desktop: tables become
  cards, filters go in bottom sheets, sidebars become bottom navigation, long flows become steps,
  primary actions sit within thumb reach, touch targets are at least 44 px, safe areas respected.
- **PWA:** manifest, maskable icons, standalone display, Serwist service worker, shell caching,
  offline fallback page. Respect the iOS limits table in the PRD (no install prompt, push only when
  installed on iOS 16.4+, no Background Sync) and build the listed fallbacks.
- **Bottom navigation is icon-based**, like a native mobile app: every tab is a Lucide icon with a
  short label underneath (11 to 12 px), the active tab shown by a filled or coloured icon and label.
  Never a row of text-only tabs. Each tab is at least 44 px tall, has an accessible name, and the bar
  respects the bottom safe-area inset. The design boards show text-only tabs as placeholders; build
  them with icons.
- **Every screen** has empty, loading (skeleton), error and success states. Light and dark themes.
- **Validation:** one Zod schema per input, shared by client and server. Never trust the client.
- **Authorisation:** checked on the server for every route, with row-level security as a second
  barrier. Every new endpoint gets a test that tries to access another user's or tenant's data.
- **API shape:** errors are `{ code, message, fields?, requestId }`; lists use cursor pagination.
- **Secrets:** environment variables validated with Zod at boot. Never commit secrets. `.env` is git-ignored
  (keep it ignored when scaffolding); `.env.example` lists every variable name with no values.
- **Logging:** pino with request ids. Never log personal data, financial figures tied to a person,
  document text, or AI prompts and outputs containing user content. Sentry scrubs request bodies.
- **Analytics:** PostHog with IP anonymisation; no content, names or amounts in events.
- **Accessibility:** WCAG 2.2 AA. Run axe on every new screen. Don't rely on colour alone.
- **Seed data:** keep the demo seed working. A reviewer must be able to log in as the guest and see
  a fully populated product.
- **Database:** Drizzle migrations only, never edit the database by hand. Migrations are committed
  and run in CI before deploy.

## Demo data

"Tolu", a freelancer with a naira current account, savings and a USD domiciliary account; four income sources of mixed certainty; rent reserved; a month of bills and a loan; one late payment and two saved scenarios. Guest login opens it.

## Definition of Done

- Acceptance criteria for the requirement IDs met and covered by tests.
- Permission tests for any new endpoint.
- Works at 375 px and on desktop, in light and dark; axe passes; matches DESIGN.md tokens and components.
- No personal data in logs; errors reach Sentry.
- Tests were written first and now pass.
- `tsc --noEmit`, lint and the full test suite pass. ADR added for any significant decision.
- No emojis; icons from Lucide.
- Committed on the feature branch without any co-author or attribution lines, then merged into `develop`.

## How to work with me (Tats)

- I'm a frontend engineer building this as a portfolio piece; code quality matters as much as features.
  Explain non-obvious decisions briefly in the commit message, not in long code comments.
- If a request contradicts the PRD or an invariant above, say so before doing it.
- Keep changes small and focused on one requirement at a time.
- You may add dependencies and run database migrations without asking. Prefer well-maintained
  packages, pin versions, and say in the commit message why a new dependency was added.
- Don't introduce new services or vendors (databases, queues, SaaS APIs) that aren't in the stack
  table without asking.

## Git workflow

- No pull requests.
- Branches: `main` (released), `develop` (integration), and one feature branch per feature, cut
  from `develop`, named `feature/<requirement-id>-<short-name>` (for example
  `feature/FLT-ACC-01-accounts`).
- When a feature is done and every check passes, merge it into `develop`. Merge `develop` into
  `main` only when I ask.
- Commit messages are free-form: a clear, plain description of what changed and why. Mention the
  requirement ID when the commit implements one.
- **Never add yourself as a co-author.** No `Co-Authored-By` trailers, no "Generated with Claude"
  lines, no session links or any other attribution in commits. Commits are authored by me only.
- Never force-push or rewrite history that has been pushed.

## Tests first

- Write the test before the code, every time: turn the requirement's acceptance criteria into a
  failing test, run it and confirm it fails for the right reason, then write the code to make it pass,
  then refactor.
- Engine and business logic: Vitest unit tests plus fast-check property tests where the PRD states
  an invariant. UI behaviour: React Testing Library or Playwright tests written from the acceptance
  criteria before the component.
- A bug fix starts with a test that reproduces the bug.
- Never weaken, skip or delete a failing test to make a change pass. If a test is wrong, say so.

## Icons and emojis

- **No emojis anywhere:** not in the UI, copy, toasts, empty states, code comments, commit
  messages, docs or seed data.
- **Float uses Lucide (`lucide-react`)**, as DESIGN.md specifies. All seven portfolio
  products now use Lucide. Keep shadcn/ui's Lucide imports; don't mix in
  another icon set.
- Icon-only buttons need an `aria-label` or tooltip; decorative icons get `aria-hidden`.

## Design system

`DESIGN.md` in this folder is the UI/UX and design-system specification (teal, sage and ivory
tokens for both themes, financial status colours, DM Sans and DM Mono, navigation, components,
key screens, the Safe-to-Spend panel and cash-flow river, motion, PWA and accessibility). Follow it
for every screen and component. Build it as CSS-variable tokens in the Tailwind theme and customise
shadcn/ui; never ship shadcn defaults unchanged. Keep a `/design-system` showcase page with the core
components in both themes.

Where DESIGN.md and the PRD or the rules above differ, these decisions apply:

- **Safe-to-Spend counts confirmed income only** (decision D1). DESIGN.md's sample copy ("based on
  ... expected income") is wrong for Float; the panel's label reads "Based on your current balance,
  reserved commitments and confirmed income." Expected income appears in the forecast, never in
  Safe-to-Spend.
- **Contrast fixes** (the originals fail WCAG AA for small text):
  - Light "Text muted" is `#5E6862`, not `#87918B` (that measured 2.9 to 3.3:1).
  - Dark "Text muted" is `#9AAFA6`, not `#899F96` (that measured 3.9:1 on the tertiary surface).
  - Sage `#75A99A` and the accent `#D6AA69` are decorative only (2.7 and 2.1:1 on white). If the
    accent is ever used for text on light surfaces, use `#8A6326`.
  - Create the dark-mode status colours DESIGN.md asks for and check each pair reaches 4.5:1.
- **Authentication:** Auth.js magic link and Google; no passwords, so no password recovery screen.
- **Forecast periods:** 7, 14, 30, 60 and 90 days; 90 is the maximum horizon (decision D6).
- **Offline:** cached data is labelled with its "as of" time; quick-add is queued and never shown
  as saved until the server confirms (FLT-PWA-04).
- **Mobile navigation:** Home, Timeline, Add, Accounts, More (DESIGN.md 4). The PRD is updated to match.
- **No animated money counters** (DESIGN.md 7.1). The PRD is updated to match.

## Commands

pnpm. The repo is scaffolded (Next.js App Router, `src/` layout, `@/*` alias).

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Unit tests | `pnpm test` (Vitest) |
| Type-check | `pnpm typecheck` (runs `next typegen` first, then `tsc --noEmit`) |
| Lint | `pnpm lint` |

Still to add as their branches land: Playwright (e2e), `db:migrate`, `db:seed`.

## To decide together (fill these in)

- [ ] Rounding rules for display (kobo shown or hidden?)
- [ ] Charting library for the cash-flow river and forecast (visx or Recharts?)
