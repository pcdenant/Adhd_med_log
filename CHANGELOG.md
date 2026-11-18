# Changelog

Every merged pull request on this repo, oldest first. See [`PRODUCT.md`](./PRODUCT.md) for product intent and roadmap, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the current code is put together.

## [#1](https://github.com/pcdenant/Adhd_med_log/pull/1) — 2026-04-05 — Build ADHD medication tracker app with daily form and analytics

First working version: a mobile-first vanilla JS/HTML/CSS app. Daily log form (French), behavior tracking (focus, time management, anger, social, etc.), side-effect monitoring, sleep/breakfast/timing context, `localStorage` persistence, an analytics dashboard with trend graphs and simple correlation detection (sleep → irritability, breakfast → focus).

*Superseded by [#3](https://github.com/pcdenant/Adhd_med_log/pull/3); the vanilla-JS files this PR introduced (`js/app.js`, `js/stats.js`, `css/style.css`) were removed in [#5](https://github.com/pcdenant/Adhd_med_log/pull/5) once confirmed dead.*

## [#2](https://github.com/pcdenant/Adhd_med_log/pull/2) — 2026-04-05 — Add seed data generator for testing stats visualization

`seed-data.html`: generates 30 days of realistic example data for the vanilla-JS version above, with simulated trends (medication effect improving over time) and correlations (low sleep → irritability, breakfast → better focus).

*Removed in [#5](https://github.com/pcdenant/Adhd_med_log/pull/5) along with the rest of the vanilla-JS prototype — it wrote to a different `localStorage` key than the React app that replaced it, so it had been silently non-functional against the shipped product since [#3](https://github.com/pcdenant/Adhd_med_log/pull/3).*

## [#3](https://github.com/pcdenant/Adhd_med_log/pull/3) — 2026-04-05 — Rebuild app per PRD: React + Vite + Tailwind + recharts

Full rewrite to match `ADHD_Medication_Tracker_PRD.md` (AMMT v1.0 MVP) — the version that shipped and is still the current architecture (see `ARCHITECTURE.md`). Vite + React 18 + Tailwind + Recharts; brand colors (vert/jaune/crème) and DM Sans + JetBrains Mono fonts; onboarding screen; header with inline-editable medication/dosage and a 14-day counter; daily check-in (time of dose, six Brown Likert dimensions, wear-off selector, seven side-effect checkboxes with severity, free notes, same-day edit); `localStorage` under key `ammt_v2`; the five-section 2-week report (wear-off timeline, dimension averages, day-of-week heatmap, side-effect frequency with trend, narrative synthesis); reset-cycle with confirmation.

## [#4](https://github.com/pcdenant/Adhd_med_log/pull/4) — 2026-07-18 — Install impeccable design skill for Claude Code

Added [pbakaus/impeccable](https://github.com/pbakaus/impeccable) as a git submodule (`.impeccable/`) and linked its Claude Code skill into `.claude/skills/impeccable/`, via the submodule + `link` fallback (the CLI's default installer fetches from `impeccable.style`, blocked by this environment's egress policy). Makes `/impeccable audit`, `/impeccable critique`, `/impeccable polish`, etc. available for iterating on the UI from a Claude Code session.

## [#5](https://github.com/pcdenant/Adhd_med_log/pull/5) — 2026-07-18 — Add project documentation, remove legacy prototype

Added `README.md`, `PRODUCT.md`, `ARCHITECTURE.md`, and `CLAUDE.md` — the project had no top-level documentation until this point. Reconstructed from the original `ADHD_Medication_Tracker_PRD.md`, git history, the current source, an `/impeccable audit` + `/impeccable critique` pass, and a short interview with the user. Removed `js/app.js`, `js/stats.js`, `css/style.css`, and `seed-data.html` — the pre-PRD vanilla-JS prototype from [#1](https://github.com/pcdenant/Adhd_med_log/pull/1)/[#2](https://github.com/pcdenant/Adhd_med_log/pull/2), confirmed dead and unreferenced by the shipped app.

## [#6](https://github.com/pcdenant/Adhd_med_log/pull/6) — 2026-07-18 — Add CHANGELOG.md with PR-by-PR project history

Added this file, covering [#1](https://github.com/pcdenant/Adhd_med_log/pull/1)–[#5](https://github.com/pcdenant/Adhd_med_log/pull/5), and linked it from `README.md`. Dates and numbers come from the GitHub PR list; cross-references (what superseded or removed what) were checked against file history.

## [#7](https://github.com/pcdenant/Adhd_med_log/pull/7) — 2026-07-18 — Accessibility and contrast pass on the UI

The low-risk half of the first `/impeccable audit` + `/impeccable critique`. `aria-label` on inputs and icon-only buttons; Likert scales as labelled `role="group"` with `aria-pressed` on each value (the app had zero `aria`/`role` attributes before); muted text moved from `gray-400`/`gray-300` to `gray-500` and inactive Likert numbers darkened to pass contrast; `<header>`/`<main>` landmarks; decorative emoji `aria-hidden`; `role="status"` on the save confirmation.

## [#8](https://github.com/pcdenant/Adhd_med_log/pull/8) — 2026-07-18 — Add regression test suite (test pyramid)

First tests in the project. Vitest + React Testing Library + jsdom for unit (`calculations.js` at ~100%), component and integration tests, `jest-axe` for a11y non-regression, and Playwright for two golden journeys in a real browser. New scripts `npm test`, `npm run coverage`, `npm run test:e2e`; strategy in `TESTING.md`. Also fixed the onboarding labels, which weren't tied to their inputs.

## [#9](https://github.com/pcdenant/Adhd_med_log/pull/9) — 2026-07-18 — Missed-day catch-up: log or edit any day in the 14-day window (P0)

The check-in could only target today, so a missed day was a permanent gap. Added `DayStrip` (14-day grid; missing days are neutral, never red) and `buildDayWindow` in `calculations.js`. A past day can be logged or edited; its check-in time (`timeLogged`) is optional and stored as `''` when empty, which keeps it out of the wear-off chart instead of inventing "now". Third Playwright journey added.

## [#10](https://github.com/pcdenant/Adhd_med_log/pull/10) — 2026-07-18 — Split the daily check-in into an auto-advancing accordion (P1)

The daily form showed every field at once. It's now an accordion: one section open at a time (hidden with the native `hidden` attribute), required sections auto-advance to the next, optional ones (side effects, notes) never block. Every header stays clickable, collapsed sections show a summary, and a small "X/5" progress indicator sits in the date header.

## [#11](https://github.com/pcdenant/Adhd_med_log/pull/11) — 2026-07-18 — Harden localStorage against silent data loss (P1)

Unreadable stored data used to look like a new user, and the next save overwrote it. `readStoredData()` now tells "nothing stored" from "stored but unreadable"; the latter shows `UnreadableDataScreen`, which clears only after a two-step confirmation. All writes go through `persist()`, which never throws: a failed write keeps the in-memory change and shows a dismissible `SaveErrorBanner`. No export added (out of scope per `PRODUCT.md`).

## [#12](https://github.com/pcdenant/Adhd_med_log/pull/12) — 2026-07-18 — Export impeccable audit + critique as a static backlog HTML

Added `backlog.html`: a self-contained, filterable list of the July 18 audit/critique findings with their merge status (10 merged, 4 open, 2 deferred to the roadmap). Opens directly in a browser; not part of the Vite build.

## [#13](https://github.com/pcdenant/Adhd_med_log/pull/13) — 2026-07-18 — Batch-fix the 4 remaining P2/P3 backlog items (adapt/quieter/extract)

Closed the backlog's open list. Touch targets enlarged (the header pencil button now 44×44); the repeated uppercase "eyebrow" headings replaced with a distinct treatment per location; severity colors extracted to `src/utils/severityColors.js` as the single source of truth for `LikertScale` and the report; the day-of-week heatmap sized mobile-first so it fits at 360px. New Playwright checks measure touch targets and heatmap overflow in a real browser.

## [#15](https://github.com/pcdenant/Adhd_med_log/pull/15) — 2026-07-19 — Migrate design system to Option B (Portée douce) + Style 3 (Accessible & Ethical)

New visual system, documented in `design.md`. Lavender/sage palette with brand tokens renamed (`vert`/`vert-dark`/`vert-light`/`jaune`/`creme` → `primary`/`primary-dark`/`primary-light`/`accent`/`bg`); Lora for titles, Atkinson Hyperlegible for body, JetBrains Mono unchanged; structural emoji replaced by an SVG icon set (`src/components/icons.jsx`); severity gradient retuned so every step passes 4.5:1; report charts show a number next to each color. No change to the data model or scope.

## [#16](https://github.com/pcdenant/Adhd_med_log/pull/16) — 2026-08-15 — Rapport : accès aux tendances et notes dès le jour 1

Removed the lock that hid the whole report below 10 entries: sections A–E now render from the first entry, with a discreet "les tendances se préciseront avec plus de données" note under 10. Added section F, Notes, listing free-text notes newest first (`calculateNotesTimeline()` in `calculations.js`); until then, notes could not be read back once saved.

## [#17](https://github.com/pcdenant/Adhd_med_log/pull/17) — 2026-11-18 — Fix 4 wrong numbers in the report and daily check-in

Four wrong numbers, each fixed with a test that failed first. Today's date used UTC, so evening check-ins in Montréal were filed under the next day; `getTodayKey()` now uses local time (no migration of existing entries) and tests run in `America/Toronto`. The report window was 15 days; it now uses `buildDayWindow`, the same 14 days as the DayStrip. Side-effect counts said "3/14 jours" with a % computed on logged entries; they now read "3/5 saisies (60%)". The coverage estimate now says "jusqu'à environ Xh", "au moins Xh" or "moins de 3h" instead of a single misleading figure.

## [#18](https://github.com/pcdenant/Adhd_med_log/pull/18) — 2026-11-18 — Report: fix two wrong claims (wear-off label, weekly pattern)

Two wrong claims from the Unslopovich mock-up diagnostic. The wear-off label called an average of 2.0 "Essoufflement fort" although 2 means "Léger" on the axis; label and icon now round to the nearest axis point, like the tooltip. The weekly pattern said a weekday was "systématiquement le jour le plus difficile" from a single entry; a weekday now needs at least 2 entries, and the text reads "le jour le plus difficile sur la période (… sur N saisies)".

## [#19](https://github.com/pcdenant/Adhd_med_log/pull/19) — 2026-11-18 — Changelog: add entries for #6 to #18

Caught this file up: it stopped at [#5](https://github.com/pcdenant/Adhd_med_log/pull/5). One entry per merged PR from [#6](https://github.com/pcdenant/Adhd_med_log/pull/6) to [#18](https://github.com/pcdenant/Adhd_med_log/pull/18), sourced from each PR's description and merge date. #14 was skipped because it was still open.

## [#21](https://github.com/pcdenant/Adhd_med_log/pull/21) — 2026-11-18 — Onboarding: required fields and a real cycle start date

Closes [#20](https://github.com/pcdenant/Adhd_med_log/issues/20). Medication and dosage are now required: an empty or spaces-only field shows an error next to it and nothing is stored, so "Non spécifié" can no longer reach the report. New "Premier jour du suivi" choice (Aujourd'hui, Hier, or a date up to 13 days back): past days appear as "à compléter" in the day strip right away. `setupCycle` re-checks the date with `isValidCycleStart` and falls back to today; the 13-day rule is one shared constant (`MAX_DAYS_BACK`) also used by `buildDayWindow`. The screen shows a portée preview that follows the chosen start day, and fields are 16px+ (no iOS zoom), with readable helper text, a 3px focus ring and 44px+ targets. No schema change: `cycleStartDate` already existed, it can now be in the past.
