import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LikertScale from './LikertScale.jsx'

function setup(props = {}) {
  const onChange = vi.fn()
  render(
    <LikertScale
      label="Focus & Attention"
      question="Je garde mon focus ?"
      value={null}
      onChange={onChange}
      lowLabel="Aucune"
      highLabel="Vif"
      {...props}
    />
  )
  return { onChange }
}

describe('LikertScale', () => {
  it('renders five rating buttons', () => {
    setup()
    const group = screen.getByRole('group')
    expect(within(group).getAllByRole('button')).toHaveLength(5)
  })

  it('calls onChange with the chosen value', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Niveau 3 sur 5' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  // Non-regression guard for the accessibility work in PR #7.
  it('exposes a labelled radiogroup-style group naming the question', () => {
    setup()
    expect(
      screen.getByRole('group', { name: /Focus & Attention : Je garde mon focus \?/ })
    ).toBeInTheDocument()
  })

  it('marks only the selected value as pressed', () => {
    setup({ value: 4 })
    expect(screen.getByRole('button', { name: 'Niveau 4 sur 5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Niveau 2 sur 5' })).toHaveAttribute('aria-pressed', 'false')
  })

  // Guards the severityColors.js extraction: the colors here are now sourced
  // from a shared module, but the rendered classes — including the a11y
  // contrast exceptions on levels 3 and 5 — must stay byte-identical.
  it('renders the pre-extraction colors, including the a11y contrast exceptions', () => {
    setup({ value: 3 })
    const btn3 = screen.getByRole('button', { name: 'Niveau 3 sur 5' })
    expect(btn3.className).toContain('bg-yellow-400')
    expect(btn3.className).toContain('text-gray-900') // dark text for contrast on yellow-400
    const btn5 = screen.getByRole('button', { name: 'Niveau 5 sur 5' }) // inactive here
    expect(btn5.className).toContain('bg-green-50')
    expect(btn5.className).toContain('text-green-700')
  })
})
