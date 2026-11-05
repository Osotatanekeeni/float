# ADR 0001: Forecast engine package, money and date representation

- Status: accepted
- Date: 2026-11-05
- Milestone: M0 (money and date helpers)

## Context

The forecast engine must be pure, deterministic and identical in the browser and on the server
(invariant 2). Money is integer minor units with a currency code, converted with decimal.js at the
user's stored rate (invariant 3). Dates are anchored to the user's chosen timezone, and the PRD's
test matrix requires that no item shifts day around midnight.

## Decisions

1. **The engine is a pnpm workspace package, `@float/engine` (`packages/engine`).** It ships
   TypeScript source with no build step; Next.js compiles it via `transpilePackages`. An ESLint
   block forbids React, Next, `node:*` and app (`@/*`) imports, `Date.now()`, `new Date()` with no
   arguments and `Math.random()` inside it, so purity is enforced, not just intended. The clock is
   always passed in.

2. **Minor units are `number`, checked to stay within `Number.MAX_SAFE_INTEGER`.** The PRD bounds
   amounts at plus or minus ₦100 billion (10^13 kobo), far inside 2^53. Every operation throws
   rather than silently losing precision. `bigint` was rejected: it does not serialise to JSON,
   complicates Zod schemas, Drizzle mappings and React rendering, and buys nothing within the
   bounded range.

3. **Currency exponents come from an explicit table, not `Intl`.** ICU data differs between
   browsers and Node versions; a table guarantees the same answer everywhere. Adding a currency is
   a one-line change with a test.

4. **Conversion rounds half to even exactly once**, using a private `Decimal.clone` so no other
   code can change its rounding mode. Rates are decimal strings (numeric 18,8), never floats. Every
   conversion returns the rate it used so its date can be shown.

5. **Engine dates are `CalendarDate` strings (`YYYY-MM-DD`)**, not `Date` objects. Arithmetic runs
   on UTC epoch days, so host timezone and DST cannot move a date. The only timezone-aware step is
   `todayIn(timeZone, instant)`, which uses date-fns-tz. Recurrence expansion (rrule.js) arrives in
   M1 and will produce `CalendarDate`s.

## Consequences

- The app formats money for display separately (that depends on the open "kobo shown or hidden?"
  decision); the engine only provides exact `toMajorString` for inputs and serialisation.
- Engine coverage is enforced at 95% (lines, branches, functions, statements) and fast-check runs
  1,000 cases per property.
- If amounts ever need to exceed 2^53 minor units, moving to `bigint` is contained to `money.ts`.
