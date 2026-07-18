import { describe, it, expect } from 'vitest'
import { SEVERITY_LEVELS, hexForLevel, tintForLevel } from './severityColors.js'

describe('severityColors', () => {
  it('exposes 5 ordered levels, red (1) to green (5)', () => {
    expect(SEVERITY_LEVELS.map(l => l.value)).toEqual([1, 2, 3, 4, 5])
    expect(SEVERITY_LEVELS[0].hex).toBe('#ef4444')
    expect(SEVERITY_LEVELS[4].hex).toBe('#16a34a')
  })

  it('hexForLevel returns the canonical hex per step', () => {
    expect(hexForLevel(1)).toBe('#ef4444')
    expect(hexForLevel(3)).toBe('#facc15')
    expect(hexForLevel(5)).toBe('#16a34a')
  })

  it('hexForLevel falls back to gray for an out-of-range level', () => {
    expect(hexForLevel(0)).toBe('#d1d5db')
    expect(hexForLevel(99)).toBe('#d1d5db')
  })

  it('tintForLevel returns the matching bg-*-100/text-*-800 pair', () => {
    expect(tintForLevel(1)).toBe('bg-red-100 text-red-800')
    expect(tintForLevel(3)).toBe('bg-yellow-100 text-yellow-800')
    expect(tintForLevel(5)).toBe('bg-green-100 text-green-800')
  })

  it('tintForLevel falls back to gray for an out-of-range level', () => {
    expect(tintForLevel(0)).toBe('bg-gray-100 text-gray-500')
  })
})
