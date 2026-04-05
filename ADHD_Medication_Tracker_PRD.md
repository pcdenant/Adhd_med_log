# PRD: ADHD Medication Maintenance Tracker

**Product Name:** ADHD Medication Maintenance Tracker (AMMT)

**Version:** 1.0 MVP

**Author:** P-C (Pierre-Cyril Denant)

**Date:** April 2026

**Status:** Specification

---

## 1. OVERVIEW

A **local web app** for self-monitoring ADHD medication effectiveness during maintenance phase (established medication, ongoing efficacy evaluation). Designed for **one daily check-in** with minimal friction, generating a **2-week synthesis report** to support physician conversations.

**Core value:** Eliminate guesswork about medication effectiveness. Quantify which executive function dimensions improve, detect wear-off patterns, identify recurring difficult days, and document persistent symptoms and side effects—all in a format ready for medical discussion.

**Non-goal:** This is not a titration tool. Not a clinical diagnostic instrument. Not cloud-based. Not for export/sharing.

---

## 2. USER PROFILE

**Primary user:** P-C (adult with ADHD, stable on established medication)

**User context:**
- Self-tracking for maintenance phase (not dose optimization)
- ADHD profile: activation challenges, attention variability, working memory gaps, time awareness issues
- Needs: low-friction daily logging, fast pattern recognition, clear synthesis for medical appointments
- Constraint: Single daily check-in only (3x daily = friction failure)
- Environment: Local device, private, no account/cloud sync

---

## 3. PROBLEM STATEMENT

**Current state:** P-C has no systematic way to evaluate whether his established medication remains optimally effective. Observations are anecdotal, scattered, and difficult to communicate to his physician. He cannot distinguish:
- How long the medication actually works each day (onset to wear-off)
- Which executive function domains benefit most vs. remain problematic
- Whether certain days of the week or circumstances trigger worse outcomes
- Whether side effects are emerging or worsening over time
- What persistent gaps remain even on medication

**Consequence:** Medical appointments involve guesswork. Dose adjustments (if needed) are made without data. P-C cannot defend whether the current regimen is "actually working."

**Desired state:** After 14 days of simple daily logging, P-C has a clear one-page synthesis showing medication efficacy, wear-off timeline, symptom patterns, and side-effect trends. He brings this to his physician and says, "Here's how my medication is performing."

---

## 4. CORE REQUIREMENTS

### 4.1 Medication Context (Persistent Across Sessions)

**Header Section — Displayed at top of app, editable once per cycle**

- [ ] Medication name (text input)
- [ ] Dosage (text input, e.g., "20mg XR")
- [ ] Cycle start date (auto-set to today on first launch, or manually editable)

**Rationale:** These remain constant for 2 weeks. User should see them clearly on every check-in as context.

---

### 4.2 Daily Check-In (< 3 minutes)

**Designed for speed. Single entry per day, any time of day.**

#### 4.2.1 Time of Medication Administration

- [ ] **Input:** Time taken (HH:MM format, 24-hour clock)
- [ ] **Requirement:** Variable per day (not pre-filled; user enters daily)
- [ ] **Placement:** First field (sets the "zero hour" for wear-off calculation)

#### 4.2.2 Brown's Six Executive Function Dimensions

**Presented as six questions, Likert 1–5 scale.** Language is conversational, not clinical. Each dimension should feel like a simple self-check, not a diagnostic assessment.

