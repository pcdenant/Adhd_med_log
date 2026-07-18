import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

const STORAGE_KEY = 'ammt_v2'

async function completeOnboarding() {
  await userEvent.type(screen.getByLabelText('Nom du médicament'), 'Concerta')
  await userEvent.type(screen.getByLabelText('Dosage'), '36mg')
  await userEvent.click(screen.getByRole('button', { name: /Commencer le suivi/ }))
}

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

describe('App — unreadable stored data', () => {
  it('shows a dedicated screen for corrupted JSON, without touching localStorage or falling back to onboarding', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json{')
    render(<App />)

    expect(screen.getByText('Données illisibles')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Suivi Médicament TDAH' })).not.toBeInTheDocument()
    // The corrupted value is still there — never silently clobbered.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('not valid json{')
  })

  it('shows the same screen for valid JSON that is not our data shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'))
    render(<App />)
    expect(screen.getByText('Données illisibles')).toBeInTheDocument()
  })

  it('requires confirmation, then clears the key and returns to onboarding', async () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json{')
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /Recommencer à zéro/ }))
    // Confirmation step: not yet cleared.
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /Oui, effacer et recommencer/ }))
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('heading', { name: 'Suivi Médicament TDAH' })).toBeInTheDocument()
  })
})

describe('App — save failures', () => {
  it('shows a dismissible warning when a write fails (e.g. quota exceeded / private browsing)', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    render(<App />)
    await completeOnboarding()

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent(/Impossible d'enregistrer/)

    await userEvent.click(screen.getByRole('button', { name: 'Fermer cet avertissement' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    setItemSpy.mockRestore()
  })

  it('does not show a warning when writes succeed', async () => {
    render(<App />)
    await completeOnboarding()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
