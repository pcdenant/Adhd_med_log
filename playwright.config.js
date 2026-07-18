import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

// This environment ships a Chromium build under /opt/pw-browsers instead of
// letting Playwright download its own. Point at it when present; otherwise fall
// back to Playwright's managed browser (e.g. after `npx playwright install`).
const vendoredChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const executablePath = existsSync(vendoredChromium) ? vendoredChromium : undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath, args: ['--no-sandbox'] },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