1. **Focus & Attention**
   - Question: *"Can I keep my focus and switch between tasks when I need to?"*
   - Scale: 1 (Can't focus at all today) → 5 (Sharp and flexible all day)

2. **Task Initiation**
   - Question: *"Am I able to start and finish tasks, or do I get stuck?"*
   - Scale: 1 (Stuck, can't get going) → 5 (Start and finish without trouble)

3. **Emotional Regulation**
   - Question: *"Am I managing frustration and mood, or getting snappy/reactive?"*
   - Scale: 1 (Very reactive, frustrated easily) → 5 (Calm, handle frustration well)

4. **Impulse Control**
   - Question: *"Am I acting/speaking without thinking, or pausing okay?"*
   - Scale: 1 (Jumping in constantly) → 5 (Good pause before acting)

5. **Working Memory**
   - Question: *"Can I keep track of info, tasks, and where things are?"*
   - Scale: 1 (Forgetting everything) → 5 (Clear and organized)

6. **Time Awareness**
   - Question: *"Can I sense time passing and stay on schedule?"*
   - Scale: 1 (Time blindness all day) → 5 (Good sense of time, on schedule)

**Interaction:** Radio buttons or slider for each. Visual feedback (color gradient 1=red, 5=green optional but helpful).

#### 4.2.3 Wear-Off / Rebound Detection

- [ ] **Question:** *"How is the medication working right now?"*
- [ ] **Options:**
  - None (medication still working fully)
  - Mild (starting to notice wear-off, still mostly effective)
  - Strong (clear rebound or wear-off, noticeably weaker)
- [ ] **Placement:** After the six dimensions
- [ ] **Rationale:** Gives explicit rebound signal that aggregates into wear-off timeline

#### 4.2.4 Side Effects Check

**Seven yes/no items.** Checkbox format. Only "yes" requires data entry (optional severity note).

- [ ] Appetite suppression or skipped meals
- [ ] Difficulty falling asleep or poor sleep quality
- [ ] Headache
- [ ] Mood changes (flatness, sadness)
- [ ] Irritability or rebound crash
- [ ] Anxiety (new or increased)
- [ ] Physical symptoms (stomach, heart rate, dry mouth)

**Interaction:** Checkboxes. If checked, optional dropdown or text: "Mild / Moderate / Severe" (optional).

#### 4.2.5 Free-Text Notes

- [ ] **Input:** Text area
- [ ] **Prompt:** *"Anything else today? (e.g., stress, sleep quality, other observations)"*
- [ ] **Character limit:** 500 (for later display in report context)
- [ ] **Requirement:** Optional

#### 4.2.6 Save & Confirmation

- [ ] **Button:** "Log Today" (primary action)
- [ ] **Feedback:** "✓ Logged for [date]" with timestamp
- [ ] **UX:** Allow editing today's entry if user revisits before midnight (optional refinement)

---

### 4.3 Two-Week Synthesis Report (On-Demand)

**Triggered by "Generate 2-Week Report" button.** Displays a one-page synthesis suitable for discussion with physician.

#### 4.3.1 Report Scope

- **Time window:** Last 14 calendar days from today (or from cycle start, whichever is >= 14 days)
- **Minimum data:** Require ≥ 10 entries to generate report (handles missing days gracefully)
- **Display format:** Single-page scrollable HTML (no PDF export, local view only)

#### 4.3.2 Report Sections

##### A. Medication Efficacy Timeline (Wear-Off Pattern)

**What it shows:** When the medication starts working and when it wears off, averaged across the 14 days.

**Data source:** Aggregation of:
- Time of medication administration (HH:MM)
- Time of check-in entry (HH:MM)
- "Wear-off" yes/no/mild/strong response

**Calculation:**
1. For each entry, calculate **hours elapsed** = (check-in time) − (medication time)
2. Group by hours elapsed (e.g., 1–3 hours, 3–6 hours, 6–9 hours, 9–12 hours)
3. For each group, calculate average "wear-off" severity (None=1, Mild=2, Strong=3)
4. Plot a simple curve: X-axis = hours post-dose, Y-axis = wear-off onset

**Visual:** Simple line chart or bar chart. Example output:
```
Medication effectiveness over time (average across 14 days):
1–3h:   Fully working (no wear-off detected)
3–6h:   Fully working (no wear-off detected)
6–9h:   Mild wear-off starting (~30% of days)
9–12h:  Strong wear-off (~70% of days)

Estimate: Medication provides reliable coverage ~6–7 hours. Wear-off typically begins after 6 hours, strong by hour 9.
```

**Clinical note:** This replaces guesswork with data. Physician can see exactly where gaps exist.

---

##### B. Executive Function Dimension Performance (14-Day Averages)

**What it shows:** Which Brown dimensions improve most on medication, and which remain problematic.

**Data source:** All six Likert scores across 14 days.

**Calculation:**
1. Average each dimension (mean of 14 entries)
2. Rank by average score (highest to lowest)
3. Flag any dimension averaging < 2.5 as "persistent challenge"

**Visual:** Bar chart or ranked list with color coding (red < 2.5, yellow 2.5–3.5, green > 3.5)

**Example output:**
```
Dimension Performance (14-day average):

1. Impulse Control        — 4.2 ★★★★☆ (best controlled)
2. Time Awareness         — 3.8 ★★★★☆ (good)
3. Focus & Attention      — 3.5 ★★★☆☆ (moderate)
4. Emotional Regulation   — 3.2 ★★★☆☆ (moderate)
5. Task Initiation        — 2.4 ⚠️  (persistent challenge)
6. Working Memory         — 2.1 ⚠️  (persistent challenge)

Summary: Medication effectively manages impulse control and time awareness. Task initiation and working memory remain difficult even on medication — may warrant combination strategy or different molecule class discussion.
```

---

##### C. Weekly Difficulty Pattern (Day-of-Week Heatmap)

**What it shows:** Are certain days of the week consistently harder?

**Data source:** All six dimension scores grouped by day of week (Mon–Sun).

**Calculation:**
1. For each day of week, average the six dimensions across all occurrences in 14 days
2. Create a simple heatmap or table showing which days score lowest

**Visual:** Table or heatmap (red=hard day, green=easy day)

**Example output:**
```
Day-of-Week Difficulty Pattern:

Monday     ████░░ 3.1 (hardest)
Tuesday    █████░ 3.4
Wednesday  ██████ 3.7
Thursday   ██████ 3.6
Friday     █████░ 3.4
Saturday   ███████ 3.9 (easiest)
Sunday     ██████ 3.7

Pattern: Monday and Tuesday are consistently harder. Possible driver: weekend recovery deficit or stress cycle. Discuss with physician.
```

---

##### D. Side Effect Frequency & Trends

**What it shows:** Which side effects are most common, and whether they're worsening.

**Data source:** All yes/no checks across 14 days.

**Calculation:**
1. Count frequency of each side effect (X out of 14 days)
2. Optional: Flag if frequency is increasing (first 7 days vs. last 7 days)

**Visual:** Bar chart or simple list

**Example output:**
```
Side Effects (14-day frequency):

Headache                    — 8/14 days (57%) ⚠️ increasing
Appetite suppression        — 6/14 days (43%)
Sleep difficulty            — 5/14 days (36%)
Anxiety                      — 2/14 days (14%)
Irritability/rebound        — 3/14 days (21%)
Mood flatness               — 1/14 day (7%)
Physical symptoms           — 2/14 days (14%)

Most concerning: Headache frequency is increasing (5/7 first week → 3/7 second week is declining, or vice versa). Discuss with physician.
```

---

##### E. Narrative Synthesis

**What it shows:** A human-readable summary for the doctor.

**Template (auto-generated):**

```
─────────────────────────────────────
MEDICATION MAINTENANCE CHECK-IN
2-Week Summary | [Medication Name] [Dosage]
Reported by: P-C | Period: [Start Date] → [End Date]
─────────────────────────────────────

MEDICATION EFFICACY:
The medication provides reliable coverage for approximately [X–Y hours] after administration. Wear-off begins around hour [X], becoming noticeable by hour [Y]. Coverage gaps appear: [describe any timing issues].

WHAT'S WORKING WELL:
[List top 2–3 dimensions with scores > 3.5]
- [Dimension] (avg [X.X]/5) — noticeably improved on medication

PERSISTENT CHALLENGES:
[List any dimension with score < 2.5]
- [Dimension] (avg [X.X]/5) — remains difficult even on medication
- Possible driver: [based on pattern or notes]

RECURRING DIFFICULTY:
[Day of week or pattern]
- [Monday/Tuesday/Weekends] consistently score [X.X]/5 vs. [Y.Y]/5 overall
- Possible correlation: [from notes, e.g., "stress day", "recovery day"]

SIDE EFFECTS:
[Most frequent side effects and any changes]
- [Side effect] appears on [X%] of days
- [Side effect] is [increasing/decreasing/stable]

NEXT STEPS FOR DISCUSSION:
- Continue current dosage? [yes/no/unsure]
- Adjust timing? [yes/no/unsure]
- Consider combination therapy for [persistent dimension]? [yes/no/unsure]
- Any medication changes to explore? [yes/no/unsure]

─────────────────────────────────────
```

---

#### 4.3.3 Report Controls

- [ ] **Button "Generate 2-Week Report":** Appears after ≥ 10 entries
- [ ] **Button "Reset & Start New Cycle":** Clears all data, prompts confirmation ("Are you sure? This cannot be undone."), keeps medication/dosage in header
- [ ] **Refresh data:** Report recalculates if user adds new entries after generation

---

## 5. DATA MODEL & STORAGE

### 5.1 Local Storage

**Technology:** Browser localStorage (or IndexedDB for larger datasets in future)

**Data structure:**

```javascript
{
  "cycle": {
    "medicationName": "Concerta",
    "dosage": "20mg XR",
    "cycleStartDate": "2026-04-05",
    "createdAt": "2026-04-05T10:30:00Z"
  },
  "entries": [
    {
      "date": "2026-04-05",
      "timeTaken": "07:30",
      "timeLogged": "17:45",
      "dimensions": {
        "focus": 4,
        "taskInitiation": 2,
        "emotionalRegulation": 3,
        "impulseControl": 4,
        "workingMemory": 2,
        "timeAwareness": 3
      },
      "wearOff": "mild",
      "sideEffects": {
        "appetiteSuppressionSkipped": false,
        "sleepDifficulty": true,
        "headache": true,
        "moodChanges": false,
        "irritabilityRebound": true,
        "anxiety": false,
        "physicalSymptoms": false
      },
      "sideEffectSeverity": {
        "sleepDifficulty": "mild",
        "headache": "moderate"
      },
      "notes": "Stressful day at work. Noticed wear-off starting around 4pm."
    }
  ]
}
```

**Storage capacity:** Browser localStorage typically 5–10MB. For 365 days of entries, this is well within limits (~50KB/entry max).

**Persistence:** Data persists across browser sessions on the same device. User should manually back up (export to JSON) if paranoid.

---

### 5.2 Data Privacy

- **No cloud sync.** Data never leaves the device.
- **No authentication.** Anyone with device access can view. User is responsible for device security.
- **No third-party tracking.**

---

## 6. TECHNICAL SPECIFICATIONS

### 6.1 Tech Stack

- **Frontend:** React 18+ (functional components, hooks)
- **Styling:** Tailwind CSS (matching P-C's existing projects: vert #006946, jaune #FFF200, crème #FBF3EB, DM Sans body, JetBrains Mono for numeric values)
- **Charts:** recharts (simple line/bar charts for wear-off and dimension performance)
- **Build & Deploy:** Vite (fast dev, local static file)
- **Storage:** localStorage / IndexedDB

### 6.2 Supported Platforms

- **Desktop browsers:** Chrome, Safari, Firefox (latest 2 versions)
- **Mobile browsers:** iOS Safari, Chrome Android (responsive design)
- **Offline:** Works fully offline (no internet required after initial load)

### 6.3 Performance Targets

- **Initial load:** < 2s
- **Daily check-in save:** < 500ms
- **Report generation (14 days):** < 1s

---

## 7. USER FLOWS

### 7.1 Initial Setup

1. User opens app for the first time
2. Sees onboarding screen: "Let's set up your medication tracker"
3. Enters: Medication name, dosage (both text inputs, optional save)
4. System sets cycle start date = today
5. Prompts: "Ready to log today?"
6. User proceeds to daily check-in

### 7.2 Daily Check-In

1. User opens app
2. App detects: Is today already logged? 
   - If yes: Show "Already logged today at [time]. Want to edit?" (allow edit)
   - If no: Show blank daily form
3. User enters: time taken, six dimensions (1–5), wear-off (3 options), side effects (checkboxes), notes (optional)
4. Clicks "Log Today"
5. System saves to localStorage, shows "✓ Logged for [date]"
6. User sees: "Days logged: 10/14" or "Report available!" (once ≥10 entries)

### 7.3 Report Generation

1. User clicks "Generate 2-Week Report"
2. System validates: ≥10 entries in last 14 days
3. If not enough data: "Need [X] more entries to generate report. You have [Y]."
4. If valid: Displays full report (Sections A–E from 4.3.2)
5. User can scroll, read, take screenshots (for physician)
6. Report updates if user adds new entries

### 7.4 Reset Cycle

1. User clicks "Reset & Start New Cycle"
2. Confirmation: "Clear all entries? (Medication/dosage will be saved.)"
3. If confirmed: Wipes all entries, resets cycle start date = today, returns to daily check-in
4. Previous cycle data is gone (no archive feature for MVP)

---

## 8. ACCEPTANCE CRITERIA

### 8.1 Functional

- [ ] User can enter medication name, dosage, cycle start date on first load
- [ ] User can log daily check-in with all six dimensions, wear-off status, side effects, notes
- [ ] User can generate a report after ≥10 entries with all five sections (A–E)
- [ ] Report displays wear-off timeline, dimension averages, day-of-week pattern, side effect frequency, narrative
- [ ] User can reset cycle and start new tracking period
- [ ] Data persists across browser restarts (localStorage)
- [ ] All content fits on one scrollable page (report is "printable" mentally)

### 8.2 UX / Friction

- [ ] Daily check-in is completable in < 3 minutes
- [ ] No form validation delays (real-time, forgiving)
- [ ] Clear visual feedback for saved entries
- [ ] Report is immediately readable without medical training

### 8.3 Accuracy

- [ ] Wear-off timeline accurately reflects time delta (hours post-dose) vs. wear-off severity
- [ ] Dimension averages are correctly calculated
- [ ] Day-of-week pattern groups entries by actual calendar day
- [ ] Side effect frequency counts correctly

---

## 9. OUT OF SCOPE (MVP)

- Cloud sync / backup
- Export to PDF (local view only)
- Multi-medication tracking
- User authentication
- Data archive (reset = data loss)
- Mobile app native build
- Email reports
- Physician integration / sharing
- Statistical significance testing
- Correlation analysis (wear-off vs. side effects)
- Calendar view

---

## 10. SUCCESS METRICS

**User goal:**
- After 2 weeks, P-C has a clear, data-backed synthesis to discuss with physician
- He can articulate: "My medication works for X hours, but these two dimensions remain difficult"
- Physician engagement: "This data helps me make better decisions"

**Product metrics (if scaled):**
- Time to generate usable report: < 2 minutes after click
- User retention: Can user sustain daily logging without drop-off?
- Report clarity: Can user understand it without annotation?

---

## 11. FUTURE ITERATIONS

**Post-MVP enhancements (not in scope):**
- Multi-month trend tracking (archive old cycles)
- Correlation: Does day-of-week difficulty correlate with sleep? Stress? (analysis dashboard)
- Wear-off prediction: "Your medication typically lasts X±30min"
- Side effect correlation: "Headaches appear in Y% of high-stress days"
- Export to PDF for physician
- Dark mode
- Mobile app (iOS/Android)
- Medication comparison (track two meds sequentially, side-by-side)

---

## 12. GLOSSARY

- **Brown's Six Dimensions:** Executive function clusters (Focus, Task Initiation, Emotion, Impulse, Memory, Time Awareness) from Thomas Brown's model of ADHD
- **Wear-off:** Perceived decline in medication effectiveness; rebound symptoms
- **Cycle:** 14-day tracking period; reset to begin new cycle
- **Maintenance phase:** Stable medication dose, ongoing efficacy monitoring (not titration)
- **Synthesis report:** One-page summary of 14-day data for physician discussion

---

**END OF PRD**
