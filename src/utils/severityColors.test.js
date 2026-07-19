import { describe, it, expect } from 'vitest'
import { SEVERITY_LEVELS, hexForLevel, tintForLevel } from './severityColors.js'

describe('severityColors', () => {
  it('exposes 5 ordered levels, red (1) to green (5)', () => {
    expect(SEVERITY_LEVELS.map(l => l.value)).toEqual([1, 2, 3, 4, 5])
    expect(SEVERITY_LEVELS[0].hex).toBe('#B23B3B')
    expect(SEVERITY_LEVELS[4].hex).toBe('#2F6B44')
  })

  it('hexForLevel returns the canonical hex per step', () => {
    expect(hexForLevel(1)).toBe('#B23B3B')
    expect(hexForLevel(3)).toBe('#E8C93E')
    expect(hexForLevel(5)).toBe('#2F6B44')
  })

  it('hexForLevel falls back to gray for an out-of-range level', () => {
    expect(hexForLevel(0)).toBe('#d1d5db')
    expect(hexForLevel(99)).toBe('#d1d5db')
  })

  it('tintForLevel returns the matching danger/warning/success tint pair', () => {
    expect(tintForLevel(1)).toBe('bg-[#FBEAE8] text-[#9C3C3D]')
    expect(tintForLevel(3)).toBe('bg-[#FCF3D9] text-[#6B5814]')
    expect(tintForLevel(5)).toBe('bg-[#EAF3EC] text-[#2F6B44]')
  })

  it('tintForLevel falls back to gray for an out-of-range level', () => {
    expect(tintForLevel(0)).toBe('bg-gray-100 text-gray-500')
  })
})
