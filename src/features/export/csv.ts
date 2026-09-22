import {
  CARE_ACTIVITIES,
  CARE_ACTIVITY_SHORT_LABELS,
  CAREGIVERS,
  CAREGIVER_LABELS,
  CHILD_STATUSES,
  CHILD_STATUS_LABELS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  IMPORTANT_EVENT_LABELS,
  IMPORTANT_EVENT_TAGS,
  SCHEMA_VERSION,
} from '@/lib/constants'
import { format } from 'date-fns'
import { DATE_FORMAT, isValidISODate, nowISO } from '@/lib/dates'
import { totalExpense } from '@/features/records/record.utils'
import type { CareRecord, Expense } from '@/features/records/record.types'
import type {
  CareActivity,
  Caregiver,
  ChildStatus,
  ExpenseCategory,
  ImportantEventTag,
} from '@/types/common'

/** Excel 在 Big5 環境下需要 BOM 才不會把 UTF-8 中文讀成亂碼。 */
export const CSV_BOM = '﻿'

/** 多值欄位（照顧者、狀況、標籤）的分隔字元。所有標籤本身都不含頓號，因此可逆。 */
const MULTI_SEPARATOR = '、'

/** 費用明細每筆一行，欄位以直線分隔：類別|金額|付款人|備註 */
const EXPENSE_FIELD_SEPARATOR = '|'

const CAREGIVER_NOTE_HEADERS = CAREGIVERS.map(
  (caregiver) => `${CAREGIVER_LABELS[caregiver]}照顧紀錄`,
)

/**
 * CSV 欄位。
 *
 * 這份 CSV 同時是「給人看的表格」與「唯一的備份格式」，所以每一欄都必須能原樣讀回來：
 * - 重要事項的標籤與說明各自成欄，不再黏在同一格。
 * - 每位照顧者的紀錄各自成欄，不再擠成一欄後靠冒號拆解。
 * - 「費用」與「付款人」是方便閱讀的衍生欄位，匯入時會忽略並由「費用明細」重新計算。
 */
export const CSV_HEADERS = [
  '日期',
  '主要照顧者',
  ...CARE_ACTIVITIES.map((activity) => CARE_ACTIVITY_SHORT_LABELS[activity]),
  '孩子狀況',
  '狀況補充',
  ...CAREGIVER_NOTE_HEADERS,
  '重要事項',
  '重要事項說明',
  '費用',
  '付款人',
  '費用明細',
  '建立時間',
  '最後修改',
]

function invert<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return new Map(values.map((value) => [labels[value], value]))
}

const CAREGIVER_BY_LABEL = invert(CAREGIVERS, CAREGIVER_LABELS)
const CHILD_STATUS_BY_LABEL = invert(CHILD_STATUSES, CHILD_STATUS_LABELS)
const IMPORTANT_TAG_BY_LABEL = invert(IMPORTANT_EVENT_TAGS, IMPORTANT_EVENT_LABELS)
const EXPENSE_CATEGORY_BY_LABEL = invert(EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS)

// ───────────────────────────── 匯出 ─────────────────────────────

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function expenseDetail(record: CareRecord): string {
  return record.expenses
    .map((expense) =>
      [
        EXPENSE_CATEGORY_LABELS[expense.category],
        String(expense.amount),
        CAREGIVER_LABELS[expense.payer],
        expense.note ?? '',
      ].join(EXPENSE_FIELD_SEPARATOR),
    )
    .join('\n')
}

function payerSummary(record: CareRecord): string {
  const seen = new Set<Caregiver>(record.expenses.map((expense) => expense.payer))
  return CAREGIVERS.filter((caregiver) => seen.has(caregiver))
    .map((caregiver) => CAREGIVER_LABELS[caregiver])
    .join(MULTI_SEPARATOR)
}

