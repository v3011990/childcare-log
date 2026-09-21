import {
  CARE_ACTIVITIES,
  CARE_ACTIVITY_SHORT_LABELS,
  CAREGIVERS,
  CAREGIVER_LABELS,
  CHILD_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  IMPORTANT_EVENT_LABELS,
} from '@/lib/constants'
import { totalExpense } from '@/features/records/record.utils'
import type { CareRecord } from '@/features/records/record.types'
import type { Caregiver } from '@/types/common'

/** Excel 在 Big5 環境下需要 BOM 才不會把 UTF-8 中文讀成亂碼。 */
export const CSV_BOM = '﻿'

export const CSV_HEADERS = [
  '日期',
  '主要照顧者',
  ...CARE_ACTIVITIES.map((activity) => CARE_ACTIVITY_SHORT_LABELS[activity]),
  '孩子狀況',
  '狀況補充',
  '爸爸照顧紀錄',
  '媽媽照顧紀錄',
  '其他照顧者紀錄',
  '重要事項',
  '費用',
  '付款人',
  '費用明細',
  '建立時間',
  '最後修改',
]

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function otherCaregiverNotes(record: CareRecord): string {
  return CAREGIVERS.filter((caregiver) => caregiver !== 'mother' && caregiver !== 'father')
    .flatMap((caregiver) => {
      const note = record.caregiverNotes[caregiver]
      return note ? [`${CAREGIVER_LABELS[caregiver]}：${note}`] : []
    })
    .join('\n')
}

function expenseDetail(record: CareRecord): string {
  return record.expenses
    .map((expense) => {
      const parts = [
        EXPENSE_CATEGORY_LABELS[expense.category],
        `${expense.amount} 元`,
        CAREGIVER_LABELS[expense.payer],
      ]
      if (expense.note) parts.push(expense.note)
      return parts.join('／')
    })
    .join('\n')
}

function payerSummary(record: CareRecord): string {
  const seen = new Set<Caregiver>(record.expenses.map((expense) => expense.payer))
  return CAREGIVERS.filter((caregiver) => seen.has(caregiver))
    .map((caregiver) => CAREGIVER_LABELS[caregiver])
    .join('、')
}

export function recordToCsvRow(record: CareRecord): string[] {
  const activityCells = CARE_ACTIVITIES.map((activity) => {
    const found = record.activities.find((item) => item.activity === activity)
    return found ? CAREGIVER_LABELS[found.caregiver] : ''
  })

  return [
    record.date,
    record.primaryCaregiver ? CAREGIVER_LABELS[record.primaryCaregiver] : '',
    ...activityCells,
    record.childStatus.map((status) => CHILD_STATUS_LABELS[status]).join('、'),
    record.childStatusNote ?? '',
    record.caregiverNotes.father ?? '',
    record.caregiverNotes.mother ?? '',
    otherCaregiverNotes(record),
    [
      record.importantEvents.map((tag) => IMPORTANT_EVENT_LABELS[tag]).join('、'),
      record.importantNote ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
    record.expenses.length > 0 ? String(totalExpense(record)) : '',
    payerSummary(record),
    expenseDetail(record),
    record.createdAt,
    record.updatedAt,
  ]
}

/**
 * 產生 CSV。日期由舊到新排序，方便在 Excel / Google Sheets 直接看時間軸。
 * 所有欄位都原樣輸出，不做任何補寫或推測（SPEC §16）。
 */
export function buildCsv(records: CareRecord[]): string {
  const rows = [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((record) => recordToCsvRow(record))

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(','))
    .join('\r\n')
}

export function csvFileName(now: Date = new Date()): string {
  return `育兒紀錄-${now.toISOString().slice(0, 10)}.csv`
}
