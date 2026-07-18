# Product

## Register

product

## Platform

web

## Users

The primary and only user is P-C (Pierre-Cyril Denant), an adult with ADHD on established, maintenance-phase medication — not titrating a new dose. His profile: activation challenges, attention variability, working-memory gaps, and time-awareness issues. He needs a single low-friction daily check-in and a clear 14-day synthesis he can bring to a physician appointment. He uses the app on his own local device only; there is no other user, no shared or multi-tenant use case in scope.

## Product Purpose

Eliminate guesswork about whether an established ADHD medication is still working. AMMT converts one daily, under-3-minute check-in into a 14-day, physician-ready synthesis: how many hours the medication reliably covers, which of Brown's six executive-function dimensions it actually helps, which day of the week is hardest, and which side effects are emerging or worsening. Success is P-C walking into an appointment able to say "here's how my medication is performing" instead of relying on scattered memory.

## Positioning

A maintenance-phase medication journal, not a titration tool or a diagnostic instrument. Every design decision optimizes for a single, forgiving daily entry point — the underlying research (see below) recommends 2-3 check-ins a day for validated symptom tracking, and that was deliberately rejected as friction a person with attention and task-initiation challenges won't sustain. Depth of clinical rigor is traded for consistency of logging.

## Brand Personality

Clinical but not cold: calm, quietly confident (deep green + yellow accents on a warm cream background). No gamification, no streak-shaming, no consumer-habit-tracker energy. It should read as a private medical tool, not a lifestyle app.

## Anti-references

Not a habit-tracker (Streaks, Habitica) — no gamification, no guilt-inducing empty states. Not a titration/dosing calculator — no medical advice, no dosage suggestions, no clinical diagnosis. Not a general-purpose mood tracker (Daylio, Bearable) — purpose-built around Brown's six executive-function dimensions and wear-off timing, not generic customizable symptoms.

## Design Principles

1. **One entry point a day, always.** Friction is the enemy of data completeness for this user; every feature request gets weighed against whether it adds a decision to the daily check-in.
2. **Data over memory.** The report exists to replace anecdote with a physician-legible synthesis; every metric must map to something sayable out loud in an appointment.
3. **Local and disposable by design.** No cloud, no login, no export in the MVP — the tool's simplicity is a privacy feature, not a limitation to apologize for.
4. **Honest locked states, not hidden ones.** The report tab stays visible before the 10-entry threshold, with a live progress bar, rather than disabling or hiding it.

## Accessibility & Inclusion

No formal WCAG target was set at MVP. Given the target audience (ADHD adults — attention, working-memory, and task-initiation challenges are the whole point of the product), the working target going forward is **WCAG 2.1 AA plus explicit cognitive-load discipline** (≤4 visible decisions per screen, chunked/progressive daily form). An audit and design critique run July 2026 found the current implementation well short of that: zero `aria-`/`role` attributes anywhere in the code, three form inputs with no `<label>`, ~17 instances of sub-4.5:1 gray-on-white text, and a daily check-in form that presents 6+7 decisions in one unbroken scroll. See **Known Gaps & Roadmap** below.

---

## Product Detail

*(Everything below this line is implementation-facing detail, kept in this file so agents and future-P-C don't have to reconstruct it from code. Not part of impeccable's strategic template — safe to skip if you only need the design-facing sections above.)*

### Origin

Built from a validated-research pass (`ADHD_Medication_Tracking_Research.md` — surveyed 14 existing ADHD tracking tools and expert models from Brown, Barkley, and Dodson) distilled into `ADHD_Medication_Tracker_PRD.md` (v1.0 MVP, April 2026). The research recommended 2-3 check-ins/day at validated intervals; the PRD deliberately simplified that to **one** daily check-in for P-C's actual maintenance-phase use case. The app was first built as a vanilla JS prototype, then rebuilt in React/Vite per the PRD (`git log`: `9fc618f` → `fc04612`). The vanilla-JS prototype (`js/`, `css/style.css`, `seed-data.html`, using a different `localStorage` key) was removed during the July 2026 documentation pass — it predated the PRD and had drifted out of sync with the shipped data model.

### Problem statement

Before this tool, P-C had no systematic way to evaluate whether his established medication remained optimally effective. Observations were anecdotal and hard to bring to an appointment — no way to see how long the medication actually lasted, which executive-function domains it helped vs. left untouched, whether specific days were consistently worse, or whether side effects were emerging or worsening. Medical conversations were guesswork.

### Core requirements (as shipped)

**Setup (once per cycle):** medication name, dosage, cycle start date — shown persistently in the header, editable inline.

**Daily check-in (`src/components/DailyCheckIn.jsx`, < 3 min):**
- Time medication was taken (HH:MM)
- Six Likert 1-5 ratings, Brown's executive-function dimensions (`src/utils/calculations.js`: `DIMENSIONS`) — focus & attention, task initiation, emotional regulation, impulse control, working memory, time awareness
- Wear-off / rebound: none · mild · strong
- Seven yes/no side effects with optional Léger/Modéré/Sévère severity (`SIDE_EFFECTS`)
- Free notes, 500 characters
- One entry per calendar day; re-visiting an already-saved day shows a read-only summary with an edit option. A 14-day strip (`DayStrip`) at the top of the check-in lets the user select **any day in the report window** to log or edit it, defaulting to today. For a backfilled past day the check-in time is an optional field (empty = excluded from the wear-off chart, never fabricated).

