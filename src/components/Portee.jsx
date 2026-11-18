// The portée: one stroke per day of the 14-day period. Shared by onboarding
// and the header so the marks can never drift apart (same reasoning as
// severityColors.js). filled = saisi, dashed = à compléter, outlined = today,
// faint = à venir.
const TOTAL = 14

const TONES = {
  light: {
    filled: 'bg-primary',
    dashed: 'border-[1.5px] border-dashed border-primary',
    today: 'border-2 border-primary',
    todayFilled: 'bg-primary ring-2 ring-primary ring-offset-1',
    future: 'bg-primary-light',
  },
  // On the primary-coloured header.
  dark: {
    filled: 'bg-white',
    dashed: 'border-[1.5px] border-dashed border-white/80',
    today: 'border-2 border-white',
    todayFilled: 'bg-white ring-2 ring-white ring-offset-1 ring-offset-primary',
    future: 'bg-white/25',
  },
}

const plural = (n, one, many) => (n > 1 ? many : one)

// `days` is the window from buildDayWindow (ascending, ends today);
// `completeDates` the set of dates with a complete entry.
export function porteeLabel(days, completeDates, todayKey) {
  const saisis = days.filter(d => completeDates.has(d)).length
  const missing = days.filter(d => d !== todayKey && !completeDates.has(d)).length
  const future = Math.max(0, TOTAL - days.length)
  const parts = [`${saisis} ${plural(saisis, 'jour saisi', 'jours saisis')} sur ${TOTAL}`]
  if (missing > 0) parts.push(`${missing} à compléter`)
  if (days.includes(todayKey) && !completeDates.has(todayKey)) parts.push("aujourd'hui à saisir")
  if (future > 0) parts.push(`${future} à venir`)
  return parts.join(', ')
}

export default function Portee({ days, completeDates, todayKey, tone = 'light', className = '' }) {
  const t = TONES[tone]
  const future = Math.max(0, TOTAL - days.length)

  const strokeClass = (key) => {
    const done = completeDates.has(key)
    if (key === todayKey) return done ? t.todayFilled : t.today
    return done ? t.filled : t.dashed
  }

  return (
    <div
      role="img"
      aria-label={porteeLabel(days, completeDates, todayKey)}
      className={`grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1 ${className}`}
    >
      {days.slice(-TOTAL).map(key => (
        <span key={key} className={`h-2 rounded ${strokeClass(key)}`} />
      ))}
      {Array.from({ length: future }, (_, i) => (
        <span key={`future-${i}`} className={`h-2 rounded ${t.future}`} />
      ))}
    </div>
  )
}
