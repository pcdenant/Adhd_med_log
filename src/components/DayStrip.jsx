const WEEKDAY_INITIAL = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

// UTC-anchored so the label matches the UTC-noon keys from buildDayWindow.
function parts(key) {
  const d = new Date(key + 'T12:00:00Z')
  return { dow: d.getUTCDay(), dayNum: d.getUTCDate() }
}

function fullDate(key) {
  return new Date(key + 'T12:00:00Z').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function cellClasses(isSelected, logged, isToday) {
  const base =
    'rounded-xl py-2 min-h-[44px] text-center transition-colors focus:outline-none focus:ring-2 focus:ring-vert focus:ring-offset-1'
  if (isSelected) return `${base} bg-vert text-white ring-2 ring-vert ring-offset-1`
  const today = isToday ? ' ring-1 ring-vert' : ''
  if (logged) return `${base} bg-vert-light text-vert-dark hover:bg-vert-light/70${today}`
  return `${base} bg-white border border-gray-200 text-gray-500 hover:border-vert${today}`
}

// Compact 14-day navigator. Filled = logged, hollow = to fill; tap a day to
// load it into the form. Missing days read as neutral (never red / guilt).
export default function DayStrip({ days, loggedDates, selectedDate, todayKey, onSelect }) {
  const missing = days.filter(d => !loggedDates.has(d)).length

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700">14 derniers jours</h3>
        <span className="text-xs text-gray-500">
          {missing > 0 ? `${missing} à compléter` : 'tout est saisi ✓'}
        </span>
      </div>

      <div role="group" aria-label="Choisir un jour à saisir sur les 14 derniers jours" className="grid grid-cols-7 gap-1.5">
        {days.map(key => {
          const { dow, dayNum } = parts(key)
          const logged = loggedDates.has(key)
          const isToday = key === todayKey
          const isSelected = key === selectedDate
          const status = logged ? 'saisi' : 'à compléter'

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${fullDate(key)}, ${status}${isToday ? ", aujourd'hui" : ''}`}
              className={cellClasses(isSelected, logged, isToday)}
            >
              <span className="block text-[10px] font-medium uppercase opacity-70">
                {isToday ? 'auj.' : WEEKDAY_INITIAL[dow]}
              </span>
              <span className="block font-mono text-sm font-bold leading-tight">{dayNum}</span>
              <span aria-hidden="true" className="block text-[11px] leading-none mt-0.5">
                {logged ? '✓' : '+'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
