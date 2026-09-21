import type {
  CareActivity,
  Caregiver,
  ChildStatus,
  ExpenseCategory,
  ISODateString,
  ISODateTimeString,
  ImportantEventTag,
} from '@/types/common'

/** 一項照顧活動，以及實際執行的照顧者。 */
export interface CareActivityRecord {
  activity: CareActivity
  caregiver: Caregiver
}

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  payer: Caregiver
  note?: string
}

/**
 * 每個孩子每一天最多一筆紀錄（由 `[childId+date]` 唯一索引保證）。
 *
 * 與原始 SPEC §6 的差異（已與使用者確認）：
 * - `fatherCareNote` / `motherCareNote` → `caregiverNotes`，讓外婆、爺爺奶奶等
 *   照顧者也能被公平記錄（產品原則 §2.5）。匯出 CSV 時仍會拆回爸爸／媽媽欄位。
 * - `expense` → `expenses`，同一天可能有掛號費、藥費等多筆支出。
 * - 新增 `importantEvents`，對應 SPEC §10 的快速標籤。
 * - 新增 `schemaVersion`，讓匯入備份時可以判斷版本相容性。
 */
export interface CareRecord {
  id: string
  childId: string
  /** `YYYY-MM-DD`，使用者所在時區的當地日期。 */
  date: ISODateString
  primaryCaregiver?: Caregiver
  activities: CareActivityRecord[]
  childStatus: ChildStatus[]
  childStatusNote?: string
  /** 以照顧者為 key 的自由文字紀錄，僅保存使用者實際輸入的內容。 */
  caregiverNotes: Partial<Record<Caregiver, string>>
  importantEvents: ImportantEventTag[]
  importantNote?: string
  expenses: Expense[]
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
  schemaVersion: number
}

/** 建立／更新紀錄時，UI 可以送出的欄位（系統欄位由 repository 維護）。 */
export type CareRecordDraft = Omit<CareRecord, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>
