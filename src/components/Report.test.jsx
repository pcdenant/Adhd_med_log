import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Report, { dimColor, wearOffColor, heatClass } from './Report.jsx'

const cycle = { medicationName: 'Concerta', dosage: '36mg', cycleStartDate: '2026-07-10' }

// Build `n` recent entries (today, today-1, ...) so getEntriesLast14Days keeps them.
function recentEntries(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push({
      date: d.toISOString().split('T')[0],
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
  it('blocks the report and shows progress below 10 entries', () => {
    render(<Report entries={recentEntries(3)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText(/Il faut au moins/)).toBeInTheDocument()
    expect(screen.queryByText(/Timeline d'efficacité/)).not.toBeInTheDocument()
  })

  it('renders the report sections at 10+ entries', () => {
    render(<Report entries={recentEntries(10)} cycle={cycle} onReset={vi.fn()} />)
    expect(screen.getByText(/Timeline d'efficacité/)).toBeInTheDocument()
    expect(screen.getByText('Synthèse narrative')).toBeInTheDocument()
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
// on-screen legend copy), only the literal color values are shared now.
describe('Report color helpers (severityColors extraction)', () => {
  it('dimColor buckets at the documented thresholds (< 2.5 / 2.5-3.5 / > 3.5)', () => {
    expect(dimColor(null)).toBe('#d1d5db')
    expect(dimColor(2.4)).toBe('#ef4444')
    expect(dimColor(2.5)).toBe('#facc15')
    expect(dimColor(3.4)).toBe('#facc15')
    expect(dimColor(3.5)).toBe('#16a34a')
  })

  it('wearOffColor buckets at the documented thresholds', () => {
    expect(wearOffColor(1.2)).toBe('#16a34a')
    expect(wearOffColor(1.6)).toBe('#84cc16')
    expect(wearOffColor(2.2)).toBe('#facc15')
    expect(wearOffColor(2.3)).toBe('#ef4444')
  })

  it('heatClass buckets at the documented normalized thresholds', () => {
    expect(heatClass(null)).toBe('bg-gray-100 text-gray-500')
    expect(heatClass(0.34)).toBe('bg-red-100 text-red-800')
    expect(heatClass(0.35)).toBe('bg-yellow-100 text-yellow-800')
    expect(heatClass(0.65)).toBe('bg-green-100 text-green-800')
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
