import type {
  CareActivity,
  Caregiver,
  ChildStatus,
  ExpenseCategory,
  ImportantEventTag,
} from '@/types/common'

export const APP_NAME = '3 分鐘育兒紀錄'
export const APP_SHORT_NAME = '育兒紀錄'

/** 資料結構版本，匯出／匯入備份時用來判斷相容性。 */
export const SCHEMA_VERSION = 1

/** 第一版為單一孩子，使用固定 id，不需要使用者建立。 */
export const DEFAULT_CHILD_ID = 'default-child'
export const DEFAULT_CHILD_NAME = '寶寶'

export const SETTINGS_KEYS = {
  activeChildId: 'activeChildId',
} as const

/**
 * 照顧者顯示順序。常用的排前面（SPEC §25），
 * 但順序本身不代表任何評價或重要性。
 */
export const CAREGIVERS: readonly Caregiver[] = [
  'mother',
  'father',
  'grandmother',
  'grandfather',
  'paternal_grandmother',
  'paternal_grandfather',
  'other',
]

export const CAREGIVER_LABELS: Record<Caregiver, string> = {
  mother: '媽媽',
  father: '爸爸',
  grandmother: '外婆',
  grandfather: '外公',
  paternal_grandmother: '奶奶',
  paternal_grandfather: '爺爺',
  other: '其他',
}

export const CARE_ACTIVITIES: readonly CareActivity[] = [
  'morning',
  'dropoff',
  'pickup',
  'meal',
  'play',
  'bath',
  'bedtime',
  'night',
]

export const CARE_ACTIVITY_LABELS: Record<CareActivity, string> = {
  morning: '早晨準備',
  dropoff: '送托／送學',
  pickup: '接托／接學',
  meal: '吃飯／餵食',
  play: '陪玩',
  bath: '洗澡／清潔',
  bedtime: '哄睡',
  night: '夜間照顧',
}

/** CSV 欄位使用的短標題（SPEC §15）。 */
export const CARE_ACTIVITY_SHORT_LABELS: Record<CareActivity, string> = {
  morning: '早晨準備',
  dropoff: '送托',
  pickup: '接托',
  meal: '吃飯',
  play: '陪玩',
  bath: '洗澡',
  bedtime: '哄睡',
  night: '夜間照顧',
}

export const CHILD_STATUSES: readonly ChildStatus[] = ['normal', 'sick', 'emotional', 'other']

export const CHILD_STATUS_LABELS: Record<ChildStatus, string> = {
  normal: '正常',
  sick: '生病',
  emotional: '情緒較多',
  other: '其他',
}

export const IMPORTANT_EVENT_TAGS: readonly ImportantEventTag[] = [
  'sick',
  'doctor',
  'vaccine',
  'school_contact',
  'soothing',
  'other',
]

export const IMPORTANT_EVENT_LABELS: Record<ImportantEventTag, string> = {
  sick: '生病／不舒服',
  doctor: '看醫生',
  vaccine: '疫苗',
  school_contact: '托嬰／學校聯絡',
  soothing: '情緒需要特別安撫',
  other: '其他',
}

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'medical',
  'education',
  'insurance',
  'daily',
  'other',
]

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  medical: '醫療',
  education: '教育',
  insurance: '保險',
  daily: '日常',
  other: '其他',
}

export const PRIVACY_NOTICE =
  '本 App 的第一版資料僅儲存在此裝置的瀏覽器中。清除瀏覽器網站資料可能造成紀錄遺失，請定期匯出備份。'
