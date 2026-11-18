// Brown's 6 executive function dimensions
export const DIMENSIONS = [
  {
    key: 'focus',
    label: 'Focus & Attention',
    question: "Je garde mon focus et passe d'une tâche à l'autre quand nécessaire ?",
    lowLabel: "Aucune concentration",
    highLabel: "Vif et flexible",
  },
  {
    key: 'taskInitiation',
    label: 'Initiation des tâches',
    question: "Je démarre et termine mes tâches sans rester bloqué(e) ?",
    lowLabel: "Bloqué(e), impossible",
    highLabel: "Démare et finit sans problème",
  },
  {
    key: 'emotionalRegulation',
    label: 'Régulation émotionnelle',
    question: "Je gère la frustration et mon humeur sans réagir brusquement ?",
    lowLabel: "Très réactif(ve)",
    highLabel: "Calme, bien géré",
  },
  {
    key: 'impulseControl',
    label: 'Contrôle des impulsions',
    question: "Je fais une pause avant d'agir ou de parler ?",
    lowLabel: "J'agis impulsivement",
    highLabel: "Bonne pause avant d'agir",
  },
  {
    key: 'workingMemory',
    label: 'Mémoire de travail',
    question: "Je retiens les infos, tâches et objets à leur place ?",
    lowLabel: "J'oublie tout",
    highLabel: "Clair et organisé(e)",
  },
  {
    key: 'timeAwareness',
    label: 'Sens du temps',
    question: "Je perçois le temps qui passe et reste dans les horaires ?",
    lowLabel: "Cécité temporelle",
    highLabel: "Bon sens du temps",
  },
]

// Side effects to track
export const SIDE_EFFECTS = [
  { key: 'appetiteSuppression', label: "Suppression d'appétit / repas manqués" },
  { key: 'sleepDifficulty', label: "Difficulté à dormir / mauvaise qualité du sommeil" },
  { key: 'headache', label: "Maux de tête" },
  { key: 'moodChanges', label: "Changements d'humeur (apathie, tristesse)" },
  { key: 'irritabilityRebound', label: "Irritabilité / rebond de crash" },
  { key: 'anxiety', label: "Anxiété (nouvelle ou accrue)" },
  { key: 'physicalSymptoms', label: "Symptômes physiques (estomac, rythme cardiaque, bouche sèche)" },
]

export const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

// Today's entry key (YYYY-MM-DD) in the user's LOCAL timezone. Kept here so
// the daily form and the missing-day window agree on what "today" is.
// Not toISOString(): that's UTC, which in Montréal flips to tomorrow after 19h.
export function getTodayKey() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Shift a YYYY-MM-DD key by whole days, anchored at UTC noon so the result is
// timezone-independent and never lands on a DST edge.
export function shiftKey(key, delta) {
  const d = new Date(key + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().split('T')[0]
}

// The window is today plus this many days back (= 14 days). Shared by the day
// window and by onboarding's start-date limits so the two can't drift apart.
export const MAX_DAYS_BACK = 13

// Allowed cycle start dates at onboarding: today back to today - MAX_DAYS_BACK.
export function cycleStartBounds(todayKey = getTodayKey()) {
  return { min: shiftKey(todayKey, -MAX_DAYS_BACK), max: todayKey }
}

// Whole days from `key` to `todayKey` (0 = today). Both are YYYY-MM-DD.
export function daysBefore(key, todayKey = getTodayKey()) {
  return Math.round((new Date(todayKey + 'T12:00:00Z') - new Date(key + 'T12:00:00Z')) / 86400000)
}

// A start date the cycle may use: a real YYYY-MM-DD inside cycleStartBounds.
export function isValidCycleStart(key, todayKey = getTodayKey()) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  if (Number.isNaN(new Date(key + 'T12:00:00Z').getTime())) return false // e.g. 2026-13-45
  if (shiftKey(key, 0) !== key) return false // e.g. 2026-02-31 rolls into March
  const { min, max } = cycleStartBounds(todayKey)
  return key >= min && key <= max
}

