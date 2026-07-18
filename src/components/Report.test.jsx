import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Report from './Report.jsx'

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