export function recordToCsvRow(record: CareRecord): string[] {
  const activityCells = CARE_ACTIVITIES.map((activity) => {
    const found = record.activities.find((item) => item.activity === activity)
    return found
      ? found.caregivers.map((caregiver) => CAREGIVER_LABELS[caregiver]).join(MULTI_SEPARATOR)
      : ''
  })

  return [
    record.date,
    record.primaryCaregiver ? CAREGIVER_LABELS[record.primaryCaregiver] : '',
    ...activityCells,
    record.childStatus.map((status) => CHILD_STATUS_LABELS[status]).join(MULTI_SEPARATOR),
    record.childStatusNote ?? '',
    ...CAREGIVERS.map((caregiver) => record.caregiverNotes[caregiver] ?? ''),
    record.importantEvents.map((tag) => IMPORTANT_EVENT_LABELS[tag]).join(MULTI_SEPARATOR),
    record.importantNote ?? '',
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

/**
 * 檔名刻意用 ASCII。中文檔名在部分瀏覽器（例如 headless Chromium、部分行動瀏覽器）
 * 會被丟棄成沒有副檔名的「download」，之後連匯入的檔案選擇器都挑不到它。
 */
export function csvFileName(now: Date = new Date()): string {
  return `childcare-log-${format(now, DATE_FORMAT)}.csv`
}

// ───────────────────────────── 匯入 ─────────────────────────────

/**
 * 最小的 RFC 4180 解析器：支援雙引號跳脫與儲存格內換行，
 * 同時接受 CRLF 與 LF。不另外加依賴，行為才完全可控。
 */
export function parseCsvText(text: string): string[][] {
  const input = text.startsWith(CSV_BOM) ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\r') {
      // 由後面的 \n 收尾，單獨的 \r 也視為換行
      if (input[i + 1] !== '\n') {
        row.push(cell)
        rows.push(row)
        row = []
        cell = ''
      }
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((entry) => entry.some((value) => value.trim().length > 0))
}

export interface CsvParseSuccess {
  ok: true
  records: CareRecord[]
}

export interface CsvParseFailure {
  ok: false
  message: string
  detail?: string
}

export type CsvParseResult = CsvParseSuccess | CsvParseFailure

export const IMPORT_ERROR_MESSAGE = '無法匯入此檔案\n\n資料格式可能不完整或不是本 App 匯出的 CSV。'

class RowError extends Error {}

function splitMulti(value: string): string[] {
  return value
    .split(MULTI_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function lookup<T>(map: Map<string, T>, label: string, columnName: string): T {
  const found = map.get(label)
  if (found === undefined) {
    throw new RowError(`「${columnName}」欄有無法辨識的項目：${label}`)
  }
  return found
}

function parseExpenses(detail: string): Expense[] {
  if (detail.trim().length === 0) return []

  return detail
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      // 備註可能含有直線，所以只切前三個分隔字元，其餘全部算備註。
      const first = line.indexOf(EXPENSE_FIELD_SEPARATOR)
      const second = line.indexOf(EXPENSE_FIELD_SEPARATOR, first + 1)
      const third = line.indexOf(EXPENSE_FIELD_SEPARATOR, second + 1)
      if (first < 0 || second < 0 || third < 0) {
        throw new RowError(`「費用明細」格式應為「類別|金額|付款人|備註」，第 ${index + 1} 筆不符`)
      }

      const category = lookup<ExpenseCategory>(
        EXPENSE_CATEGORY_BY_LABEL,
        line.slice(0, first).trim(),
        '費用明細',
      )
      const amount = Number(line.slice(first + 1, second).trim())
      if (!Number.isFinite(amount) || amount < 0) {
        throw new RowError(`「費用明細」第 ${index + 1} 筆的金額不是有效數字`)
      }
      const payer = lookup<Caregiver>(
        CAREGIVER_BY_LABEL,
        line.slice(second + 1, third).trim(),
        '費用明細',
      )
      const note = line.slice(third + 1)

      return {
        id: crypto.randomUUID(),
        amount,
        category,
        payer,
        ...(note.trim().length > 0 ? { note } : {}),
      }
    })
}

function validTimestamp(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  return Number.isNaN(new Date(trimmed).getTime()) ? undefined : trimmed
}

/**
 * 把 CSV 解析回紀錄。
 *
 * - 「費用」與「付款人」是衍生欄位，這裡刻意忽略，一律由「費用明細」重算，
 *   避免檔案被人工編輯後總額與明細對不起來。
 * - 「建立時間」沿用檔案裡的值（SPEC §16.2、§16.4）；缺漏或無效才用當下時間。
 * - 任何一列有無法辨識的內容就整份不匯入，並回報是第幾列、哪一欄，
 *   不會只丟掉那一列而讓使用者以為匯入成功（SPEC §21）。
 */
export function parseCsvRecords(text: string, childId: string): CsvParseResult {
  const rows = parseCsvText(text)
  if (rows.length === 0) {
    return { ok: false, message: IMPORT_ERROR_MESSAGE, detail: '檔案是空的。' }
  }

  const header = (rows[0] ?? []).map((cell) => cell.trim())
  const missing = CSV_HEADERS.filter((name) => !header.includes(name))
  if (missing.length > 0) {
    return {
      ok: false,
      message: IMPORT_ERROR_MESSAGE,
      detail: `缺少欄位：${missing.join('、')}`,
    }
  }

  const indexOf = (name: string) => header.indexOf(name)
  const records: CareRecord[] = []
  const seenDates = new Set<string>()

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    const cell = (name: string) => (row[indexOf(name)] ?? '').trim()
    const rawCell = (name: string) => row[indexOf(name)] ?? ''

    try {
      const date = cell('日期')
      if (!isValidISODate(date)) {
        throw new RowError(`「日期」必須是 YYYY-MM-DD，目前是「${date}」`)
      }
      if (seenDates.has(date)) {
        throw new RowError(`日期 ${date} 在檔案裡重複出現`)
      }
      seenDates.add(date)

      const primaryLabel = cell('主要照顧者')
      const primaryCaregiver = primaryLabel
        ? lookup<Caregiver>(CAREGIVER_BY_LABEL, primaryLabel, '主要照顧者')
        : undefined

      const activities = CARE_ACTIVITIES.flatMap((activity) => {
        const label = CARE_ACTIVITY_SHORT_LABELS[activity]
        const caregivers = splitMulti(cell(label)).map((item) =>
          lookup<Caregiver>(CAREGIVER_BY_LABEL, item, label),
        )
        return caregivers.length > 0 ? [{ activity: activity as CareActivity, caregivers }] : []
      })

      const childStatus = splitMulti(cell('孩子狀況')).map((item) =>
        lookup<ChildStatus>(CHILD_STATUS_BY_LABEL, item, '孩子狀況'),
      )

      const caregiverNotes: Partial<Record<Caregiver, string>> = {}
      CAREGIVERS.forEach((caregiver, index) => {
        const value = rawCell(CAREGIVER_NOTE_HEADERS[index] ?? '')
        if (value.trim().length > 0) caregiverNotes[caregiver] = value
      })

      const importantEvents = splitMulti(cell('重要事項')).map((item) =>
        lookup<ImportantEventTag>(IMPORTANT_TAG_BY_LABEL, item, '重要事項'),
      )

      const childStatusNote = rawCell('狀況補充')
      const importantNote = rawCell('重要事項說明')

      records.push({
        id: crypto.randomUUID(),
        childId,
        date,
        primaryCaregiver,
        activities,
        childStatus,
        ...(childStatusNote.trim().length > 0 ? { childStatusNote } : {}),
        caregiverNotes,
        importantEvents,
        ...(importantNote.trim().length > 0 ? { importantNote } : {}),
        expenses: parseExpenses(rawCell('費用明細')),
        createdAt: validTimestamp(cell('建立時間')) ?? nowISO(),
        updatedAt: validTimestamp(cell('最後修改')) ?? nowISO(),
        schemaVersion: SCHEMA_VERSION,
      })
    } catch (error) {
      const reason = error instanceof RowError ? error.message : '內容無法解析'
      return {
        ok: false,
        message: IMPORT_ERROR_MESSAGE,
        detail: `第 ${i + 1} 列：${reason}`,
      }
    }
  }

  return { ok: true, records }
}
