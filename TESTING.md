# Testing

Regression-test strategy for AMMT, structured as a test pyramid. The app is
mostly pure calculation logic plus a handful of stateful React components, so
the pyramid is deliberately bottom-heavy: the cheap, fast unit layer carries
most of the coverage.

```
        /   E2E    \      2 golden journeys (Playwright, real browser)
       / integration \    App persistence, form → onSave, report gating
      /  component/a11y \  LikertScale, Header, DailyCheckIn, axe checks
     /     unit tests     \ calculations.js — all buckets/averages/trends
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

### Unit — `src/utils/calculations.test.js`
The base of the pyramid and the highest-value tests. `calculations.js` holds all
the report math (wear-off bucketing, coverage estimation, dimension averages,
day-of-week grouping, side-effect frequency and trend) as pure functions, so it
is exhaustively covered including edge cases: a dose taken before midnight and
logged after, empty/partial entries, rounding, and the first-half/second-half
trend split. Coverage here is ~100%.

### Component / interaction — Vitest + React Testing Library + jsdom
- `LikertScale.test.jsx` — selection behavior **and** the accessibility contract
  (`role="group"`, per-question label, `aria-pressed`).
- `Header.test.jsx` — inline medication/dosage edit → trimmed values reported;
  cancel path.
- `DailyCheckIn.test.jsx` — filling the form calls `onSave` with the correct
  entry shape; already-logged day shows the read-only summary, not the form.
- `Report.test.jsx` — the report stays locked below 10 entries and renders its
  sections at 10+; reset requires confirmation before firing `onReset`.

### Integration — `src/App.test.jsx`
Drives the real `App` with jsdom `localStorage`: onboarding persists the cycle
under `ammt_v2` and moves into the tracker; an existing cycle loads on mount.

### Accessibility (non-regression) — `src/test/a11y.test.jsx`
`jest-axe` runs axe's structural checks on the onboarding screen and the daily
check-in form, locking in the accessibility work so a future change can't
silently drop an accessible name or a landmark.

### E2E — `e2e/journeys.spec.js` (Playwright)
Two golden journeys in a real browser (Chromium):
1. Onboarding → fill the dose time → save → confirmation shown.
2. With 10 seeded entries, the report tab unlocks and renders its sections
   (this exercises the Recharts charts, which jsdom can't fully render).

The config points Playwright at the Chromium already installed under
`/opt/pw-browsers`; elsewhere, run `npx playwright install chromium` first.

## What is deliberately not tested

- Recharts internals (third-party); chart *rendering* is smoke-covered by E2E
  journey 2, chart *data* by the `calculations.js` unit tests.
- `src/main.jsx` (the one-line React mount).
- Exact visual styling / pixel layout — out of scope for regression tests;
  contrast/accessibility is guarded structurally by the a11y layer instead.

## Coverage targets

- `src/utils/calculations.js`: ~100% (pure logic, cheap to cover fully).
- Overall statements: ≥ 70% (currently ~84%).
- Every P0/P1 user path — onboarding+persistence, daily save, report gating,
  reset confirmation — covered at the integration or E2E layer.