**2-week report (`src/components/Report.jsx`, unlocks at ≥10 entries in the trailing 14 days):**
- **A. Wear-off timeline** — entries bucketed by hours elapsed since dose (0-3h/3-6h/6-9h/9-12h/12h+), averaged wear-off severity per bucket, used to estimate reliable coverage hours
- **B. Dimension averages** — 14-day mean per Brown dimension, flags anything averaging < 2.5 as a persistent challenge
- **C. Day-of-week pattern** — composite score by weekday, heatmap
- **D. Side-effect frequency** — count/14 days per side effect, first-half vs. second-half trend (increasing/decreasing/stable)
- **E. Narrative synthesis** — auto-generated prose summary plus a "points à discuter avec le médecin" checklist, meant to be read at or brought to an appointment

**Reset:** wipes all entries and restarts the cycle date, keeps medication/dosage, requires a confirm click. This is intentionally irreversible in the MVP — see Out of scope.

### Data model

`localStorage` key **`ammt_v2`** (`src/App.jsx`). Shape as actually implemented (differs slightly from the original PRD draft — this is the source of truth):

```js
{
  cycle: {
    medicationName: string,
    dosage: string,
    cycleStartDate: "YYYY-MM-DD",
    createdAt: ISO8601 string,
  },
  entries: [
    {
      date: "YYYY-MM-DD",           // unique key per entry
      timeTaken: "HH:MM",
      timeLogged: "HH:MM",           // when the check-in was actually saved
      dimensions: {
        focus, taskInitiation, emotionalRegulation,
        impulseControl, workingMemory, timeAwareness  // each 1-5 or null
      },
      wearOff: "none" | "mild" | "strong" | null,
      sideEffects: {
        appetiteSuppression, sleepDifficulty, headache,
        moodChanges, irritabilityRebound, anxiety, physicalSymptoms  // booleans
      },
      sideEffectSeverity: { [sideEffectKey]: "Léger" | "Modéré" | "Sévère" },
      notes: string,  // ≤ 500 chars
    },
  ],
}
```

No cloud sync, no authentication, no third-party tracking. Data never leaves the device; the user is responsible for their own device security and backups.

### Out of scope (deliberate, not gaps)

Per the original PRD, these are intentional MVP exclusions, not oversights — don't "fix" them without checking with P-C first:
- Cloud sync / account / authentication
- Export to PDF/CSV, physician sharing/integration, email reports (product register explicitly favors "local and disposable" — see Design Principles)
- Multi-medication tracking, medication comparison
- Data archive on reset (reset = permanent data loss, by design, behind a confirm click)
- Native mobile app
- Statistical significance testing, wear-off/side-effect correlation analysis
- Calendar view

### Known Gaps & Roadmap

An `/impeccable audit` and `/impeccable critique` pass (July 2026) surfaced real gaps the original PRD didn't anticipate, on top of the PRD's own stated future ideas. Merged into one priority list:

**Near-term (found by audit/critique, not in original PRD):**
- ~~**[P0]** No way to log or edit a day other than today~~ — **shipped**: the 14-day `DayStrip` lets the user backfill/edit any day in the report window.
- **[P1]** Daily check-in is a monolithic, undivided scroll (6 + 7 decisions at once) — cognitive-load checklist scored 4/8 failures for a user population defined by difficulty sustaining exactly that kind of task
- ~~**[P1]** Silent data loss~~ — **shipped**: unreadable stored data now shows a dedicated screen instead of silently reading as "new user" (and never auto-clears — only an explicit, confirmed action does); a failed write shows a dismissible warning banner instead of vanishing. Still intentionally no export — that stays out of scope per the section above.
- **[P2]** Zero accessibility semantics (`aria-`/`role`) anywhere in the code, most notably on the Likert scale — the single most-repeated interaction, 6×/day
- **[P2]** ~17 instances of sub-AA gray-on-white text; inconsistent status-color logic duplicated across `Report.jsx` and `LikertScale.jsx`

**Longer-term (from the original PRD's "Future Iterations"):**
- Multi-cycle archive / multi-month trend tracking (currently reset = data loss)
- Correlation analysis: day-of-week difficulty vs. sleep/stress; side-effect vs. dose timing
- Wear-off prediction ("your medication typically lasts X ± 30min")
- Export to PDF for physician visits
- Dark mode
- Native mobile app
- Sequential medication comparison

### Glossary

- **Brown's Six Dimensions** — executive-function clusters (Focus, Task Initiation, Emotional Regulation, Impulse Control, Working Memory, Time Awareness) from Thomas Brown's model of ADHD
- **Wear-off** — perceived decline in medication effectiveness; rebound symptoms
- **Cycle** — the 14-day tracking period; reset to begin a new one
- **Maintenance phase** — stable medication dose, ongoing efficacy monitoring (not titration)
- **AMMT** — ADHD Medication Maintenance Tracker, the product's working name in the original PRD
