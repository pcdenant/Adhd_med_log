// Single source of truth for the red -> amber -> green severity/quality
// gradient used across the app: LikertScale (a 5-step 1-5 rating control)
// and Report.jsx's dimColor/wearOffColor (Recharts fill colors) and
// heatClass (day-of-week heatmap tint classes) all render "how good/bad is
// this" from this one palette instead of each hardcoding its own.
//
// Anchored on the design.md semantic tokens (success/warning/danger at
// levels 5/3/1) with two interpolated intermediate steps. Every inactive
// pair and every active pair below was verified >= 4.5:1 (WCAG AA) when this
// palette was introduced (see design.md -> Palette) — don't "simplify" these
// strings or swap in a default Tailwind red/yellow/green without rechecking
// contrast, since several defaults (e.g. bg-yellow-400 + white text) fail.
export const SEVERITY_LEVELS = [
  {
    value: 1,
    hex: '#B23B3B',
    inactive: 'bg-[#FBEAE8] border-[#E3B3AF] text-[#9C3C3D] hover:bg-[#F7DCD9]',
    active: 'bg-[#B23B3B] border-[#B23B3B] text-white shadow-sm',
    tint: 'bg-[#FBEAE8] text-[#9C3C3D]',
  },
  {
    value: 2,
    hex: '#B2611F',
    inactive: 'bg-[#FDF0E4] border-[#E8C39F] text-[#8A4B1D] hover:bg-[#FAE3CB]',
    active: 'bg-[#B2611F] border-[#B2611F] text-white shadow-sm',
    tint: 'bg-[#FDF0E4] text-[#8A4B1D]',
  },
  {
    value: 3,
    hex: '#E8C93E',
    inactive: 'bg-[#FCF3D9] border-[#EBDB9C] text-[#6B5814] hover:bg-[#F8E9B8]',
    active: 'bg-[#E8C93E] border-[#E8C93E] text-[#2A2410] shadow-sm',
    tint: 'bg-[#FCF3D9] text-[#6B5814]',
  },
  {
    value: 4,
    hex: '#5C7A1E',
    inactive: 'bg-[#F1F5E1] border-[#C9D9A0] text-[#55671F] hover:bg-[#E4ECC9]',
    active: 'bg-[#5C7A1E] border-[#5C7A1E] text-white shadow-sm',
    tint: 'bg-[#F1F5E1] text-[#55671F]',
  },
  {
    value: 5,
    hex: '#2F6B44',
    inactive: 'bg-[#EAF3EC] border-[#B7D6C2] text-[#2F6B44] hover:bg-[#DAEBE0]',
    active: 'bg-[#2F6B44] border-[#2F6B44] text-white shadow-sm',
    tint: 'bg-[#EAF3EC] text-[#2F6B44]',
  },
]

export function hexForLevel(level) {
  return SEVERITY_LEVELS[level - 1]?.hex ?? '#d1d5db' // gray-300 fallback
}

export function tintForLevel(level) {
  return SEVERITY_LEVELS[level - 1]?.tint ?? 'bg-gray-100 text-gray-500'
}
