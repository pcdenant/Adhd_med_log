import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from './Header.jsx'

const cycle = { medicationName: 'Concerta', dosage: '36mg', cycleStartDate: '2026-07-10' }

describe('Header', () => {
  it('shows the medication, dosage and entry counter as a banner', () => {
    render(<Header cycle={cycle} entries={[]} onUpdateCycle={vi.fn()} />)
    const banner = screen.getByRole('banner')
    expect(banner).toHaveTextContent('Concerta')
    expect(banner).toHaveTextContent('36mg')
    expect(banner).toHaveTextContent('0 sur 14 jours')
  })

  it('draws the portée with a text alternative counting complete entries only', () => {
    vi.setSystemTime(new Date('2026-07-18T15:00:00'))
    const full = {
      timeTaken: '08:00',
      dimensions: { focus: 3, taskInitiation: 3, emotionalRegulation: 3, impulseControl: 3, workingMemory: 3, timeAwareness: 3 },
      wearOff: 'none',
    }
    const entries = [
      { ...full, date: '2026-07-16' },
      { date: '2026-07-17', timeTaken: '08:00', dimensions: {} }, // older, incomplete
    ]
    render(<Header cycle={{ ...cycle, cycleStartDate: '2026-07-15' }} entries={entries} onUpdateCycle={vi.fn()} />)
    expect(screen.getByRole('img', {
      name: "1 jour saisi sur 14, 2 à compléter, aujourd'hui à saisir, 10 à venir",
    })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveTextContent('1 sur 14 jours')
    vi.useRealTimers()
  })

  it('edits medication and dosage inline and reports trimmed values', async () => {
    const onUpdateCycle = vi.fn()
    render(<Header cycle={cycle} entries={[]} onUpdateCycle={onUpdateCycle} />)

    await userEvent.click(screen.getByRole('button', { name: 'Modifier le médicament et le dosage' }))

    const med = screen.getByLabelText('Nom du médicament')
    const dose = screen.getByLabelText('Dosage')
    await userEvent.clear(med)
    await userEvent.type(med, '  Vyvanse  ')
    await userEvent.clear(dose)
    await userEvent.type(dose, '40mg')
    await userEvent.click(screen.getByRole('button', { name: /Sauver/ }))

    expect(onUpdateCycle).toHaveBeenCalledWith({ medicationName: 'Vyvanse', dosage: '40mg' })
  })

  it('keeps the current values when an edit is cancelled', async () => {
    const onUpdateCycle = vi.fn()
    render(<Header cycle={cycle} entries={[]} onUpdateCycle={onUpdateCycle} />)

    await userEvent.click(screen.getByRole('button', { name: 'Modifier le médicament et le dosage' }))
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onUpdateCycle).not.toHaveBeenCalled()
    expect(screen.getByRole('banner')).toHaveTextContent('Concerta')
  })
})
