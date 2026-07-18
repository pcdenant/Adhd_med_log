import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import Onboarding from '../components/Onboarding.jsx'
import DailyCheckIn from '../components/DailyCheckIn.jsx'

// Locks in the accessibility work: every interactive control must have an
// accessible name and the markup must pass axe's structural checks.
describe('accessibility (non-regression)', () => {
  it('onboarding screen has no axe violations', async () => {
    const { container } = render(<Onboarding onSetup={vi.fn()} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('daily check-in form has no axe violations', async () => {
    const { container } = render(<DailyCheckIn entries={[]} onSave={vi.fn()} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
