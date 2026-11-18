import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

describe('Daily check-in — honest completion, faster entry, portée (issue #23)', () => {
  const today = getTodayKey()
  const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
  const FULL = {
    timeTaken: '07:45',
    timeLogged: '16:00',
    dimensions: { focus: 3, taskInitiation: 3, emotionalRegulation: 3, impulseControl: 3, workingMemory: 3, timeAwareness: 3 },
    wearOff: 'mild',
    sideEffects: {},
    sideEffectSeverity: {},
    notes: '',
  }
  const seed = (entries = [], start = shiftKey(today, -5)) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cycle: { medicationName: 'Concerta', dosage: '36mg', cycleStartDate: start, createdAt: '2026-07-10T08:00:00Z' },
      entries,
    }))
    render(<App />)
  }
  const dayMonth = (key) =>
    new Date(key + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  const saveButton = () => screen.getByRole('button', { name: /^Enregistrer le / })
  const setTime = (v) => fireEvent.change(screen.getByLabelText('Heure de prise du médicament'), { target: { value: v } })
  const rateAll = async () => {
    for (const label of ['Focus & Attention', 'Initiation des tâches', 'Régulation émotionnelle',
      'Contrôle des impulsions', 'Mémoire de travail', 'Sens du temps']) {
      const group = await screen.findByRole('group', { name: new RegExp(label) })
      await userEvent.click(within(group).getByRole('button', { name: 'Niveau 3 sur 5' }))
    }
  }
  const pickWearOff = async () => userEvent.click(await screen.findByRole('radio', { name: /Aucun — médicament/ }))
  const todayCell = () =>
    within(screen.getByRole('group', { name: /Choisir un jour/ })).getByRole('button', { name: /aujourd'hui$/ })

  it('time only, then save: nothing stored, dimensions open, missing list announced', async () => {
    seed()
    setTime('08:30')
    await userEvent.click(screen.getByRole('button', { name: /Heure de prise/ }))
    await userEvent.click(saveButton())

    expect(stored().entries).toEqual([])
    expect(screen.getByRole('button', { name: /Fonctions exécutives/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(/Encore 2 réponses : fonctions exécutives, essoufflement/)
  })

  it('progress counts the three required answers, 0 to 3', async () => {
    seed()
    expect(screen.getByText(/0 sur 3 réponses obligatoires/)).toBeInTheDocument()
    setTime('08:30')
    expect(screen.getByText(/1 sur 3 réponses obligatoires/)).toBeInTheDocument()
    await rateAll()
    expect(screen.getByText(/2 sur 3 réponses obligatoires/)).toBeInTheDocument()
    await pickWearOff()
    expect(screen.getByText(/3 sur 3 réponses obligatoires/)).toBeInTheDocument()
  })

  it('all three answered: stored, today shows "saisi", header count goes up by one', async () => {
    seed()
    expect(screen.getByRole('banner')).toHaveTextContent('0 sur 14 jours')
    setTime('08:30')
    await rateAll()
    await pickWearOff()
    await userEvent.click(saveButton())

    expect(stored().entries).toHaveLength(1)
    expect(stored().entries[0]).toMatchObject({ date: today, timeTaken: '08:30', wearOff: 'none' })
    expect(todayCell()).toHaveAccessibleName(/, saisi, aujourd'hui$/)
    expect(screen.getByRole('banner')).toHaveTextContent('1 sur 14 jours')
    expect(screen.getByRole('img', { name: /^1 jour saisi sur 14/ })).toBeInTheDocument()
  })

  it('side-effect summary reads "Facultatif" until something is ticked, then "1 coché"', async () => {
    seed()
    const header = screen.getByRole('button', { name: /Effets secondaires/ })
    expect(header).toHaveTextContent('Facultatif')
    expect(header).not.toHaveTextContent('Aucun')

    await userEvent.click(header)
    await userEvent.click(screen.getByRole('checkbox', { name: /Maux de tête/ }))
    await userEvent.click(screen.getByRole('button', { name: /Notes libres/ }))
    expect(screen.getByRole('button', { name: /Effets secondaires/ })).toHaveTextContent('1 coché')
  })

  it('no usual-time chip without a previous entry', () => {
    seed()
    expect(screen.queryByRole('button', { name: /Comme d'habitude/ })).not.toBeInTheDocument()
  })

  it('usual-time chip fills the last dose time and moves to the next section', async () => {
    seed([{ ...FULL, date: shiftKey(today, -1) }])
    await userEvent.click(screen.getByRole('button', { name: "Comme d'habitude : 07:45" }))
    expect(screen.getByLabelText('Heure de prise du médicament')).toHaveValue('07:45')
    expect(screen.getByRole('button', { name: /Fonctions exécutives/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('save button names the day, today and backfilled', async () => {
    seed()
    expect(saveButton()).toHaveAccessibleName(`Enregistrer le ${dayMonth(today)}`)
    const past = shiftKey(today, -3)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`${dayMonth(past)}, à compléter`) }))
    expect(saveButton()).toHaveAccessibleName(`Enregistrer le ${dayMonth(past)}`)
    // Backfilling gets the chip too (none here: no earlier entry with a time).
    expect(screen.queryByRole('button', { name: /Comme d'habitude/ })).not.toBeInTheDocument()
  })

  it('an older stored entry without ratings is "à compléter" and opens in edit mode', () => {
    seed([{ date: today, timeTaken: '08:00', timeLogged: '09:00', dimensions: {}, sideEffects: {}, sideEffectSeverity: {}, notes: '' }])
    expect(todayCell()).toHaveAccessibleName(/, à compléter, aujourd'hui$/)
    expect(screen.queryByText('Saisie du jour enregistrée')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Heure de prise du médicament')).toHaveValue('08:00')
    expect(screen.getByRole('button', { name: /Fonctions exécutives/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/1 sur 3 réponses obligatoires/)).toBeInTheDocument()
  })

  it('report leaves an incomplete entry out of the side-effect counts', async () => {
    seed([
      { ...FULL, date: shiftKey(today, -2), sideEffects: { headache: true } },
      { ...FULL, date: shiftKey(today, -1) },
      { date: today, timeTaken: '08:00', timeLogged: '09:00', dimensions: {}, sideEffects: { headache: true } },
    ])
    await userEvent.click(screen.getByRole('button', { name: 'Rapport 2 semaines' }))
    expect(screen.getByText(/2 saisies sur les 14 derniers jours/)).toBeInTheDocument()
    expect(screen.getAllByText('1/2 saisies').length).toBeGreaterThan(0)
    expect(screen.queryByText('2/3 saisies')).not.toBeInTheDocument()
  })
})
