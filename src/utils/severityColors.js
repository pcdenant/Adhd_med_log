// Single source of truth for the red -> yellow -> green severity/quality
// gradient used across the app: LikertScale (a 5-step 1-5 rating control)
// and Report.jsx's dimColor/wearOffColor (Recharts fill colors) and
// heatClass (day-of-week heatmap tint classes) all render "how good/bad is
// this" from this one palette instead of each hardcoding its own.
//
// The inactive/active class strings are load-bearing: they carry deliberate
// per-step accessibility contrast exceptions from an earlier pass (e.g.
// text-gray-900 on bg-yellow-400 for level 3, green-600 not green-500 for
// level 5's contrast on white). Don't "simplify" these strings.
export const SEVERITY_LEVELS = [
  {
    value: 1,
    hex: '#ef4444',
    inactive: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    active: 'bg-red-500 border-red-500 text-white shadow-sm',
    tint: 'bg-red-100 text-red-800',
  },
  {
    value: 2,
    hex: '#f97316',
    inactive: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    active: 'bg-orange-500 border-orange-500 text-white shadow-sm',
    tint: 'bg-orange-100 text-orange-800',
  },
  {
    value: 3,
    hex: '#facc15',
    inactive: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
    active: 'bg-yellow-400 border-yellow-400 text-gray-900 shadow-sm',
    tint: 'bg-yellow-100 text-yellow-800',
  },
  {
    value: 4,
    hex: '#84cc16',
    inactive: 'bg-lime-50 border-lime-200 text-lime-700 hover:bg-lime-100',
    active: 'bg-lime-500 border-lime-500 text-white shadow-sm',
    tint: 'bg-lime-100 text-lime-800',
  },
  {
    value: 5,
    hex: '#16a34a',
    inactive: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    active: 'bg-green-600 border-green-600 text-white shadow-sm',
    tint: 'bg-green-100 text-green-800',
  },
]

export function hexForLevel(level) {
  return SEVERITY_LEVELS[level - 1]?.hex ?? '#d1d5db' // gray-300 fallback
}

export function tintForLevel(level) {
  return SEVERITY_LEVELS[level - 1]?.tint ?? 'bg-gray-100 text-gray-500'
}
