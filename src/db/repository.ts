import { db, type ChildCareLogDatabase } from '@/db/database'
import { monthRange } from '@/lib/dates'
import { careRecordSchema, legacyCareRecordSchema } from '@/lib/validation'
import { buildRecord, isDraftEmpty, normalizeDraft } from '@/features/records/record.utils'
import type { Child, ISODateString, SettingEntry } from '@/types/common'
import type { CareRecord, CareRecordDraft } from '@/features/records/record.types'

/**
 * 唯一可以直接操作 IndexedDB 的地方（SPEC §7）。
 * UI 元件一律透過 hooks 呼叫這裡的函式，不可自行開 Dexie。
 */

export type Database = ChildCareLogDatabase

/**
 * 讀出來的資料一律先驗證，格式不符的資料不會悄悄污染 domain model。
 *
 * 這裡用相容版 schema：即使 Dexie 的版本升級因故沒跑到，
 * 舊格式（單一 caregiver）的紀錄仍然讀得出來，不會憑空消失。
 */
function parseStored(record: CareRecord | undefined): CareRecord | undefined {
  if (!record) return undefined
  const result = legacyCareRecordSchema.safeParse(record)
  return result.success ? result.data : undefined
}

export async function getRecordById(
  id: string,
  database: Database = db,
): Promise<CareRecord | undefined> {
  return parseStored(await database.records.get(id))
}

export async function getRecordByDate(
  childId: string,
  date: ISODateString,
  database: Database = db,
): Promise<CareRecord | undefined> {
  return parseStored(await database.records.where('[childId+date]').equals([childId, date]).first())
}

/** 依日期新到舊列出全部紀錄。 */
export async function listRecords(childId: string, database: Database = db): Promise<CareRecord[]> {
  const rows = await database.records.where('childId').equals(childId).toArray()
  return rows
    .map((row) => parseStored(row))
    .filter((row): row is CareRecord => row !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function listRecordsByMonth(
  childId: string,
  monthKey: string,
  database: Database = db,
): Promise<CareRecord[]> {
  const { start, end } = monthRange(monthKey)
  const rows = await database.records
    .where('[childId+date]')
    .between([childId, start], [childId, end], true, false)
    .toArray()
  return rows
    .map((row) => parseStored(row))
    .filter((row): row is CareRecord => row !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * 以 (childId, date) 為鍵寫入當日紀錄。
 *
 * - 既有紀錄保留原本的 `id` 與 `createdAt`，只更新 `updatedAt`（SPEC §16.2、§16.3）。
 * - 內容完全清空時刪除該筆，避免歷史出現空白紀錄。
 */
export async function saveRecordForDate(
  draft: CareRecordDraft,
  database: Database = db,
): Promise<CareRecord | undefined> {
  const normalized = normalizeDraft(draft)

  return database.transaction('rw', database.records, async () => {
    const existing = await database.records
      .where('[childId+date]')
      .equals([normalized.childId, normalized.date])
      .first()

    if (isDraftEmpty(normalized)) {
      if (existing) await database.records.delete(existing.id)
      return undefined
    }

    const record = buildRecord(normalized, existing)
    careRecordSchema.parse(record)
    await database.records.put(record)
    return record
  })
}

export async function deleteRecord(id: string, database: Database = db): Promise<void> {
  await database.records.delete(id)
}

export async function listChildren(database: Database = db): Promise<Child[]> {
  return database.children.toArray()
}

export async function renameChild(
  id: string,
  name: string,
  database: Database = db,
): Promise<void> {
  await database.children.update(id, { name })
}

export async function getSetting<T>(key: string, database: Database = db): Promise<T | undefined> {
  const entry = await database.settings.get(key)
  return entry?.value as T | undefined
}

export async function setSetting(
  key: string,
  value: unknown,
  database: Database = db,
): Promise<void> {
  await database.settings.put({ key, value })
}

export async function listSettings(database: Database = db): Promise<SettingEntry[]> {
  return database.settings.toArray()
}

/** 匯出用：一次取出所有資料表的原始內容。 */
export async function dumpAll(database: Database = db): Promise<{
  children: Child[]
  records: CareRecord[]
  settings: SettingEntry[]
}> {
  const [children, records, settings] = await Promise.all([
    database.children.toArray(),
    database.records.toArray(),
    database.settings.toArray(),
  ])
  return {
    children,
    records: records.sort((a, b) => a.date.localeCompare(b.date)),
    settings,
  }
}

/** 匯入備份：以整包取代現有資料，在同一個 transaction 內完成。 */
export async function replaceAll(
  payload: { children: Child[]; records: CareRecord[]; settings?: SettingEntry[] },
  database: Database = db,
): Promise<void> {
  await database.transaction(
    'rw',
    database.records,
    database.children,
    database.settings,
    async () => {
      await Promise.all([
        database.records.clear(),
        database.children.clear(),
        database.settings.clear(),
      ])
      await database.children.bulkPut(payload.children)
      await database.records.bulkPut(payload.records)
      if (payload.settings?.length) await database.settings.bulkPut(payload.settings)
    },
  )
}

export async function clearAllData(database: Database = db): Promise<void> {
  await database.transaction(
    'rw',
    database.records,
    database.children,
    database.settings,
    async () => {
      await Promise.all([
        database.records.clear(),
        database.children.clear(),
        database.settings.clear(),
      ])
    },
  )
}
