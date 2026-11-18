import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import { getTodayKey, shiftKey } from './utils/calculations.js'

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

describe('Onboarding — required fields and cycle start (issue #20)', () => {
  const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
  const fillFields = async (med = 'Concerta', dose = '36mg') => {
    if (med) await userEvent.type(screen.getByLabelText('Nom du médicament'), med)
    if (dose) await userEvent.type(screen.getByLabelText('Dosage'), dose)
  }
  const submit = () => userEvent.click(screen.getByRole('button', { name: 'Commencer le suivi' }))

  it('blocks empty fields, says which one, and stores nothing', async () => {
    render(<App />)
    await submit()
    expect(screen.getByText('Indiquez le nom du médicament.')).toBeInTheDocument()
    expect(screen.getByText('Indiquez le dosage.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du médicament')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nom du médicament')).toHaveFocus()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('treats a whitespace-only field as empty', async () => {
    render(<App />)
    await fillFields('Concerta', '   ')
    await submit()
    expect(screen.getByText('Indiquez le dosage.')).toBeInTheDocument()
    expect(screen.getByLabelText('Dosage')).toHaveFocus()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('never stores "Non spécifié"', async () => {
    render(<App />)
    await submit()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('starts the cycle today by default', async () => {
    render(<App />)
    await fillFields()
    await submit()
    expect(stored().cycle.cycleStartDate).toBe(getTodayKey())
    expect(screen.queryByRole('button', { name: /à compléter$/ })).not.toBeInTheDocument()
  })

  it('"Hier" starts the cycle yesterday, with yesterday to complete', async () => {
    render(<App />)
    await fillFields()
    await userEvent.click(screen.getByRole('button', { name: 'Hier' }))
    await submit()
    expect(stored().cycle.cycleStartDate).toBe(shiftKey(getTodayKey(), -1))
    expect(screen.getAllByRole('button', { name: /à compléter$/ })).toHaveLength(1)
  })

  it('"Autre jour" 5 days back gives 5 days to complete and the right header date', async () => {
    const start = shiftKey(getTodayKey(), -5)
    render(<App />)
    await fillFields()
    await userEvent.click(screen.getByRole('button', { name: 'Autre jour' }))
    fireEvent.change(screen.getByLabelText(/Date de début/), { target: { value: start } })
    expect(screen.getByRole('img', { name: /5 à compléter/ })).toBeInTheDocument()
    await submit()
    expect(stored().cycle.cycleStartDate).toBe(start)
    expect(screen.getAllByRole('button', { name: /à compléter$/ })).toHaveLength(5)
    const fr = new Date(start + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    expect(screen.getByRole('banner')).toHaveTextContent(fr)
  })

  it('refuses a start date more than 13 days back, and stores nothing', async () => {
    render(<App />)
    await fillFields()
    await userEvent.click(screen.getByRole('button', { name: 'Autre jour' }))
    fireEvent.change(screen.getByLabelText(/Date de début/), { target: { value: shiftKey(getTodayKey(), -14) } })
    await submit()
    expect(screen.getByText(/Choisissez une date entre le/)).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('refuses "Autre jour" with no date picked', async () => {
    render(<App />)
    await fillFields()
    await userEvent.click(screen.getByRole('button', { name: 'Autre jour' }))
    await submit()
    expect(screen.getByLabelText(/Date de début/)).toHaveFocus()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