// Ascending list of date keys for the report window: `today` back to
// max(cycleStartDate, today - 13), capped at 14 days and never in the future.
// This is the set of days the user is allowed to log or backfill.
export function buildDayWindow(cycleStartDate, todayKey = getTodayKey()) {
  let start = shiftKey(todayKey, -MAX_DAYS_BACK)
  if (cycleStartDate && cycleStartDate > start) start = cycleStartDate
  if (start > todayKey) start = todayKey
  const keys = []
  for (let cursor = start; cursor <= todayKey; cursor = shiftKey(cursor, 1)) {
    keys.push(cursor)
  }
  return keys
}

// Entries inside the report window — the same 14 days the DayStrip shows
// (buildDayWindow), so the report and the strip never disagree on "the period".
export function getEntriesLast14Days(entries, cycleStartDate) {
  const window = new Set(buildDayWindow(cycleStartDate))
  return entries.filter(e => window.has(e.date))
}

// The three required answers of a daily entry, in form order. Side effects and
// notes are optional and never make an entry incomplete.
export const REQUIRED_ANSWERS = [
  { key: 'time', label: 'heure de prise' },
  { key: 'dimensions', label: 'fonctions exécutives' },
  { key: 'wearOff', label: 'essoufflement' },
]

const isTime = (v) => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)

// Keys of REQUIRED_ANSWERS still missing from `entry`, in form order. The one
// definition of "complete" — the form, the day strip, the header and the
// report all go through this.
export function missingRequired(entry) {
  const missing = []
  if (!isTime(entry?.timeTaken)) missing.push('time')
  if (!DIMENSIONS.every(d => typeof entry?.dimensions?.[d.key] === 'number')) missing.push('dimensions')
  if (!['none', 'mild', 'strong'].includes(entry?.wearOff)) missing.push('wearOff')
  return missing
}

export function isCompleteEntry(entry) {
  return missingRequired(entry).length === 0
}

// The usual dose time offered as a one-tap chip: `timeTaken` of the most
// recent entry dated before `dateKey` that has one. null when there is none.
export function usualDoseTime(entries, dateKey) {
  const previous = entries
    .filter(e => e.date < dateKey && isTime(e.timeTaken))
    .sort((a, b) => b.date.localeCompare(a.date))
  return previous[0]?.timeTaken ?? null
}

