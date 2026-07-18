# CLAUDE.md

<!-- Lean agent rules, in the spirit of Karpathy's "agents bloat / don't push back" takes — a template, not his file. Tune it: keep what changes diffs, cut the rest. -->

**0 — What you are.** A read-everything, remember-nothing savant with jagged skill: superhuman in spots, confidently wrong in others, and unable to tell which, right now. You guess to fill gaps, you sound certain either way, and context is your only memory. Everything below follows from this.

**1 — Stay reviewable.** Generation is cheap; my verification is the bottleneck. Ship small, single-concern diffs. Stop at checkpoints before building further. Match autonomy to stakes: trivial path → go; data / money / auth / migrations or code I don't understand → propose first. Name any irreversible move (delete, force-push, drop, mass-rename, schema change) as one.

**2 — Think before typing.** State the assumptions you're acting on. Real ambiguity → give me the options and your pick, don't choose in the dark. Simpler path exists → say so first. I'm wrong → say so. Confused → name it; "I don't know X" beats a confident guess.

**3 — Simplicity = correctness, not style.** Fewer lines is a side effect, never the goal — don't golf. Before writing, take the first rung that holds:
1. Needs to exist at all? no → skip it (YAGNI)
2. Stdlib does it → use it
3. Native platform feature → use it (if it's actually good enough)
4. Already a dependency → use it
5. One honest line → one line
6. Else → the minimum that works

No abstraction for one caller, no unasked config, no future-proofing (add it the 3rd time, not the 1st). Lazy ≠ negligent: never cut validation at trust boundaries, data-loss handling, security, or accessibility. Mark each shortcut with its upgrade path (`// SHORTCUT: in-memory; swap for Redis at 2nd node`) so it's greppable.

**4 — Surgical edits.** Every changed line traces to my request, else revert. Don't tidy, reflow, or rename in passing. Match existing style. Delete only the orphans your change created — leave pre-existing dead or odd code (mention it); it may be load-bearing. Don't strip comments you don't understand.

**5 — Goals, not instructions.** Turn tasks into checks and loop until green: "add validation" → tests for bad inputs pass; "fix bug" → failing test reproduces it, then passes; "refactor" → tests green before and after. Multi-step → show the plan, one line + check each, then run it. Fuzzy goal ("make it work") → sharpen it with me first.

**6 — Keep me in control.** The real risk isn't bad code, it's me not understanding my own system. Leave a one-line "why" for non-obvious calls. Flag code I can no longer review. Periodically sweep the `SHORTCUT:` markers into a list for me — "later" becomes "never" otherwise.

**7 — This file.** Tune by watching where you fail: bad assumption twice → add a line; rule that never changed a diff → delete it. The value lives in the project facts below, not the principles above. Shorter beats complete.

## Project (fill in, keep current)
- **Stack / runtime:** React 18 + Vite 5 + Tailwind CSS 3 + Recharts 2. 100% client-side — no backend, no database, data lives in `localStorage` only. See `ARCHITECTURE.md` for the full data-flow picture and `PRODUCT.md` for why (single-user, maintenance-phase ADHD medication tracker).
- **Run / test / lint (exact commands):** `npm run dev` (dev server), `npm run build` (production build → `dist/`), `npm run preview` (preview the build). Tests: `npm test` (Vitest — unit/component/integration/a11y, fast, no browser), `npm run coverage` (coverage report), `npm run test:e2e` (Playwright golden journeys). See [`TESTING.md`](./TESTING.md). **No linter configured** — don't invent an `npm run lint` command that doesn't exist. New behavior should come with a test at the lowest layer that can cover it (pure logic → Vitest unit; a user flow → integration/E2E).
- **Non-obvious conventions:**
  - All UI copy is **French**. Match existing tone/register (conversational, not clinical) for any new strings.
  - Brand colors live in `tailwind.config.js` (`vert`, `vert-dark`, `vert-light`, `jaune`, `creme`) — use these for chrome/brand elements. Default Tailwind palette colors (red/green/yellow/etc.) are fine for semantic status (severity, success/error), but that's a *second*, separate color system — see `ARCHITECTURE.md` → Component notes for the known inconsistency between `LikertScale.jsx` and `Report.jsx`'s status-color logic; don't add a *third* one.
  - `DIMENSIONS` and `SIDE_EFFECTS` in `src/utils/calculations.js` are the single source of truth for the six Brown executive-function dimensions and seven side effects — the daily form and the report both map over these arrays. Don't hardcode the list a second time anywhere.
  - `localStorage` key is `ammt_v2` (`src/App.jsx`). Changing the entry shape without a migration path silently orphans existing data — there's exactly one real user, but it's still their real two weeks of tracking.
- **Do-not-touch files / dirs:**
  - `.impeccable/` is a **git submodule** (vendored copy of the `impeccable` design skill). Never edit files inside it directly — changes belong upstream. `.claude/skills/impeccable/` is a symlink into it, same rule.
  - `PRODUCT.md`'s **Out of scope** section (no cloud sync, no auth, no export, no data archive on reset) lists deliberate MVP decisions from the original PRD, not gaps. Don't "fix" these without checking with P-C first.
- **The one gotcha that bites everyone:** backfilling a past day is real now — the `DayStrip` in `DailyCheckIn.jsx` lets you select any day in the 14-day window (`buildDayWindow` in `calculations.js`). The subtlety: for a backfilled day the check-in time (`timeLogged`) is an *optional* field; if left empty it's stored as `''`, and `calculateWearOffTimeline` deliberately excludes empty-`timeLogged` entries from the wear-off chart rather than fabricating "now" for a past day. Today still auto-stamps `timeLogged` with the current time.
