import { describe, expect, it } from 'vitest'
import { computeMonthlyStatistics } from '@/features/statistics/statistics'
import { buildRecord, createEmptyDraft } from '@/features/records/record.utils'
import { DEFAULT_CHILD_ID } from '@/lib/constants'
import type { CareRecord } from '@/features/records/record.types'
import type { CareRecordDraft } from '@/features/records/record.types'

function record(date: string, patch: Partial<CareRecordDraft>): CareRecord {
  return buildRecord({ ...createEmptyDraft(DEFAULT_CHILD_ID, date), ...patch })
}

describe('computeMonthlyStatistics', () => {
  const records = [
    record('2026-09-01', {
      primaryCaregiver: 'mother',
      activities: [
        { activity: 'dropoff', caregiver: 'mother' },
        { activity: 'pickup', caregiver: 'grandmother' },
      ],
    }),
    record('2026-09-02', {
      primaryCaregiver: 'mother',
      activities: [{ activity: 'bath', caregiver: 'father' }],
      expenses: [{ id: 'e1', amount: 300, category: 'medical', payer: 'father' }],
    }),
    record('2026-09-03', {
      primaryCaregiver: 'father',
      activities: [{ activity: 'dropoff', caregiver: 'father' }],
      expenses: [{ id: 'e2', amount: 150, category: 'daily', payer: 'mother' }],
    }),
  ]

  const stats = computeMonthlyStatistics('2026-09', records)

  it('計算有紀錄的天數', () => {
    expect(stats.recordedDays).toBe(3)
  })

  it('主要照顧者以天數統計，且依固定順序輸出而非依次數排名', () => {
    expect(stats.primaryCaregiverDays).toEqual([
      { caregiver: 'mother', count: 2 },
      { caregiver: 'father', count: 1 },
    ])
  })

  it('各活動分別統計執行者', () => {
    const dropoff = stats.activities.find((item) => item.activity === 'dropoff')
    expect(dropoff?.total).toBe(2)
    expect(dropoff?.byCaregiver).toEqual([
      { caregiver: 'mother', count: 1 },
      { caregiver: 'father', count: 1 },
    ])

    const night = stats.activities.find((item) => item.activity === 'night')
    expect(night?.total).toBe(0)
    expect(night?.byCaregiver).toEqual([])
  })

  it('費用加總並依付款人分列', () => {
    expect(stats.expenseTotal).toBe(450)
    expect(stats.expenseByPayer).toEqual([
      { caregiver: 'mother', count: 150 },
      { caregiver: 'father', count: 300 },
    ])
  })

  it('沒有紀錄的月份回傳全零，不推測任何照顧行為', () => {
    const empty = computeMonthlyStatistics('2026-10', [])
    expect(empty.recordedDays).toBe(0)
    expect(empty.primaryCaregiverDays).toEqual([])
    expect(empty.activities.every((item) => item.total === 0)).toBe(true)
  })
})