// Convert HH:MM string to minutes since midnight
export function timeToMinutes(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// Section A: Wear-off timeline
// Groups entries by hours elapsed (check-in time - medication time)
// Returns buckets with average wear-off severity
export function calculateWearOffTimeline(entries) {
  const wearOffMap = { none: 1, mild: 2, strong: 3 }

  const buckets = [
    { label: '0–3h', min: 0, max: 180 },
    { label: '3–6h', min: 180, max: 360 },
    { label: '6–9h', min: 360, max: 540 },
    { label: '9–12h', min: 540, max: 720 },
    { label: '12h+', min: 720, max: Infinity },
  ]

  const bucketData = buckets.map(bucket => {
    const matching = entries.filter(e => {
      if (!e.timeTaken || !e.timeLogged || !e.wearOff) return false
      const takenMin = timeToMinutes(e.timeTaken)
      const loggedMin = timeToMinutes(e.timeLogged)
      let elapsed = loggedMin - takenMin
      if (elapsed < 0) elapsed += 24 * 60 // handle midnight crossing
      return elapsed >= bucket.min && elapsed < bucket.max
    })

    if (matching.length === 0) return null

    const avgWearOff =
      matching.reduce((sum, e) => sum + wearOffMap[e.wearOff], 0) / matching.length

    return {
      label: bucket.label,
      avgWearOff: Math.round(avgWearOff * 10) / 10,
      noneCount: matching.filter(e => e.wearOff === 'none').length,
      mildCount: matching.filter(e => e.wearOff === 'mild').length,
      strongCount: matching.filter(e => e.wearOff === 'strong').length,
      total: matching.length,
    }
  })

  return bucketData.filter(Boolean)
}

// Estimate how long the medication provides reliable coverage.
// Returns { kind, hours } so the report can say how sure the number is:
//   upTo     — degrades in a later bucket: reliable until that bucket starts
//   lessThan — degrades already in 0–3h: under 3h
//   atLeast  — never degrades: at least until the last logged bucket ends
//              (12h+ is open-ended, so capped at 12)
export function estimateCoverageHours(wearOffTimeline) {
  if (!wearOffTimeline.length) return null

  const bucketHours = {
    '0–3h': [0, 3], '3–6h': [3, 6], '6–9h': [6, 9], '9–12h': [9, 12], '12h+': [12, 12],
  }

  for (const bucket of wearOffTimeline) {
    // avgWearOff > 1.5 means wear-off starting (between none and mild)
    if (bucket.avgWearOff > 1.5) {
      const [start, end] = bucketHours[bucket.label]
      return start === 0 ? { kind: 'lessThan', hours: end } : { kind: 'upTo', hours: start }
    }
  }
  const last = wearOffTimeline[wearOffTimeline.length - 1]
  return { kind: 'atLeast', hours: bucketHours[last.label][1] }
}

// Section B: Average each dimension across entries
export function calculateDimensionAverages(entries) {
  return DIMENSIONS.map(dim => {
    const vals = entries
      .map(e => e.dimensions?.[dim.key])
      .filter(v => v != null && typeof v === 'number')

    if (vals.length === 0) return { ...dim, avg: null, count: 0 }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return { ...dim, avg: Math.round(avg * 10) / 10, count: vals.length }
  })
}

// Section C: Average composite score grouped by day of week (0=Sun … 6=Sat)
export function calculateDayOfWeekPattern(entries) {
  const days = Array.from({ length: 7 }, (_, i) => ({ day: i, scores: [] }))

  entries.forEach(e => {
    const dow = new Date(e.date + 'T12:00:00').getDay()
    const dimScores = DIMENSIONS.map(d => e.dimensions?.[d.key]).filter(v => v != null)
    if (dimScores.length > 0) {
      const avg = dimScores.reduce((a, b) => a + b, 0) / dimScores.length
      days[dow].scores.push(avg)
    }
  })

  return days.map(d => ({
    day: d.day,
    label: DAYS_SHORT[d.day],
    fullLabel: DAYS_FULL[d.day],
    avg:
      d.scores.length > 0
        ? Math.round((d.scores.reduce((a, b) => a + b, 0) / d.scores.length) * 10) / 10
        : null,
    count: d.scores.length,
  }))
}

// Section F: Chronological free-text notes, most recent first
export function calculateNotesTimeline(entries) {
  return entries
    .filter(e => e.notes)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(e => ({ date: e.date, notes: e.notes }))
}

// Section D: Frequency and trend of each side effect
export function calculateSideEffectFrequency(entries) {
  const n = entries.length
  if (n === 0) return SIDE_EFFECTS.map(se => ({ ...se, count: 0, pct: 0, trend: 'stable' }))

  // Split into first and second halves to detect trend
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const half = Math.ceil(sorted.length / 2)
  const firstHalf = sorted.slice(0, half)
  const secondHalf = sorted.slice(half)

  return SIDE_EFFECTS.map(se => {
    const count = entries.filter(e => e.sideEffects?.[se.key]).length
    const pct = Math.round((count / n) * 100)

    const firstRate =
      firstHalf.length > 0
        ? firstHalf.filter(e => e.sideEffects?.[se.key]).length / firstHalf.length
        : 0
    const secondRate =
      secondHalf.length > 0
        ? secondHalf.filter(e => e.sideEffects?.[se.key]).length / secondHalf.length
        : 0

    let trend = 'stable'
    if (secondRate > firstRate + 0.15) trend = 'increasing'
    else if (secondRate < firstRate - 0.15) trend = 'decreasing'

    return { ...se, count, pct, trend }
  })
}
