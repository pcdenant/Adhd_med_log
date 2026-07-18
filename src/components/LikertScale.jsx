// Likert 1–5 scale with color gradient (red=1 → green=5)
const LEVELS = [
  {
    value: 1,
    inactive: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    active: 'bg-red-500 border-red-500 text-white shadow-sm',
  },
  {
    value: 2,
    inactive: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    active: 'bg-orange-500 border-orange-500 text-white shadow-sm',
  },
  {
    value: 3,
    inactive: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
    active: 'bg-yellow-400 border-yellow-400 text-gray-900 shadow-sm',
  },
  {
    value: 4,
    inactive: 'bg-lime-50 border-lime-200 text-lime-700 hover:bg-lime-100',
    active: 'bg-lime-500 border-lime-500 text-white shadow-sm',
  },
  {
    value: 5,
    inactive: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    active: 'bg-green-600 border-green-600 text-white shadow-sm',
  },
]

export default function LikertScale({ value, onChange, label, question, lowLabel, highLabel }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-1">
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
      </div>
      <p className="text-gray-500 text-xs italic mb-2 leading-relaxed">{question}</p>

      <div className="flex gap-1.5" role="group" aria-label={`${label} : ${question}`}>
        {LEVELS.map(level => (
          <button
            key={level.value}
            type="button"
            aria-pressed={value === level.value}
            aria-label={`Niveau ${level.value} sur 5`}
            onClick={() => onChange(level.value)}
            className={`flex-1 py-2.5 rounded-lg border-2 font-mono font-bold text-sm transition-all ${
              value === level.value ? level.active : level.inactive
            }`}
          >
            {level.value}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1 px-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}
