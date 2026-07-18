import '@testing-library/jest-dom/vitest'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

// Extend expect with jest-axe's toHaveNoViolations for a11y non-regression tests.
expect.extend(toHaveNoViolations)

// jsdom lacks ResizeObserver, which Recharts' ResponsiveContainer needs to mount.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// React Testing Library: unmount and reset the DOM after every test.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
