import { test, expect } from '@playwright/test'

const CYCLE = {
  medicationName: 'Concerta',
  dosage: '36mg',
  cycleStartDate: '2026-07-10',
  createdAt: '2026-07-10T08:00:00Z',
}

function tenRecentEntries() {
  const entries = []
  for (let i = 0; i < 10; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    entries.push({
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
  return entries
}

test('golden journey 1: onboarding then log the first daily check-in', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Suivi Médicament TDAH' })).toBeVisible()
  await page.getByLabel('Nom du médicament').fill('Concerta')
  await page.getByLabel('Dosage').fill('36mg')
  await page.getByRole('button', { name: /Commencer le suivi/ }).click()

  // Now on the tracker: fill the required dose time and save.
  await expect(page.getByRole('button', { name: 'Saisie du jour', exact: true })).toBeVisible()
  await page.getByLabel('Heure de prise du médicament').fill('08:30')
  await page.getByRole('button', { name: /Enregistrer la saisie du jour/ }).click()

  await expect(page.getByText('Saisie du jour enregistrée')).toBeVisible()
})

test('golden journey 3: backfill a missed past day from the 14-day strip', async ({ page }) => {
  await page.addInitScript(() => {
    const key = (o) => { const d = new Date(); d.setDate(d.getDate() - o); return d.toISOString().split('T')[0] }
    localStorage.setItem('ammt_v2', JSON.stringify({
      cycle: { medicationName: 'Concerta', dosage: '36mg', cycleStartDate: key(8), createdAt: new Date().toISOString() },
      entries: [],
    }))
  })
  await page.goto('/')

  // Jump to the first day still to complete, fill the required dose time, save.
  await page.getByRole('button', { name: /à compléter/ }).first().click()
  await expect(page.getByText(/Vous complétez/)).toBeVisible()
  await page.getByLabel('Heure de prise du médicament').fill('08:00')
  await page.getByRole('button', { name: /Enregistrer cette journée/ }).click()

  await expect(page.getByText('Journée déjà saisie')).toBeVisible()
})

test('golden journey 2: report unlocks and renders with enough entries', async ({ page }) => {
  await page.addInitScript(
    ([cycle, entries]) => {
      localStorage.setItem('ammt_v2', JSON.stringify({ cycle, entries }))
    },
    [CYCLE, tenRecentEntries()]
  )
  await page.goto('/')

  await page.getByRole('button', { name: 'Rapport 2 semaines' }).click()
  await expect(page.getByText(/Timeline d'efficacité/)).toBeVisible()
  await expect(page.getByText('Synthèse narrative')).toBeVisible()
})
