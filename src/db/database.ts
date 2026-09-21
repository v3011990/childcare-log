import Dexie, { type EntityTable } from 'dexie'
import { DATABASE_NAME } from '@/db/schema'
import { applyMigrations } from '@/db/migrations'
import { DEFAULT_CHILD_ID, DEFAULT_CHILD_NAME } from '@/lib/constants'
import { nowISO } from '@/lib/dates'
import type { Child, SettingEntry } from '@/types/common'
import type { CareRecord } from '@/features/records/record.types'

export class ChildCareLogDatabase extends Dexie {
  records!: EntityTable<CareRecord, 'id'>
  children!: EntityTable<Child, 'id'>
  settings!: EntityTable<SettingEntry, 'key'>

  constructor(name: string = DATABASE_NAME) {
    super(name)
    applyMigrations(this)
  }
}

export const db = new ChildCareLogDatabase()

/**
 * 第一版只支援單一孩子，開啟 App 時確保有一筆預設的 child。
 * 已存在時不會覆寫使用者改過的名字。
 */
export async function ensureDefaultChild(database: ChildCareLogDatabase = db): Promise<Child> {
  const existing = await database.children.get(DEFAULT_CHILD_ID)
  if (existing) return existing

  const child: Child = {
    id: DEFAULT_CHILD_ID,
    name: DEFAULT_CHILD_NAME,
    createdAt: nowISO(),
  }
  await database.children.put(child)
  return child
}
