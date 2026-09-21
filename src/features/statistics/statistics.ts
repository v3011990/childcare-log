import { CARE_ACTIVITIES, CAREGIVERS } from '@/lib/constants'
import { totalExpense } from '@/features/records/record.utils'
import type { CareRecord } from '@/features/records/record.types'
import type { CareActivity, Caregiver } from '@/types/common'

export interface CaregiverCount {
  caregiver: Caregiver
  count: number
}

export interface ActivityDistribution {
  activity: CareActivity
  /** 有勾選這項活動的天數。同一天由多人協助仍然只算一天。 */
  days: number
  /** 每位照顧者參與這項活動的天數。多人協助時，各人天數加總會大於 `days`。 */
  byCaregiver: CaregiverCount[]
}

export interface MonthlyStatistics {
  monthKey: string
  /** 該月有留下紀錄的天數。沒有紀錄的日子不做任何假設。 */
  recordedDays: number
  /** 被填為「今天主要照顧者」的天數。 */
  primaryCaregiverDays: CaregiverCount[]
  activities: ActivityDistribution[]
  expenseTotal: number
  expenseByPayer: CaregiverCount[]
}

/**
 * 月統計。
 *
 * 刻意的設計限制（SPEC §14）：
 * - 只輸出次數，不計算比例排名、不加權、不產生任何評分。
 * - 照顧者一律依固定順序輸出，不依次數排序，避免版面本身變成排行榜。
 * - 沒有紀錄的日子不補值、不推測。
 */
export function computeMonthlyStatistics(
  monthKey: string,
  records: CareRecord[],
): MonthlyStatistics {
  const primary = new Map<Caregiver, number>()
  const activityTotals = new Map<CareActivity, Map<Caregiver, number>>()
  const activityDays = new Map<CareActivity, number>()
  const payers = new Map<Caregiver, number>()
  let expenseTotal = 0

  for (const record of records) {
    if (record.primaryCaregiver) {
      primary.set(record.primaryCaregiver, (primary.get(record.primaryCaregiver) ?? 0) + 1)
    }
    for (const item of record.activities) {
      activityDays.set(item.activity, (activityDays.get(item.activity) ?? 0) + 1)
      const bucket = activityTotals.get(item.activity) ?? new Map<Caregiver, number>()
      // 同一天同一位照顧者只計一次，即使重複出現也不會灌水。
      for (const caregiver of new Set(item.caregivers)) {
        bucket.set(caregiver, (bucket.get(caregiver) ?? 0) + 1)
      }
      activityTotals.set(item.activity, bucket)
    }
    for (const expense of record.expenses) {
      payers.set(expense.payer, (payers.get(expense.payer) ?? 0) + expense.amount)
    }
    expenseTotal += totalExpense(record)
  }

  const asCounts = (source: Map<Caregiver, number>): CaregiverCount[] =>
    CAREGIVERS.filter((caregiver) => (source.get(caregiver) ?? 0) > 0).map((caregiver) => ({
      caregiver,
      count: source.get(caregiver) ?? 0,
    }))

  return {
    monthKey,
    recordedDays: records.length,
    primaryCaregiverDays: asCounts(primary),
    activities: CARE_ACTIVITIES.map((activity) => ({
      activity,
      days: activityDays.get(activity) ?? 0,
      byCaregiver: asCounts(activityTotals.get(activity) ?? new Map<Caregiver, number>()),
    })),
    expenseTotal,
    expenseByPayer: asCounts(payers),
  }
}
