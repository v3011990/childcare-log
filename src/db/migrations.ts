import type { Dexie } from 'dexie'
import { STORES_V1 } from '@/db/schema'

/**
 * 所有 schema 版本集中在這裡宣告。
 * 新增版本時只能往後追加，不可修改既有版本的定義，
 * 否則既有使用者裝置上的資料會無法開啟（SPEC §16）。
 */
export function applyMigrations(db: Dexie): void {
  db.version(1).stores(STORES_V1)
}
