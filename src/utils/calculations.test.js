import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DIMENSIONS,
  SIDE_EFFECTS,
  getEntriesLast14Days,
  getTodayKey,
  buildDayWindow,
  timeToMinutes,
  calculateWearOffTimeline,
  estimateCoverageHours,
  calculateDimensionAverages,
  calculateDayOfWeekPattern,
  calculateSideEffectFrequency,
} from './calculations.js'

// A fully-formed entry, so each test only overrides the fields it cares about.
function entry(overrides = {}) {
  return {
    date: '2026-07-15',
    timeTaken: '08:00',
    timeLogged: '10:00',
    dimensions: {
      focus: 3,
      taskInitiation: 3,
      emotionalRegulation: 3,
      impulseControl: 3,
      workingMemory: 3,
      timeAwareness: 3,
    },
    wearOff: 'none',
    sideEffects: {
      appetiteSuppression: false,
      sleepDifficulty: false,
      headache: false,
      moodChanges: false,
      irritabilityRebound: false,
      anxiety: false,
      physicalSymptoms: false,
    },
    sideEffectSeverity: {},
    notes: '',
    ...overrides,
  }
}

describe('domain constants', () => {
  it('exposes exactly the six Brown dimensions with question + anchors', () => {
    expect(DIMENSIONS).toHaveLength(6)
    for (const d of DIMENSIONS) {
      expect(d).toMatchObject({
        key: expect.any(String),
        label: expect.any(String),
        question: expect.any(String),
        lowLabel: expect.any(String),
        highLabel: expect.any(String),
      })
    }
    expect(DIMENSIONS.map(d => d.key)).toEqual([
      'focus', 'taskInitiation', 'emotionalRegulation',
      'impulseControl', 'workingMemory', 'timeAwareness',
    ])
  })

  it('exposes the seven tracked side effects', () => {
    expect(SIDE_EFFECTS).toHaveLength(7)
    expect(SIDE_EFFECTS.map(s => s.key)).toContain('headache')
  })
})

