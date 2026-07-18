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
    expect(banner).toHaveTextContent('/14')
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
