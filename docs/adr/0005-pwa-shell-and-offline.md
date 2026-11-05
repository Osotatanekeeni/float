# ADR 0005: PWA shell, navigation and offline policy

- Status: accepted
- Date: 2026-11-05
- Requirements: FLT-PWA-01, 02, 05, 07, 08; DESIGN.md 4, 10; CLAUDE.md shared standards

## Decisions

1. **Serwist through `@serwist/turbopack`**, so the app keeps the Turbopack build. The worker is built from
   `src/app/sw.ts` by a route handler at `/serwist/[path]`, registered by `SerwistProvider`, and disabled under
   `next dev` so development is never served stale files. `reloadOnOnline` is off: reloading when the connection
   returns would discard a half-entered amount.

2. **The service worker caches static assets and nothing else.** Hashed build files, fonts and images are cached.
   API responses and page documents are not, because they can carry personal financial data and a worker cache
   would keep it after sign-out. Navigations go through a `NetworkOnly` route (stores nothing) so that a failed
   one reaches the precached `/~offline` page instead of a browser error. Unit tests pin the policy; an e2e test
   goes offline and proves `/api/me` is neither served nor stored. The offline snapshot (FLT-PWA-03) will live in
   IndexedDB, where sign-out can clear it.

3. **Navigation is data, tested as data.** `items.ts` defines the phone tabs (Home, Timeline, Add, Accounts, More)
   and the desktop sidebar sections once. Phone tabs are Lucide icons with 11px labels, at least 56px tall (above
   the 44px minimum), with `aria-current` plus weight and a pill behind the icon so the active tab is not shown by
   colour alone, and `pb-safe` for the home indicator. At 768px the bottom bar gives way to a 224px sidebar and a top
   bar. Pages in the `(app)` group share one shell with a skip link and a single `main` landmark.

4. **Authorisation is layered.** `proxy.ts` is deny-by-default on the session cookie (ADR 0004); the `(app)` layout
   verifies the session in the database; pages that show a person's data must still call `requireUserId`, because
   layouts do not re-run on every navigation.

5. **The mark is two overlapping flowing lines** (DESIGN.md 1: no currency symbol, coin, piggy bank or arrow).
   `scripts/generate-icons.mjs` writes the vector source and the 192, 512, maskable and Apple icons with sharp; the
   maskable versions are full-bleed with the drawing inside the safe zone. A test rejects text, currency or coin
   imagery in the source.

6. **End-to-end tests run a production build against the Neon test branch** at 375, 768, 1024 and 1440px: no
   horizontal scroll, navigation by width, axe at WCAG 2.2 AA in both themes with real rendered contrast (which
   jsdom cannot measure), manifest and icons, service worker control and the offline page. The session is a real
   database row, not a bypass. Locally Chrome is used so no browser download is needed.

## Consequences

- The Add tab and the placeholder sections (`Coming soon`) point at routes whose screens arrive in later
  milestones; the quick-add sheet replaces the Add page then.
- On phones there is no theme toggle yet (it follows the system); it moves into Settings with that screen.
- WebKit and Firefox projects, and Lighthouse budgets, are added with CI.
- No install prompt, iOS guide or push yet (FLT-PWA-06 and the notification work come later).
