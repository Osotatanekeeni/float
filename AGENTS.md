# Float: agent rules

Read `CLAUDE.md` in this folder before doing anything. It has the full context: product, settled
decisions, stack, invariants and standards. `Float PRD.pdf` is the specification;
requirement IDs use the prefix `FLT-`.

If anything here conflicts with `CLAUDE.md`, `CLAUDE.md` wins. These are the rules that must never
be broken, repeated here for agents that only read this file:

## Always

- Write the failing test first, see it fail, then write the code.
- Work on a feature branch from `develop` (`feature/<requirement-id>-<short-name>`). Merge into
  `develop` when all checks pass; merge into `main` only when Tats asks. No pull requests.
- Commits are authored by Tats only: no `Co-Authored-By` trailers, no "Generated with" lines, no
  attribution of any kind. Never force-push or rewrite pushed history.
- No emojis anywhere. Icons from Lucide (`lucide-react`) only.
- Follow `DESIGN.md` for all UI. Safe-to-Spend counts confirmed income only. Light muted text is `#5E6862`.
- Responsive PWA, mobile first. Never React Native.
- Mobile bottom navigation uses icons (Lucide) with short labels, never text-only tabs.
- Validate every input with Zod on the server; check authorisation on the server for every route.
- Never log personal data or user content.
- AI uses OpenAI (`openai` SDK, server-side only, `OPENAI_API_KEY` from `.env`). Never expose or commit the key.

## Product invariants

1. AI never calculates. Every number shown comes from the engine.
2. The engine is pure and deterministic and gives identical results in the browser and on the server.
3. Money is integer minor units with a currency code; conversions use decimal.js and the user's stored rate, labelled with its date.
4. Safe-to-Spend never counts estimated or unconfirmed income (D1).
5. Scenarios never change real data until the user saves or applies them.
6. Any number in an AI explanation must appear in the engine payload sent to the model, or the explanation is discarded.
7. Engine changes keep every property test and worked example in the PRD passing (including the ₦167,000 Safe-to-Spend example).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
