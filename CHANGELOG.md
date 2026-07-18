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
