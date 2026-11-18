# Architecture

For product intent and roadmap, see [`PRODUCT.md`](./PRODUCT.md). This file covers how the code is put together.

## Stack

- **React 18** (function components + hooks, no state library — everything lives in `App.jsx`'s `useState`)
- **Vite 5** for dev server and build
- **Tailwind CSS 3** for styling, custom brand tokens in `tailwind.config.js`
- **Recharts 2** for the report's bar charts
- No backend, no database, no linter
- **Vitest** + React Testing Library + jsdom (unit/component/integration/a11y) and **Playwright** (E2E) — see [`TESTING.md`](./TESTING.md)

## Data flow

```
App.jsx (owns all state: { cycle, entries })
  │
  ├─ readStoredData() / persistData()  — localStorage["ammt_v2"], read once on mount, written on
  │    every mutation via persist(). Both are guarded: an unparsable/wrong-shape stored value sets
  │    loadError (renders UnreadableDataScreen instead of onboarding/tracker, and never auto-clears
  │    the key); a failed write sets saveError (renders a dismissible SaveErrorBanner) but still
  │    keeps the in-memory change — no rollback, no export, just an honest warning.
  │
  ├─ Onboarding.jsx     — shown when cycle is null; collects medicationName + dosage (required) + cycle start (today…13 days back), calls setupCycle(), which re-checks the date with isValidCycleStart()
  │
  ├─ Header.jsx          — always visible once a cycle exists; inline-editable med/dosage,
  │                         14-day entry counter (reads entries via calculations.js)
  │
  └─ two-tab body (activeTab state, no router — this is intentionally a single-page, single-route app)
       ├─ DailyCheckIn.jsx  — reads/writes today's entry via saveEntry(); local form state only,
       │                      nothing is persisted until the user submits
       └─ Report.jsx        — pure read + derive: all five report sections are computed from
                               `entries` via src/utils/calculations.js, memoized with useMemo
```

State only ever flows one way: `App.jsx` is the single source of truth, passed down as props; children call callback props (`onSave`, `onUpdateCycle`, `onReset`) to request a mutation, `App.jsx` performs it and re-persists. No context, no external state manager — appropriate at this size; revisit only if a third top-level state consumer shows up.

## `src/utils/calculations.js`

Pure functions, no side effects, all take `entries` (or a filtered subset) and return derived data for the report. This is the only place that should know about bucket boundaries, dimension keys, or trend thresholds — components should stay presentation-only and call into here rather than re-deriving stats inline.

- `getTodayKey` — today's `YYYY-MM-DD` key in the user's **local** timezone (never `toISOString()`, which is UTC and flips to tomorrow after ~19h in Montréal); every "today" in the app goes through it, including the cycle start date
- `buildDayWindow` — the single definition of "the 14-day period": today back to max(cycle start, today − 13), never in the future; drives both the `DayStrip` and the report
- `getEntriesLast14Days(entries, cycleStartDate)` — the window filter every report calculation is built on; keeps only entries whose date is in `buildDayWindow`, so it can hold fewer than 14 days on a young cycle
- `REQUIRED_ANSWERS` / `missingRequired(entry)` / `isCompleteEntry(entry)` — the one "complete entry" rule: dose time, all six dimensions and wear-off. Side effects and notes are optional. The check-in form (save gate, progress), the `DayStrip`, the header (counter + portée) and the report all go through it — only complete entries count as "saisi". No schema change: an incomplete stored entry (older data) stays as it is, it just isn't counted
- `usualDoseTime(entries, dateKey)` — `timeTaken` of the most recent entry before `dateKey`; feeds the "Comme d'habitude" chip, `null` when there's none
- `calculateWearOffTimeline` — buckets entries by hours-since-dose (0-3/3-6/6-9/9-12/12+), averages wear-off severity per bucket
- `estimateCoverageHours` — walks the timeline buckets, returns `{ kind, hours }`: `upTo` (wear-off passes "mild" in a later bucket → reliable until that bucket starts), `lessThan` (already in 0–3h → under 3h), or `atLeast` (never degrades → end of the last logged bucket, 12h+ capped at 12); `null` on an empty timeline. The report words it "jusqu'à environ / moins de / au moins Xh"
- `calculateDimensionAverages` — mean per Brown dimension across the given entries
- `calculateDayOfWeekPattern` — composite (all-dimension) average grouped by weekday
- `calculateSideEffectFrequency` — count + percentage + first-half-vs-second-half trend per side effect; the denominator is the number of complete entries in the window (an unlogged or incomplete day is unknown, not "no side effect")

`DIMENSIONS` and `SIDE_EFFECTS` (also exported from this file) are the single source of truth for both the daily form's fields and the report's labels — components map over these arrays rather than hardcoding the six/seven items twice.

## Component notes

- **`src/utils/severityColors.js`** — single source of truth for the red→amber→green severity gradient (contrast-corrected per `design.md`, replacing the earlier default-Tailwind red/yellow/green steps). `LikertScale.jsx` consumes `SEVERITY_LEVELS` directly for its 1-5 rating control (arbitrary-value Tailwind classes, e.g. `bg-[#E8C93E]`, each verified ≥4.5:1 on its own background — don't "simplify" these strings or swap in a default Tailwind color without rechecking contrast). `Report.jsx`'s `dimColor`/`wearOffColor`/`heatClass` (all exported, for testability) resolve to a step's hex (Recharts `fill`) or tint (heatmap classes) via `hexForLevel`/`tintForLevel` — each function keeps its own bucket *thresholds* (tied to on-screen legend copy), only the color *values* are shared. Don't hardcode a fourth mapping for this concept; extend this module instead.
- **`src/components/icons.jsx`** — shared SVG icon set (1.75px stroke, `currentColor`) replacing structural emoji app-wide. Callers keep the same `aria-hidden="true"` + adjacent visible label pattern the emoji it replaced used.
- **`Header.jsx`** — the only component with inline "edit mode" (medication/dosage), toggled by local `editing` state; not a modal. Shows the portée plus "N sur 14 jours" (complete entries only).
- **`Portee.jsx`** — the 14-strokes signature (filled = saisi, dashed = à compléter, outlined = today, faint = à venir), shared by onboarding and the header so the two can't drift (same reasoning as `severityColors.js`). Inputs: the day window, the set of complete dates, today; `tone="dark"` for the primary-coloured header. One text alternative (`role="img"`) describes all strokes.
- **`DailyCheckIn.jsx`'s accordion** — the local `AccordionSection` component (bottom of the file) renders one heading-wrapped toggle button plus a content `<div>` that's hidden via the native `hidden` attribute when not active, not just visually collapsed — this removes the panel from the tab order and accessibility tree, not only from view. `activeSection` state auto-advances forward once a *required* section (time, dimensions, wear-off) is complete; side effects and notes are optional and never trigger or block advance. **Required sections are enforced on save** (issue #23): the save button is always tappable, but with an answer missing it stores nothing, opens the first missing section, focuses its header and announces what's left in a polite live region. Each header is a full-width row, 44px min, with a 3px focus ring. Every header stays clickable regardless of position, so jumping back to re-open an earlier section is always one click. The header label uses sentence-case weight/size hierarchy, not an uppercase-tracked eyebrow — color only shifts with the section's own open/closed state, matching the app's "accent color = state indicator, not decoration" convention. If a similar "one open group of decisions at a time" need comes up elsewhere (the report, say), lift `AccordionSection` into its own file rather than re-implementing the pattern.
- **Styling** — Tailwind utility classes throughout, no CSS modules or styled-components. Brand tokens (`primary`, `primary-dark`, `primary-light`, `accent`, `bg` — see `design.md`) are defined once in `tailwind.config.js` and should be used instead of raw hex or default Tailwind brand-adjacent colors for brand chrome. Semantic status color (`success`/`warning`/`danger`, plus the `severityColors.js` gradient) is a separate vocabulary and never doubles as a brand token.

## Build & deploy

`npm run build` → Vite outputs static assets to `dist/` (gitignored). Deployed via Vercel's GitHub integration — push to any branch gets a preview deployment, `main` deploys to production. No `vercel.json`, no GitHub Actions workflow; Vercel auto-detects the Vite build.

## Design tooling

The [impeccable](https://github.com/pbakaus/impeccable) Claude Code skill is vendored as a git submodule (`.impeccable/`) and linked into `.claude/skills/impeccable/` (a symlink, not a copy — `git submodule update --remote` then re-running `npx impeccable link --source=.impeccable --providers=claude` picks up upstream changes). It was installed this way because the CLI's default installer (`npx impeccable install`) fetches from `impeccable.style`, which this project's typical dev/CI network policy has blocked before; the submodule route needs nothing beyond a normal `git clone`.

`PRODUCT.md` at the repo root follows impeccable's expected schema (`## Register`, `## Platform`, `## Users`, etc.) so `/impeccable audit`, `/impeccable critique`, and friends pick it up automatically — see that file for the full product context and the extra implementation-facing sections appended below its strategic template.

## Known architectural debt

- **Date navigation** is handled by `DayStrip.jsx` + a `selectedDate` state in `DailyCheckIn.jsx`; `buildDayWindow` (in `calculations.js`) computes the selectable 14-day window, and `saveEntry` dedupes by `entry.date` so any selected day is logged/edited in place.
- No error boundaries (still true — a render-time crash anywhere in the tree takes down the whole app; `localStorage` read/write failures specifically are now handled, see Data flow above).
