import type { Dexie } from 'dexie'
import { STORES_V1 } from '@/db/schema'
import { SCHEMA_VERSION } from '@/lib/constants'

interface LegacyActivityRow {
  activity?: unknown
  caregiver?: unknown
  caregivers?: unknown
}

/**
 * 所有 schema 版本集中在這裡宣告。
 * 新增版本時只能往後追加，不可修改既有版本的定義，
 * 否則既有使用者裝置上的資料會無法開啟（SPEC §16）。
 */
export function applyMigrations(db: Dexie): void {
  db.version(1).stores(STORES_V1)

  // v2：活動的照顧者由單一 `caregiver` 改為 `caregivers` 陣列。
  // 只把既有值搬進陣列，不新增也不刪除任何照顧者。
  db.version(2)
    .stores(STORES_V1)
    .upgrade(async (tx) => {
      await tx
        .table('records')
        .toCollection()
        .modify((record: { activities?: LegacyActivityRow[]; schemaVersion?: number }) => {
          if (Array.isArray(record.activities)) {
            record.activities = record.activities.map((item) => {
              if (item && !Array.isArray(item.caregivers) && item.caregiver !== undefined) {
                return { activity: item.activity, caregivers: [item.caregiver] }
              }
              return item
            })
          }
          record.schemaVersion = SCHEMA_VERSION
        })
    })
}
