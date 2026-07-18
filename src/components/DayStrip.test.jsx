import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DayStrip from './DayStrip.jsx'

const days = ['2026-07-16', '2026-07-17', '2026-07-18']

function setup(props = {}) {
  const onSelect = vi.fn()
  render(
    <DayStrip
      days={days}
      loggedDates={new Set(['2026-07-17'])}
      selectedDate="2026-07-18"
      todayKey="2026-07-18"
      onSelect={onSelect}
      {...props}
    />
  )
  return { onSelect }
}

describe('DayStrip', () => {
  it('renders one button per day in the window', () => {
    setup()
    const group = screen.getByRole('group', { name: /Choisir un jour/ })
    expect(within(group).getAllByRole('button')).toHaveLength(3)
  })

  it('summarises how many days are still to complete', () => {
    setup()
    expect(screen.getByText('2 à compléter')).toBeInTheDocument()
  })

  it('announces logged vs missing status in the accessible name', () => {
    setup()
    expect(screen.getByRole('button', { name: /17 juillet, saisi/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /16 juillet, à compléter/ })).toBeInTheDocument()
  })

  it('marks the selected day as pressed', () => {
    setup()
    expect(screen.getByRole('button', { name: /18 juillet.*aujourd'hui/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onSelect with the tapped day', async () => {
    const { onSelect } = setup()
    await userEvent.click(screen.getByRole('button', { name: /16 juillet/ }))
    expect(onSelect).toHaveBeenCalledWith('2026-07-16')
  })

  // AI-tell regression guard: the "eyebrow" uppercase-tracked heading pattern
  // was removed from this heading — don't let it drift back in.
  it('the section heading does not use the uppercase-tracked eyebrow pattern', () => {
    setup()
    const heading = screen.getByRole('heading', { name: '14 derniers jours' })
    expect(heading.className).not.toMatch(/uppercase/)
    expect(heading.className).not.toMatch(/tracking-widest/)
  })
})
