# ADHD Medication Maintenance Tracker (AMMT)

A local-only web app for tracking how well an established ADHD medication is working, over a 14-day cycle, so the data can support a real conversation with a physician instead of guesswork.

One daily check-in (under 3 minutes), a 2-week report with wear-off timeline, executive-function dimension scores, a day-of-week difficulty pattern, side-effect frequency, and an auto-generated narrative summary. Everything lives in the browser's `localStorage` — no account, no cloud, no backend.

See [`PRODUCT.md`](./PRODUCT.md) for the full product spec and roadmap, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the code is put together, [`CLAUDE.md`](./CLAUDE.md) for agent working rules on this repo, [`CHANGELOG.md`](./CHANGELOG.md) for the PR-by-PR history, [`TESTING.md`](./TESTING.md) for the test strategy, and [`backlog.html`](./backlog.html) (open in a browser) for the impeccable audit/critique findings with merge status, for picking the next fix in a future session.

## Stack

React 18 + Vite 5 + Tailwind CSS 3 + Recharts 2. No backend, no database — `localStorage` only. Tested with Vitest + React Testing Library (unit/component/integration/a11y) and Playwright (E2E) — see [`TESTING.md`](./TESTING.md). No linter configured.

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
npm test          # unit + component + integration + a11y (Vitest, fast)
npm run coverage  # test run with a coverage report
npm run test:e2e  # end-to-end golden journeys (Playwright)
```

## Deployment

Auto-deployed to [Vercel](https://vercel.com/pcdenants-projects/adhd-med-log) on push via the standard GitHub integration — no `vercel.json`, no CI workflow file. Every PR gets its own preview deployment.

## Design tooling

This repo has the [impeccable](https://github.com/pbakaus/impeccable) Claude Code skill installed (vendored as a git submodule at `.impeccable/`, linked into `.claude/skills/impeccable/`). Use `/impeccable audit`, `/impeccable critique`, `/impeccable polish`, etc. from a Claude Code session in this repo to iterate on the UI.

## Privacy

Data never leaves the device. No authentication, no cloud sync, no third-party tracking. Anyone with access to the browser/device can see the data — the user is responsible for device security.
