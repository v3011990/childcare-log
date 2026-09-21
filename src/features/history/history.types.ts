import type { CareRecord } from '@/features/records/record.types'

/** 歷史頁以月份分組顯示，每組內部依日期由新到舊排列。 */
export interface MonthGroup {
  monthKey: string
  label: string
  records: CareRecord[]
}

/** 歷史頁的日期篩選：全部，或指定某個月份。 */
export type DateFilterValue = { kind: 'all' } | { kind: 'month'; monthKey: string }
