import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

describe('DailyCheckIn — accordion', () => {
  it('opens only the first section by default; later sections are hidden from the a11y tree', () => {
    render(<DailyCheckIn entries={[]} onSave={vi.fn()} />)
    expect(screen.getByLabelText('Heure de prise du médicament')).toBeInTheDocument()
    // Dimensions/wear-off/side-effects/notes controls aren't queryable while their panel is hidden
    // (getByRole respects the accessibility tree; getByLabelText does not, so byRole is the right check here).
    expect(screen.queryByRole('group', { name: /Focus & Attention/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Notes libres' })).not.toBeInTheDocument()
  })

  it('auto-advances to the next section once the current one is complete', async () => {
    render(<DailyCheckIn entries={[]} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Heure de prise du médicament'), { target: { value: '08:30' } })
    // Time complete -> dimensions section opens.
    const focusGroup = await screen.findByRole('group', { name: /Focus & Attention/ })
    expect(screen.queryByRole('radio', { name: /Aucun — médicament/ })).not.toBeInTheDocument()

    // Fill all six dimensions -> wear-off section opens.
    for (const label of [
      'Focus & Attention', 'Initiation des tâches', 'Régulation émotionnelle',
      'Contrôle des impulsions', 'Mémoire de travail', 'Sens du temps',
    ]) {
      const group = screen.getByRole('group', { name: new RegExp(label) })
      await userEvent.click(within(group).getByRole('button', { name: 'Niveau 3 sur 5' }))
    }
    expect(await screen.findByRole('radio', { name: /Aucun — médicament/ })).toBeInTheDocument()

    // Choosing a wear-off level opens the side-effects section.
    await userEvent.click(screen.getByRole('radio', { name: /Aucun — médicament/ }))
    expect(await screen.findByText(/Suppression d'appétit/)).toBeInTheDocument()
  })

  it('reopens a section on demand via its header and shows a collapsed summary', async () => {
    render(<DailyCheckIn entries={[]} onSave={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Heure de prise du médicament'), { target: { value: '08:30' } })

    // Time header now shows a summary and is collapsed.
    const timeHeader = screen.getByRole('button', { name: /Heure de prise/ })
    expect(timeHeader).toHaveTextContent('Prise à 08:30')
    expect(timeHeader).toHaveAttribute('aria-expanded', 'false')

    // Clicking it reopens the section.
    await userEvent.click(timeHeader)
    expect(timeHeader).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Heure de prise du médicament')).toBeInTheDocument()
  })

  it('never blocks on the optional side-effects/notes sections', async () => {
    const onSave = vi.fn()
    render(<DailyCheckIn entries={[]} onSave={onSave} />)
    fireEvent.change(screen.getByLabelText('Heure de prise du médicament'), { target: { value: '08:30' } })
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer la saisie du jour/ }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})

describe('DailyCheckIn — missed-day catch-up', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-07-18T10:00:00Z')))
  afterEach(() => vi.useRealTimers())

  it('backfills a past day, keeping an empty check-in time out of the data', async () => {
    const onSave = vi.fn()
    render(<DailyCheckIn entries={[]} cycle={{ cycleStartDate: '2026-07-10' }} onSave={onSave} />)

    // Jump to a past day via the strip.
    await userEvent.click(screen.getByRole('button', { name: /15 juillet/ }))

    // Past-day affordances appear.
    expect(screen.getByText(/Vous complétez/)).toBeInTheDocument()
    const checkIn = screen.getByLabelText('Heure du point (évaluation)')
    expect(checkIn).toBeInTheDocument()

    // Required dose time only; leave the check-in time empty, then save.
    fireEvent.change(screen.getByLabelText('Heure de prise du médicament'), { target: { value: '08:00' } })
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer cette journée/ }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const payload = onSave.mock.calls[0][0]
    expect(payload.date).toBe('2026-07-15')
    expect(payload.timeTaken).toBe('08:00')
    expect(payload.timeLogged).toBe('') // empty -> excluded from wear-off timeline, never fabricated
    expect(payload).not.toHaveProperty('checkInTime')
  })

  it('shows a read-only summary when a past day is already logged', async () => {
    render(
      <DailyCheckIn
        cycle={{ cycleStartDate: '2026-07-10' }}
        entries={[{ date: '2026-07-15', timeTaken: '08:00', timeLogged: '17:00', dimensions: {}, sideEffects: {}, sideEffectSeverity: {}, notes: '' }]}
        onSave={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /15 juillet/ }))
    expect(screen.getByText('Journée déjà saisie')).toBeInTheDocument()
    expect(screen.getByText(/17:00/)).toBeInTheDocument()
  })
})
