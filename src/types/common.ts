/**
 * 跨 feature 共用的基礎型別。
 *
 * 命名原則：所有列舉值都保持中立，不隱含任何照顧者的好壞評價。
 */

/** 本地日期字串，格式固定為 `YYYY-MM-DD`（依裝置所在時區，不做 UTC 轉換）。 */
export type ISODateString = string

/** 完整時間戳（ISO 8601），僅用於 createdAt / updatedAt 這類系統欄位。 */
export type ISODateTimeString = string

export type Caregiver =
  | 'mother'
  | 'father'
  | 'grandmother'
  | 'grandfather'
  | 'paternal_grandmother'
  | 'paternal_grandfather'
  | 'other'

/**
 * 照顧活動。
 *
 * 新增項目時只能往後追加新的字面值，不可改名或刪除既有值，
 * 否則使用者裝置上的歷史紀錄會對不上（SPEC §16）。
 */
export type CareActivity =
  | 'morning'
  | 'dropoff'
  | 'pickup'
  | 'meal'
  | 'bottle'
  | 'solids'
  | 'diaper'
  | 'medicine'
  | 'play'
  | 'outing'
  | 'bath'
  | 'bedtime'
  | 'night'

export type ChildStatus = 'normal' | 'sick' | 'emotional' | 'other'

export type ExpenseCategory = 'medical' | 'education' | 'insurance' | 'daily' | 'other'

/** 重要事件的快速標籤（SPEC §10）。選擇後才展開文字輸入。 */
export type ImportantEventTag =
  'sick' | 'doctor' | 'vaccine' | 'school_contact' | 'soothing' | 'other'

export interface Child {
  id: string
  name: string
  createdAt: ISODateTimeString
}

/** settings 表為 key-value 結構，value 允許任意 JSON 值。 */
export interface SettingEntry {
  key: string
  value: unknown
}
