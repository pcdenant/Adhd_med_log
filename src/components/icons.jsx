// Shared SVG icon set — replaces structural emoji app-wide (see design.md ->
// Icons). Every icon: 1.75px stroke, currentColor, so it inherits whatever
// token colour the surrounding text uses. Callers keep the same
// aria-hidden="true" + adjacent visible label pattern the emoji it replaces
// used — these are decorative, never the accessible name on their own.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function PillIcon(props) {
  return (
    <svg {...base} {...props}>
      <g transform="rotate(45 12 12)">
        <rect x="5" y="9" width="14" height="6" rx="3" />
        <line x1="12" y1="9" x2="12" y2="15" />
      </g>
    </svg>
  )
}

export function BrainIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.5c-2 0-3.5 1.6-3.5 3.4 0 .8.3 1.5.7 2-1 .6-1.7 1.7-1.7 3 0 1.6 1.1 2.9 2.6 3.3.1 1.7 1.5 3.1 3.2 3.1.6 0 1.1-.2 1.6-.4" />
      <path d="M15 4.5c2 0 3.5 1.6 3.5 3.4 0 .8-.3 1.5-.7 2 1 .6 1.7 1.7 1.7 3 0 1.6-1.1 2.9-2.6 3.3-.1 1.7-1.5 3.1-3.2 3.1-.6 0-1.1-.2-1.6-.4" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
  )
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <line x1="12" y1="12.5" x2="15" y2="14.5" />
    </svg>
  )
}

export function AlertTriangleIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 21 19.5H3Z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <circle cx="12" cy="16.8" r=".4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function NoteIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <line x1="8" y1="8.5" x2="16" y2="8.5" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="15.5" x2="13" y2="15.5" />
    </svg>
  )
}

export function CheckCircleIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.4 2.4 4.6-5.2" />
    </svg>
  )
}

export function PencilIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 4.5 19 8l-9.5 9.5L5 18l.5-4.5Z" />
      <line x1="14" y1="6" x2="17.5" y2="9.5" />
    </svg>
  )
}

export function ChartBarIcon(props) {
  return (
    <svg {...base} {...props}>
      <line x1="4.5" y1="20" x2="19.5" y2="20" />
      <rect x="6.5" y="13" width="3" height="7" />
      <rect x="10.5" y="9" width="3" height="11" />
      <rect x="14.5" y="5" width="3" height="15" />
    </svg>
  )
}

export function CalendarIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="8" y1="3.5" x2="8" y2="7" />
      <line x1="16" y1="3.5" x2="16" y2="7" />
    </svg>
  )
}

export function XIcon(props) {
  return (
    <svg {...base} {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}
