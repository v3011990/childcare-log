import {
  CARE_ACTIVITIES,
  CARE_ACTIVITY_SHORT_LABELS,
  CAREGIVERS,
  CAREGIVER_LABELS,
  CHILD_STATUS_LABELS,
  IMPORTANT_EVENT_LABELS,
  SCHEMA_VERSION,
} from '@/lib/constants'
import { nowISO } from '@/lib/dates'
import type { CareActivity, Caregiver, ISODateString } from '@/types/common'
import type { CareRecord, CareRecordDraft, Expense } from '@/features/records/record.types'

/** 一筆全新的空白紀錄。預設什麼都不勾、不預填任何照顧行為（SPEC §16.7、§25）。 */
export function createEmptyDraft(childId: string, date: ISODateString): CareRecordDraft {
  return {
    childId,
    date,
    primaryCaregiver: undefined,
    activities: [],
    childStatus: [],
    childStatusNote: undefined,
    caregiverNotes: {},
    importantEvents: [],
    importantNote: undefined,
    expenses: [],
  }
}

/** 去掉只有空白字元的文字，避免把空字串當成使用者輸入存起來。 */
function hasText(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 判斷這筆紀錄是否完全沒有內容。
 * 空白的當日草稿不會寫進資料庫，避免歷史紀錄出現一整排空白的日子。
 */
export function isDraftEmpty(draft: CareRecordDraft): boolean {
  if (draft.primaryCaregiver) return false
  if (draft.activities.length > 0) return false
  if (draft.childStatus.length > 0) return false
  if (draft.importantEvents.length > 0) return false
  if (draft.expenses.length > 0) return false
  if (hasText(draft.childStatusNote)) return false
  if (hasText(draft.importantNote)) return false
  return !Object.values(draft.caregiverNotes).some((note) => hasText(note))
}

/** 存檔前整理：移除空白文字欄位，但保留使用者原樣輸入的內容（SPEC §16.6）。 */
export function normalizeDraft(draft: CareRecordDraft): CareRecordDraft {
  const caregiverNotes: Partial<Record<Caregiver, string>> = {}
  for (const caregiver of CAREGIVERS) {
    const note = draft.caregiverNotes[caregiver]
    if (hasText(note)) caregiverNotes[caregiver] = note
  }

  // 活動與其照顧者都固定依畫面順序儲存，讓匯出與比對結果穩定，不受點選先後影響。
  // 沒有任何照顧者的活動視為未勾選，不會留下沒有執行者的紀錄。
  const seenActivities = new Set<CareActivity>()
  const activities = CARE_ACTIVITIES.flatMap((activity) => {
    const found = draft.activities.find((item) => item.activity === activity)
    if (!found || seenActivities.has(activity)) return []
    seenActivities.add(activity)
    const caregivers = CAREGIVERS.filter((caregiver) => found.caregivers.includes(caregiver))
    return caregivers.length > 0 ? [{ activity, caregivers }] : []
  })

  return {
    ...draft,
    activities,
    childStatusNote: hasText(draft.childStatusNote) ? draft.childStatusNote : undefined,
    importantNote: hasText(draft.importantNote) ? draft.importantNote : undefined,
    caregiverNotes,
    expenses: draft.expenses.filter((expense) => Number.isFinite(expense.amount)),
  }
}

export function toDraft(record: CareRecord): CareRecordDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, schemaVersion: _s, ...draft } = record
  return draft
}

export function buildRecord(draft: CareRecordDraft, existing?: CareRecord): CareRecord {
  const normalized = normalizeDraft(draft)
  return {
    ...normalized,
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? nowISO(),
    updatedAt: nowISO(),
    schemaVersion: SCHEMA_VERSION,
  }
}

export interface SummaryLine {
  label: string
  value: string
}

/**
 * 歷史列表用的摘要。只陳述紀錄裡有的內容，不做任何推論或評價（SPEC §2.3、§14）。
 */
export function recordSummaryLines(record: CareRecord): SummaryLine[] {
  const lines: SummaryLine[] = []

  if (record.primaryCaregiver) {
    lines.push({ label: '主要照顧', value: CAREGIVER_LABELS[record.primaryCaregiver] })
  }
  for (const item of record.activities) {
    lines.push({
      label: CARE_ACTIVITY_SHORT_LABELS[item.activity],
      value: item.caregivers.map((caregiver) => CAREGIVER_LABELS[caregiver]).join('、'),
    })
  }
  if (record.childStatus.length > 0) {
    lines.push({
      label: '孩子狀況',
      value: record.childStatus.map((status) => CHILD_STATUS_LABELS[status]).join('、'),
    })
  }
  if (record.importantEvents.length > 0) {
    lines.push({
      label: '重要事項',
      value: record.importantEvents.map((tag) => IMPORTANT_EVENT_LABELS[tag]).join('、'),
    })
  }
  if (record.expenses.length > 0) {
    lines.push({ label: '費用', value: `${totalExpense(record)} 元` })
  }

  return lines
}

/**
 * 新增一筆費用。付款人預設帶入當天的主要照顧者而不是寫死某一方，
 * 預設值會直接顯示在畫面上，使用者隨時可以改（SPEC §2.5、§16.7）。
 */
export function createExpense(defaultPayer: Caregiver = 'mother'): Expense {
  return {
    id: crypto.randomUUID(),
    amount: 0,
    category: 'daily',
    payer: defaultPayer,
  }
}

export function totalExpense(record: Pick<CareRecord, 'expenses'>): number {
  return record.expenses.reduce((sum, expense) => sum + expense.amount, 0)
}

/** 這天實際有出現的照顧者（主要照顧者、各活動執行者、已寫下紀錄者、付款人）。 */
export function involvedCaregivers(draft: CareRecordDraft): Caregiver[] {
  const seen = new Set<Caregiver>()
  if (draft.primaryCaregiver) seen.add(draft.primaryCaregiver)
  for (const item of draft.activities) for (const caregiver of item.caregivers) seen.add(caregiver)
  for (const key of Object.keys(draft.caregiverNotes) as Caregiver[]) seen.add(key)
  for (const expense of draft.expenses) seen.add(expense.payer)
  return CAREGIVERS.filter((caregiver) => seen.has(caregiver))
}
