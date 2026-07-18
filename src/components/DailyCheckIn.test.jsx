import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DailyCheckIn from './DailyCheckIn.jsx'

const today = new Date().toISOString().split('T')[0]

describe('DailyCheckIn', () => {
  it('renders the entry form when today has no entry yet', () => {
    render(<DailyCheckIn entries={[]} onSave={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Enregistrer la saisie du jour/ })).toBeInTheDocument()
    // Accessible name on the time input (non-regression for PR #7).
    expect(screen.getByLabelText('Heure de prise du médicament')).toBeInTheDocument()
  })

  it('saves an entry with the collected values', async () => {
    const onSave = vi.fn()
    render(<DailyCheckIn entries={[]} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText('Heure de prise du médicament'), {
      target: { value: '08:30' },
    })

    const focusGroup = screen.getByRole('group', { name: /Focus & Attention/ })
    await userEvent.click(within(focusGroup).getByRole('button', { name: 'Niveau 4 sur 5' }))

    await userEvent.click(screen.getByRole('button', { name: /Enregistrer la saisie du jour/ }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const payload = onSave.mock.calls[0][0]
    expect(payload).toMatchObject({
      date: today,
      timeTaken: '08:30',
      dimensions: expect.objectContaining({ focus: 4 }),
    })
    expect(payload.timeLogged).toMatch(/^\d{2}:\d{2}$/)
  })

  it('shows a read-only summary (not the form) when today is already logged', () => {
    render(
      <DailyCheckIn
        entries={[{ date: today, timeTaken: '08:00', timeLogged: '09:00', dimensions: {}, sideEffects: {}, sideEffectSeverity: {}, notes: '' }]}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Saisie du jour enregistrée')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Enregistrer la saisie du jour/ })).not.toBeInTheDocument()
  })
})
