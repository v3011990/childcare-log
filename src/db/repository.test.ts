import { beforeEach, describe, expect, it } from 'vitest'
import { ChildCareLogDatabase, ensureDefaultChild } from '@/db/database'
import {
  deleteRecord,
  getRecordByDate,
  listRecords,
  listRecordsByMonth,
  saveRecordForDate,
} from '@/db/repository'
import { createEmptyDraft } from '@/features/records/record.utils'
import { DEFAULT_CHILD_ID, SCHEMA_VERSION } from '@/lib/constants'
import { STORES_V1 } from '@/db/schema'
import Dexie from 'dexie'

let database: ChildCareLogDatabase
let dbSeq = 0

beforeEach(async () => {
  dbSeq += 1
  database = new ChildCareLogDatabase(`ChildCareLogTest-${dbSeq}`)
  await database.open()
})

describe('repository', () => {
  it('建立當日紀錄', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'mother'
    draft.activities = [{ activity: 'dropoff', caregivers: ['mother'] }]

    const saved = await saveRecordForDate(draft, database)

    expect(saved).toBeDefined()
    expect(saved?.primaryCaregiver).toBe('mother')
    expect(saved?.activities).toHaveLength(1)
    expect(saved?.createdAt).toBeTruthy()
    expect(saved?.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('同一天重複儲存只會有一筆，並保留 createdAt、更新 updatedAt', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'mother'
    const first = await saveRecordForDate(draft, database)

    await new Promise((resolve) => setTimeout(resolve, 5))

    draft.activities = [{ activity: 'bath', caregivers: ['father'] }]
    const second = await saveRecordForDate(draft, database)

    const all = await listRecords(DEFAULT_CHILD_ID, database)
    expect(all).toHaveLength(1)
    expect(second?.id).toBe(first?.id)
    expect(second?.createdAt).toBe(first?.createdAt)
    expect(second?.updatedAt).not.toBe(first?.updatedAt)
  })

  it('內容清空時不會留下空白紀錄', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'mother'
    await saveRecordForDate(draft, database)

    const cleared = await saveRecordForDate(
      createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21'),
      database,
    )

    expect(cleared).toBeUndefined()
    expect(await getRecordByDate(DEFAULT_CHILD_ID, '2026-09-21', database)).toBeUndefined()
  })

  it('只有空白字元的文字不會被當成內容', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-22')
    draft.importantNote = '   '
    expect(await saveRecordForDate(draft, database)).toBeUndefined()
  })

  it('依日期查詢與月份查詢', async () => {
    for (const date of ['2026-08-31', '2026-09-01', '2026-09-20', '2026-10-01']) {
      const draft = createEmptyDraft(DEFAULT_CHILD_ID, date)
      draft.primaryCaregiver = 'mother'
      await saveRecordForDate(draft, database)
    }

    const september = await listRecordsByMonth(DEFAULT_CHILD_ID, '2026-09', database)
    expect(september.map((record) => record.date)).toEqual(['2026-09-20', '2026-09-01'])

    const one = await getRecordByDate(DEFAULT_CHILD_ID, '2026-08-31', database)
    expect(one?.date).toBe('2026-08-31')
  })

  it('刪除紀錄', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'father'
    const saved = await saveRecordForDate(draft, database)

    await deleteRecord(saved!.id, database)
    expect(await listRecords(DEFAULT_CHILD_ID, database)).toHaveLength(0)
  })

  it('同一項活動可以記多位照顧者，順序固定', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'mother'
    // 刻意用非畫面順序輸入，確認儲存時會正規化
    draft.activities = [{ activity: 'bottle', caregivers: ['grandmother', 'mother'] }]

    const saved = await saveRecordForDate(draft, database)

    expect(saved?.activities).toEqual([
      { activity: 'bottle', caregivers: ['mother', 'grandmother'] },
    ])
  })

  it('活動的照顧者全被移除時，該活動不會留下', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'mother'
    draft.activities = [{ activity: 'medicine', caregivers: [] }]

    const saved = await saveRecordForDate(draft, database)

    expect(saved?.activities).toEqual([])
  })

  it('ensureDefaultChild 不會覆寫已改過的名字', async () => {
    const first = await ensureDefaultChild(database)
    await database.children.update(first.id, { name: '小花' })
    const second = await ensureDefaultChild(database)
    expect(second.name).toBe('小花')
  })
})

describe('schema v1 → v2 遷移', () => {
  it('舊的單一 caregiver 會轉成陣列，且不遺失任何紀錄', async () => {
    const name = `ChildCareLogMigration-${Date.now()}`

    // 先用 v1 的 schema 寫入一筆舊格式紀錄
    const old = new Dexie(name)
    old.version(1).stores(STORES_V1)
    await old.open()
    await old.table('records').put({
      id: 'legacy-1',
      childId: DEFAULT_CHILD_ID,
      date: '2026-09-01',
      primaryCaregiver: 'mother',
      activities: [
        { activity: 'pickup', caregiver: 'grandmother' },
        { activity: 'bath', caregiver: 'father' },
      ],
      childStatus: ['normal'],
      caregiverNotes: { father: '晚上洗澡' },
      importantEvents: [],
      expenses: [],
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
      schemaVersion: 1,
    })
    old.close()

    // 再用目前版本開啟，Dexie 會執行 v2 的 upgrade
    const upgraded = new ChildCareLogDatabase(name)
    await upgraded.open()

    const record = await upgraded.records.get('legacy-1')
    expect(record?.activities).toEqual([
      { activity: 'pickup', caregivers: ['grandmother'] },
      { activity: 'bath', caregivers: ['father'] },
    ])
    expect(record?.schemaVersion).toBe(SCHEMA_VERSION)
    // 其他欄位原樣保留，createdAt 沒有被改寫
    expect(record?.createdAt).toBe('2026-09-01T10:00:00.000Z')
    expect(record?.caregiverNotes).toEqual({ father: '晚上洗澡' })

    // 經過 repository 讀出來也是新格式
    const viaRepository = await getRecordByDate(DEFAULT_CHILD_ID, '2026-09-01', upgraded)
    expect(viaRepository?.activities[0]?.caregivers).toEqual(['grandmother'])
    upgraded.close()
  })
})