describe('getTodayKey', () => {
  it('returns an ISO YYYY-MM-DD date key', () => {
    expect(getTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('buildDayWindow', () => {
  it('returns the trailing 14 days, ascending, ending today', () => {
    const w = buildDayWindow('2026-01-01', '2026-07-18')
    expect(w).toHaveLength(14)
    expect(w[0]).toBe('2026-07-05')
    expect(w[13]).toBe('2026-07-18')
    expect([...w]).toEqual([...w].sort()) // already ascending
  })

  it('never starts before the cycle start date', () => {
    expect(buildDayWindow('2026-07-16', '2026-07-18')).toEqual([
      '2026-07-16', '2026-07-17', '2026-07-18',
    ])
  })

  it('is just today when the cycle started today', () => {
    expect(buildDayWindow('2026-07-18', '2026-07-18')).toEqual(['2026-07-18'])
  })

  it('never includes future days, even with a future cycle start', () => {
    expect(buildDayWindow('2026-07-20', '2026-07-18')).toEqual(['2026-07-18'])
  })

  it('falls back to a full 14-day window when no cycle start is given', () => {
    expect(buildDayWindow(undefined, '2026-07-18')).toHaveLength(14)
  })
})

describe('timeToMinutes', () => {
  it('converts HH:MM to minutes since midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('08:30')).toBe(510)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('returns null for empty/missing input', () => {
    expect(timeToMinutes('')).toBeNull()
    expect(timeToMinutes(null)).toBeNull()
    expect(timeToMinutes(undefined)).toBeNull()
  })
})

describe('getEntriesLast14Days', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-07-18T10:00:00')))
  afterEach(() => vi.useRealTimers())

  it('keeps today and the 14-day-old boundary, drops older', () => {
    const entries = [
      entry({ date: '2026-07-18' }), // today
      entry({ date: '2026-07-04' }), // 14 days ago (boundary, kept)
      entry({ date: '2026-07-03' }), // 15 days ago (dropped)
      entry({ date: '2026-06-01' }), // long ago (dropped)
    ]
    const kept = getEntriesLast14Days(entries).map(e => e.date)
    expect(kept).toContain('2026-07-18')
    expect(kept).toContain('2026-07-04')
    expect(kept).not.toContain('2026-07-03')
    expect(kept).not.toContain('2026-06-01')
  })

  it('returns an empty array when nothing is recent', () => {
    expect(getEntriesLast14Days([entry({ date: '2020-01-01' })])).toEqual([])
  })
})

describe('calculateWearOffTimeline', () => {
  it('buckets entries by hours elapsed and averages severity', () => {
    const data = calculateWearOffTimeline([
      entry({ timeTaken: '08:00', timeLogged: '10:00', wearOff: 'none' }), // 2h -> 0–3h, 1
      entry({ timeTaken: '08:00', timeLogged: '10:30', wearOff: 'mild' }), // 2.5h -> 0–3h, 2
      entry({ timeTaken: '08:00', timeLogged: '16:00', wearOff: 'strong' }), // 8h -> 6–9h, 3
    ])
    const early = data.find(b => b.label === '0–3h')
    const late = data.find(b => b.label === '6–9h')
    expect(early.avgWearOff).toBe(1.5)
    expect(early.total).toBe(2)
    expect(late.avgWearOff).toBe(3)
  })

  it('handles a dose taken before midnight and logged after', () => {
    const data = calculateWearOffTimeline([
      entry({ timeTaken: '22:00', timeLogged: '02:00', wearOff: 'mild' }), // 4h elapsed
    ])
    expect(data).toHaveLength(1)
    expect(data[0].label).toBe('3–6h')
  })

  it('ignores entries missing time or wear-off data', () => {
    const data = calculateWearOffTimeline([
      entry({ timeTaken: '', wearOff: 'none' }),
      entry({ wearOff: null }),
    ])
    expect(data).toEqual([])
  })
})

describe('estimateCoverageHours', () => {
  it('returns the hour where wear-off first passes mild', () => {
    const timeline = calculateWearOffTimeline([
      entry({ timeTaken: '08:00', timeLogged: '09:00', wearOff: 'none' }),   // 0–3h, 1
      entry({ timeTaken: '08:00', timeLogged: '12:00', wearOff: 'strong' }), // 3–6h, 3 (>1.5)
    ])
    expect(estimateCoverageHours(timeline)).toBe(3)
  })

  it('returns null for an empty timeline', () => {
    expect(estimateCoverageHours([])).toBeNull()
  })

  it('falls back to the last bucket start when coverage never degrades', () => {
    const timeline = calculateWearOffTimeline([
      entry({ timeTaken: '08:00', timeLogged: '09:00', wearOff: 'none' }), // 0–3h only
    ])
    expect(estimateCoverageHours(timeline)).toBe(0)
  })
})

describe('calculateDimensionAverages', () => {
  it('averages each dimension and rounds to one decimal', () => {
    const result = calculateDimensionAverages([
      entry({ dimensions: { focus: 4 } }),
      entry({ dimensions: { focus: 3 } }),
      entry({ dimensions: { focus: 3 } }),
    ])
    const focus = result.find(d => d.key === 'focus')
    expect(focus.avg).toBe(3.3) // (4+3+3)/3 = 3.333 -> 3.3
    expect(focus.count).toBe(3)
  })

  it('returns null average and zero count when a dimension has no data', () => {
    const result = calculateDimensionAverages([entry({ dimensions: {} })])
    expect(result.find(d => d.key === 'focus').avg).toBeNull()
    expect(result.find(d => d.key === 'focus').count).toBe(0)
  })
})

describe('calculateDayOfWeekPattern', () => {
  it('groups the composite score under the correct weekday', () => {
    const date = '2026-07-13'
    const weekday = new Date(date + 'T12:00:00').getDay()
    const result = calculateDayOfWeekPattern([
      entry({ date, dimensions: { focus: 4, taskInitiation: 2 } }), // composite (4+2)/2 = 3
    ])
    expect(result[weekday].avg).toBe(3)
    expect(result[weekday].count).toBe(1)
  })

  it('leaves days without data as null', () => {
    const result = calculateDayOfWeekPattern([])
    expect(result).toHaveLength(7)
    expect(result.every(d => d.avg === null)).toBe(true)
  })
})

describe('calculateSideEffectFrequency', () => {
  const withHeadache = (v) => entry({ sideEffects: { headache: v } })

  it('counts frequency and percentage over the period', () => {
    const result = calculateSideEffectFrequency([
      withHeadache(true), withHeadache(false), withHeadache(true), withHeadache(false),
    ])
    const h = result.find(s => s.key === 'headache')
    expect(h.count).toBe(2)
    expect(h.pct).toBe(50)
  })

  it('flags an increasing trend when the second half is worse', () => {
    const result = calculateSideEffectFrequency([
      entry({ date: '2026-07-10', sideEffects: { headache: false } }),
      entry({ date: '2026-07-11', sideEffects: { headache: false } }),
      entry({ date: '2026-07-12', sideEffects: { headache: true } }),
      entry({ date: '2026-07-13', sideEffects: { headache: true } }),
    ])
    expect(result.find(s => s.key === 'headache').trend).toBe('increasing')
  })

  it('flags a decreasing trend when the second half improves', () => {
    const result = calculateSideEffectFrequency([
      entry({ date: '2026-07-10', sideEffects: { headache: true } }),
      entry({ date: '2026-07-11', sideEffects: { headache: true } }),
      entry({ date: '2026-07-12', sideEffects: { headache: false } }),
      entry({ date: '2026-07-13', sideEffects: { headache: false } }),
    ])
    expect(result.find(s => s.key === 'headache').trend).toBe('decreasing')
  })

  it('returns zeroed, stable results for no entries', () => {
    const result = calculateSideEffectFrequency([])
    expect(result).toHaveLength(7)
    expect(result.every(s => s.count === 0 && s.pct === 0 && s.trend === 'stable')).toBe(true)
  })
})
