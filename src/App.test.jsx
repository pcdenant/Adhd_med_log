import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

const STORAGE_KEY = 'ammt_v2'

describe('App onboarding + persistence', () => {
  it('shows onboarding when there is no cycle yet', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Suivi Médicament TDAH' })).toBeInTheDocument()
  })

  it('persists the cycle to localStorage and moves into the tracker', async () => {
    render(<App />)

    await userEvent.type(screen.getByLabelText('Nom du médicament'), 'Concerta')
    await userEvent.type(screen.getByLabelText('Dosage'), '36mg')
    await userEvent.click(screen.getByRole('button', { name: /Commencer le suivi/ }))

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored.cycle.medicationName).toBe('Concerta')
    expect(stored.cycle.dosage).toBe('36mg')
    expect(stored.entries).toEqual([])

    // The tracker (tabs + header) is now on screen instead of onboarding.
    expect(screen.getByRole('button', { name: 'Saisie du jour' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveTextContent('Concerta')
  })

  it('loads an existing cycle from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cycle: { medicationName: 'Vyvanse', dosage: '40mg', cycleStartDate: '2026-07-10', createdAt: '2026-07-10T08:00:00Z' },
      entries: [],
    }))
    render(<App />)
    expect(screen.getByRole('banner')).toHaveTextContent('Vyvanse')
    expect(screen.queryByRole('heading', { name: 'Suivi Médicament TDAH' })).not.toBeInTheDocument()
  })
})
