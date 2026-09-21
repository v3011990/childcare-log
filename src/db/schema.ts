import type { Child, SettingEntry } from '@/types/common'
import type { CareRecord } from '@/features/records/record.types'

export const DATABASE_NAME = 'ChildCareLog'

export interface DatabaseTables {
  records: CareRecord
  children: Child
  settings: SettingEntry
}

/**
 * Dexie store 定義。
 *
 * `&[childId+date]` 是在 SPEC §7 的基礎上加上的唯一複合索引：
 * 沒有它，同一天可能因為重複建立而產生多筆紀錄，統計與匯出都會失真。
 */
export const STORES_V1 = {
  records: 'id, childId, date, primaryCaregiver, createdAt, &[childId+date]',
  children: 'id, name',
  settings: 'key',
} as const
