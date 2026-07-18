# Testing

Regression-test strategy for AMMT, structured as a test pyramid. The app is
mostly pure calculation logic plus a handful of stateful React components, so
the pyramid is deliberately bottom-heavy: the cheap, fast unit layer carries
most of the coverage.

```
        /   E2E    \      3 golden journeys + a structural regression spec (Playwright, real browser)
       / integration \    App persistence, form → onSave, report gating
      /  component/a11y \  LikertScale, Header, DailyCheckIn, DayStrip, axe checks
     /     unit tests     \ calculations.js, severityColors.js — buckets/averages/trends/colors
```

## Running

```bash
npm test            # Vitest: unit + component + integration + a11y (fast, no browser)
npm run test:watch  # Vitest watch mode
npm run coverage    # Vitest with a v8 coverage report
npm run test:e2e    # Playwright: builds, serves, drives the golden journeys
```

`npm test` is the one to run in CI and before every commit — it needs no
browser and finishes in a few seconds. `npm run test:e2e` is the slow top layer;
run it before releasing or when touching a full user flow.

## Layers

### Unit — `src/utils/calculations.test.js`, `src/utils/severityColors.test.js`
The base of the pyramid and the highest-value tests. `calculations.js` holds all
the report math (wear-off bucketing, coverage estimation, dimension averages,
day-of-week grouping, side-effect frequency and trend) as pure functions, so it
is exhaustively covered including edge cases: a dose taken before midnight and
logged after, empty/partial entries, rounding, and the first-half/second-half
trend split. `severityColors.js` (the shared red→green severity palette) gets
its own small unit file: level ordering, `hexForLevel`/`tintForLevel` mapping,
and the out-of-range fallback. Coverage here is ~100%.

### Component / interaction — Vitest + React Testing Library + jsdom
- `LikertScale.test.jsx` — selection behavior, the accessibility contract
  (`role="group"`, per-question label, `aria-pressed`), and a lossless-extraction
  guard that the `severityColors.js` values (including the deliberate a11y
  contrast exceptions) still render exactly as before.
- `Header.test.jsx` — inline medication/dosage edit → trimmed values reported;
  cancel path.
- `DailyCheckIn.test.jsx` — filling the form calls `onSave` with the correct
  entry shape; already-logged day shows the read-only summary, not the form;
  accordion navigation (auto-advance, reopen via header); an AI-tell
  regression guard that accordion headers don't carry the uppercase-tracked
  "eyebrow" pattern.
- `DayStrip.test.jsx` — day states, selection, accessible labels, and the same
  eyebrow-pattern regression guard on its heading.
- `Report.test.jsx` — the report stays locked below 10 entries and renders its
  sections at 10+; reset requires confirmation before firing `onReset`;
  `dimColor`/`wearOffColor`/`heatClass` (exported from `Report.jsx`) tested
  directly against their documented bucket thresholds; eyebrow-pattern guard
  on the narrative caption, plus a negative guard confirming the two labels
  that were explicitly left untouched still carry it.

### Integration — `src/App.test.jsx`
Drives the real `App` with jsdom `localStorage`: onboarding persists the cycle
under `ammt_v2` and moves into the tracker; an existing cycle loads on mount;
corrupted/wrong-shape data shows the unreadable-data screen instead of
silently onboarding over it; a failed write shows a dismissible warning.

### Accessibility (non-regression) — `src/test/a11y.test.jsx`
`jest-axe` runs axe's structural checks on the onboarding screen and the daily
check-in form, locking in the accessibility work so a future change can't
silently drop an accessible name or a landmark.

**Exception worth noting**: a handful of component tests above assert the
*absence* of specific CSS classes (`uppercase`, `tracking-widest`) as a named
anti-pattern regression guard. This is a deliberate, narrow exception to the
"no pixel-styling tests" rule below — it locks in the removal of a specific,
named AI-tell, not a layout assertion.

### E2E — `e2e/journeys.spec.js` and `e2e/regression-checks.spec.js` (Playwright)

`journeys.spec.js` — three golden journeys in a real browser (Chromium):
1. Onboarding → fill the dose time → save → confirmation shown.
2. With 10 seeded entries, the report tab unlocks and renders its sections
   (this exercises the Recharts charts, which jsdom can't fully render).
3. Backfill a missed day from the 14-day strip.

`regression-checks.spec.js` — a structural regression spec, distinct in
purpose from the golden journeys above: real-browser pixel measurement
(`boundingBox()`) of touch targets (header pencil toggle, edit-mode
inputs/buttons, side-effect severity pills) and a narrow-viewport
(360px) no-horizontal-overflow check on the day-of-week heatmap. jsdom
cannot reliably measure real CSS layout, which is why these specific
assertions live at this layer instead of the component layer.

The config points Playwright at the Chromium already installed under
`/opt/pw-browsers`; elsewhere, run `npx playwright install chromium` first.

## What is deliberately not tested

- Recharts internals (third-party); chart *rendering* is smoke-covered by E2E
  journey 2, chart *data* by the `calculations.js` unit tests.
- `src/main.jsx` (the one-line React mount).
- Exact visual styling / pixel layout — out of scope for regression tests;
  contrast/accessibility is guarded structurally by the a11y layer instead,
  and the specific touch-target/overflow measurements in
  `regression-checks.spec.js` (see the exception noted above).

## Coverage targets

- `src/utils/calculations.js`, `src/utils/severityColors.js`: ~100% (pure
  logic, cheap to cover fully).
- Overall statements: ≥ 70% (currently ~84%).
- Every P0/P1 user path — onboarding+persistence, daily save, report gating,
  reset confirmation — covered at the integration or E2E layer.
