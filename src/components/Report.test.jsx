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
