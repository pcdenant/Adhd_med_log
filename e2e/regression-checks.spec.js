import { test, expect } from '@playwright/test'

// Structural regression checks (real-browser pixel measurement, narrow-
// viewport overflow) for the batch of P2/P3 backlog fixes. Distinct in
// purpose from journeys.spec.js's golden journeys — see TESTING.md.

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

async function seed(page, entries = []) {
  await page.addInitScript(
    ([cycle, entries]) => localStorage.setItem('ammt_v2', JSON.stringify({ cycle, entries })),
    [CYCLE, entries]
  )
}

test('header pencil toggle meets the 44px touch-target target', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  const pencil = page.getByRole('button', { name: 'Modifier le médicament et le dosage' })
  const box = await pencil.boundingBox()
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
})

test('header edit-mode controls clear the AA floor with real headroom', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Modifier le médicament et le dosage' }).click()

  const med = await page.getByLabel('Nom du médicament').boundingBox()
  expect(med.height).toBeGreaterThanOrEqual(36)

  const save = await page.getByRole('button', { name: /Sauver/ }).boundingBox()
  expect(save.height).toBeGreaterThanOrEqual(32)

  const cancel = await page.getByRole('button', { name: 'Annuler' }).boundingBox()
  expect(cancel.height).toBeGreaterThanOrEqual(32)
})

test('side-effect severity pills clear the AA floor with real headroom', async ({ page }) => {
  await seed(page)
  await page.goto('/')
  await page.getByRole('button', { name: /Effets secondaires/ }).click()
  await page.getByText(/Suppression d'appétit/).click()

  const pill = page.getByRole('button', { name: 'Léger' })
  const box = await pill.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(32)
  expect(box.width).toBeGreaterThanOrEqual(44)
})

test('day-of-week heatmap has no horizontal overflow at 360px and stays at 7 columns', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await seed(page, tenRecentEntries())
  await page.goto('/')

  await page.getByRole('button', { name: 'Rapport 2 semaines' }).click()
  await expect(page.getByText('Pattern jour de la semaine')).toBeVisible()

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)

  const cellCount = await page.locator('.grid-cols-7 > div').count()
  expect(cellCount).toBe(7)
})
