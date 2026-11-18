import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Report, { dimColor, wearOffColor, heatClass } from './Report.jsx'
import { buildDayWindow } from '../utils/calculations.js'

const cycle = { medicationName: 'Concerta', dosage: '36mg', cycleStartDate: '2026-07-10' }

// Build `n` recent entries (today, today-1, ...) so getEntriesLast14Days keeps them.
function recentEntries(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, // local key, like getTodayKey
      timeTaken: '08:00',
      timeLogged: '16:00',
      dimensions: { focus: 3, taskInitiation: 3, emotionalRegulation: 3, impulseControl: 3, workingMemory: 3, timeAwareness: 3 },
      wearOff: 'mild',
      sideEffects: { appetiteSuppression: false, sleepDifficulty: false, headache: false, moodChanges: false, irritabilityRebound: false, anxiety: false, physicalSymptoms: false },
      sideEffectSeverity: {},
      notes: '',
    })
  }
  return out
}

describe('Report gating', () => {
  it('renders the report sections below 10 entries, with a discreet reliability note', () => {
    render(<Report entries={recentEntries(3)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText(/Timeline d'efficacité/)).toBeInTheDocument()
    expect(screen.getByText(/les tendances se préciseront avec plus de données/)).toBeInTheDocument()
  })

  it('renders the report sections at 10+ entries, without the reliability note', () => {
    render(<Report entries={recentEntries(10)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText(/Timeline d'efficacité/)).toBeInTheDocument()
    expect(screen.getByText('Synthèse narrative')).toBeInTheDocument()
    expect(screen.queryByText(/les tendances se préciseront avec plus de données/)).not.toBeInTheDocument()
  })

  it('shows an empty state with zero entries', () => {
    render(<Report entries={[]} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText(/Aucune saisie pour l'instant/)).toBeInTheDocument()
    expect(screen.queryByText(/Timeline d'efficacité/)).not.toBeInTheDocument()
  })
})

describe('Report notes section', () => {
  it('lists entries with notes and omits entries without notes', () => {
    const entries = recentEntries(2)
    entries[0].notes = 'Bonne journée, focus au top'
    entries[1].notes = ''
    render(<Report entries={entries} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText('Bonne journée, focus au top')).toBeInTheDocument()
  })

  it('shows an empty state when no entry has notes', () => {
    render(<Report entries={recentEntries(3)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText("Aucune note pour l'instant.")).toBeInTheDocument()
  })
})

describe('Report reset flow', () => {
  it('requires confirmation before resetting the cycle', async () => {
    const onReset = vi.fn()
    render(<Report entries={recentEntries(3)} cycle={cycle} onReset={onReset} />)

    await userEvent.click(screen.getByRole('button', { name: /Réinitialiser et démarrer un nouveau cycle/ }))
    expect(onReset).not.toHaveBeenCalled() // confirmation shown, not yet fired

    await userEvent.click(screen.getByRole('button', { name: /Oui, réinitialiser/ }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})

// Sourced from src/utils/severityColors.js — thresholds stay exact (tied to
// on-screen legend copy), only the literal color values follow design.md's
// contrast-corrected palette (Option B + Style 3 migration).
describe('Report color helpers (severityColors)', () => {
  it('dimColor buckets at the documented thresholds (< 2.5 / 2.5-3.5 / > 3.5)', () => {
    expect(dimColor(null)).toBe('#d1d5db')
    expect(dimColor(2.4)).toBe('#B23B3B')
    expect(dimColor(2.5)).toBe('#E8C93E')
    expect(dimColor(3.4)).toBe('#E8C93E')
    expect(dimColor(3.5)).toBe('#2F6B44')
  })

  it('wearOffColor buckets at the documented thresholds', () => {
    expect(wearOffColor(1.2)).toBe('#2F6B44')
    expect(wearOffColor(1.6)).toBe('#5C7A1E')
    expect(wearOffColor(2.2)).toBe('#E8C93E')
    expect(wearOffColor(2.3)).toBe('#B23B3B')
  })

  it('heatClass buckets at the documented normalized thresholds', () => {
    expect(heatClass(null)).toBe('bg-gray-100 text-gray-500')
    expect(heatClass(0.34)).toBe('bg-[#FBEAE8] text-[#9C3C3D]')
    expect(heatClass(0.35)).toBe('bg-[#FCF3D9] text-[#6B5814]')
    expect(heatClass(0.65)).toBe('bg-[#EAF3EC] text-[#2F6B44]')
  })
})

describe('Report — eyebrow pattern (quieter)', () => {
  it('the narrative caption drops the uppercase-tracked eyebrow pattern', () => {
    render(<Report entries={recentEntries(10)} cycle={cycle} onReset={vi.fn()} />)
    const caption = screen.getByText('Bilan de maintenance médicamenteuse')
    expect(caption.className).not.toMatch(/uppercase/)
  })

  it('leaves the untouched narrative labels as they were (scope guard)', () => {
    render(<Report entries={recentEntries(10)} cycle={cycle} onReset={vi.fn()} />)
    // "Points à discuter avec le médecin" was explicitly out of scope for the
    // eyebrow fix — this fails loudly if a future pass over-applies it.
    expect(screen.getByText('Points à discuter avec le médecin').className).toMatch(/uppercase/)
  })
})

describe('Report side effects — denominator', () => {
  it('counts side-effect days out of logged entries, not a hardcoded 14', () => {
    const entries = recentEntries(5)
    entries.slice(0, 3).forEach(e => { e.sideEffects.headache = true })
    render(<Report entries={entries} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.queryByText(/3\/14/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/3\/5 saisies/).length).toBeGreaterThan(0)
    expect(screen.getByText(/3\/5 saisies \(60%\)/)).toBeInTheDocument()
  })
})

describe('Report coverage sentence', () => {
  const withWearOff = (timeLogged, wearOff) =>
    recentEntries(3).map(e => ({ ...e, timeLogged, wearOff }))

  it('says "au moins" when coverage never degrades', () => {
    render(<Report entries={withWearOff('18:00', 'none')} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText(/au moins/)).toHaveTextContent('au moins 12h')
  })

  it('says "moins de 3h" — short — when it degrades right away', () => {
    render(<Report entries={withWearOff('09:00', 'strong')} cycle={cycle} onReset={vi.fn()} />)
    const p = screen.getByText(/moins de/)
    expect(p).toHaveTextContent('moins de 3h')
    expect(p).toHaveTextContent('Durée courte')
  })

  it('says "jusqu\'à" when it degrades later', () => {
    render(<Report entries={recentEntries(3)} cycle={cycle} onReset={vi.fn()} />) // mild at 8h
    expect(screen.getByText(/jusqu'à/)).toHaveTextContent("jusqu'à environ 6h")
  })
})

describe('Report — no leftover 14-day hardcoding', () => {
  const fr = (key) => new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  it('the side-effect subtitle no longer claims a count "sur 14"', () => {
    render(<Report entries={recentEntries(5)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.queryByText(/sur 14/)).not.toBeInTheDocument()
  })

  it('the narrative period starts at the report window, not at an older cycle start', () => {
    // cycle.cycleStartDate (2026-07-10) is far older than 14 days.
    render(<Report entries={recentEntries(5)} cycle={cycle} onReset={vi.fn()} />)
    const windowStart = buildDayWindow(cycle.cycleStartDate)[0]
    expect(screen.getByText(new RegExp(`${fr(windowStart)} →`))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(fr(cycle.cycleStartDate)))).not.toBeInTheDocument()
  })
})

describe('Report wear-off label — matches the 1/2/3 axis', () => {
  it('labels an average of 2.0 as "léger", not "fort"', () => {
    // All 'mild' (= 2 on the axis) at 8h → bucket average is exactly 2.0.
    render(<Report entries={recentEntries(3)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText('Essoufflement léger')).toBeInTheDocument()
    expect(screen.queryByText('Essoufflement fort')).not.toBeInTheDocument()
  })
})

describe('Report weekly pattern — no claim from a single day', () => {
  const lowDay = (entries, dow) =>
    entries.forEach(e => {
      if (new Date(e.date + 'T12:00:00').getDay() === dow) {
        Object.keys(e.dimensions).forEach(k => { e.dimensions[k] = 1 })
      }
    })

  it('hides the pattern when the hardest weekday was logged only once', () => {
    const entries = recentEntries(7)
    lowDay(entries, new Date(entries[0].date + 'T12:00:00').getDay())
    render(<Report entries={entries} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.queryByText('Pattern hebdomadaire')).not.toBeInTheDocument()
  })

  it('shows it once the weekday repeats, without "systématiquement"', () => {
    const entries = recentEntries(14)
    lowDay(entries, new Date(entries[0].date + 'T12:00:00').getDay())
    render(<Report entries={entries} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText('Pattern hebdomadaire')).toBeInTheDocument()
    expect(screen.queryByText(/systématiquement/)).not.toBeInTheDocument()
    expect(screen.getByText(/le jour le plus difficile/)).toHaveTextContent('sur 2 saisies')
  })
})
