// Likert 1–5 scale with color gradient (red=1 → green=5), sourced from the
// app's shared severity palette (src/utils/severityColors.js).
import { SEVERITY_LEVELS as LEVELS } from '../utils/severityColors.js'

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
