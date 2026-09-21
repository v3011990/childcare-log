import { z } from 'zod'
import {
  CARE_ACTIVITIES,
  CAREGIVERS,
  CHILD_STATUSES,
  EXPENSE_CATEGORIES,
  IMPORTANT_EVENT_TAGS,
  SCHEMA_VERSION,
} from '@/lib/constants'
import { isValidISODate } from '@/lib/dates'
import type { CareRecord } from '@/features/records/record.types'

/**
 * 所有從 IndexedDB、JSON 匯入或表單進入 domain model 的資料
 * 都必須通過這裡的驗證（SPEC §21）。
 */

const enumOf = <T extends string>(values: readonly T[]) => z.enum(values as [T, ...T[]])

export const caregiverSchema = enumOf(CAREGIVERS)
export const careActivitySchema = enumOf(CARE_ACTIVITIES)
export const childStatusSchema = enumOf(CHILD_STATUSES)
export const expenseCategorySchema = enumOf(EXPENSE_CATEGORIES)
export const importantEventTagSchema = enumOf(IMPORTANT_EVENT_TAGS)

export const isoDateSchema = z.string().refine(isValidISODate, {
  message: '日期格式必須是 YYYY-MM-DD',
})

export const careActivityRecordSchema = z.object({
  activity: careActivitySchema,
  caregivers: z.array(caregiverSchema).min(1),
})

/**
 * 相容讀取活動：v1 只有單一 `caregiver`，v2 起是 `caregivers` 陣列。
 * 舊資料一律轉成陣列，不丟失任何已記錄的照顧者。
 */
export const anyCareActivityRecordSchema = z.union([
  careActivityRecordSchema,
  z
    .object({ activity: careActivitySchema, caregiver: caregiverSchema })
    .transform((raw) => ({ activity: raw.activity, caregivers: [raw.caregiver] })),
])

export const expenseSchema = z.object({
  id: z.string().min(1),
  amount: z.number().finite().min(0),
  category: expenseCategorySchema,
  payer: caregiverSchema,
  note: z.string().optional(),
})

export const caregiverNotesSchema = z.partialRecord(caregiverSchema, z.string())

export const careRecordSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  date: isoDateSchema,
  primaryCaregiver: caregiverSchema.optional(),
  activities: z.array(careActivityRecordSchema),
  childStatus: z.array(childStatusSchema),
  childStatusNote: z.string().optional(),
  caregiverNotes: caregiverNotesSchema,
  importantEvents: z.array(importantEventTagSchema),
  importantNote: z.string().optional(),
  expenses: z.array(expenseSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  schemaVersion: z.number().int().min(1),
})

export const childSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
})

export const settingEntrySchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

/**
 * 相容讀取：接受 SPEC §6 原始形狀（單筆 expense、father/motherCareNote）
 * 與 schema v1 的活動形狀（單一 caregiver），轉換成目前的 domain model。
 * 只做欄位搬移，不補寫任何不存在的資料（SPEC §16）。
 *
 * 同時用於讀取 IndexedDB 既有資料與匯入備份，確保舊紀錄不會因為格式改變而消失。
 */
export const legacyCareRecordSchema = z
  .object({
    id: z.string().min(1),
    childId: z.string().min(1),
    date: isoDateSchema,
    primaryCaregiver: caregiverSchema.optional(),
    activities: z.array(anyCareActivityRecordSchema).optional(),
    childStatus: z.array(childStatusSchema).optional(),
    childStatusNote: z.string().optional(),
    fatherCareNote: z.string().optional(),
    motherCareNote: z.string().optional(),
    caregiverNotes: caregiverNotesSchema.optional(),
    importantEvents: z.array(importantEventTagSchema).optional(),
    importantNote: z.string().optional(),
    expense: expenseSchema.partial({ id: true }).optional(),
    expenses: z.array(expenseSchema).optional(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    schemaVersion: z.number().int().min(1).optional(),
  })
  .transform((raw): CareRecord => {
    const caregiverNotes = { ...(raw.caregiverNotes ?? {}) }
    if (raw.motherCareNote) caregiverNotes.mother = raw.motherCareNote
    if (raw.fatherCareNote) caregiverNotes.father = raw.fatherCareNote

    const expenses = raw.expenses ? [...raw.expenses] : []
    if (raw.expense) {
      expenses.push({ ...raw.expense, id: raw.expense.id ?? `${raw.id}-expense-1` })
    }

    return {
      id: raw.id,
      childId: raw.childId,
      date: raw.date,
      primaryCaregiver: raw.primaryCaregiver,
      activities: raw.activities ?? [],
      childStatus: raw.childStatus ?? [],
      childStatusNote: raw.childStatusNote,
      caregiverNotes,
      importantEvents: raw.importantEvents ?? [],
      importantNote: raw.importantNote,
      expenses,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      // 轉換後的形狀就是目前版本，所以一律標記成目前的 schemaVersion。
      schemaVersion: SCHEMA_VERSION,
    }
  })

export const backupFileSchema = z.object({
  app: z.literal('childcare-log'),
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  exportedAt: z.string().min(1),
  children: z.array(childSchema),
  records: z.array(legacyCareRecordSchema),
  settings: z.array(settingEntrySchema).optional(),
})

export type BackupFile = z.infer<typeof backupFileSchema>

export const IMPORT_ERROR_MESSAGE = '無法匯入此備份\n\n資料格式可能不完整或版本不相容。'
