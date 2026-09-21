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
import { DEFAULT_CHILD_ID } from '@/lib/constants'

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
    draft.activities = [{ activity: 'dropoff', caregiver: 'mother' }]

    const saved = await saveRecordForDate(draft, database)

    expect(saved).toBeDefined()
    expect(saved?.primaryCaregiver).toBe('mother')
    expect(saved?.activities).toHaveLength(1)
    expect(saved?.createdAt).toBeTruthy()
    expect(saved?.schemaVersion).toBe(1)
  })

  it('同一天重複儲存只會有一筆，並保留 createdAt、更新 updatedAt', async () => {
    const draft = createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21')
    draft.primaryCaregiver = 'mother'
    const first = await saveRecordForDate(draft, database)

    await new Promise((resolve) => setTimeout(resolve, 5))

    draft.activities = [{ activity: 'bath', caregiver: 'father' }]
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

  it('ensureDefaultChild 不會覆寫已改過的名字', async () => {
    const first = await ensureDefaultChild(database)
    await database.children.update(first.id, { name: '小花' })
    const second = await ensureDefaultChild(database)
    expect(second.name).toBe('小花')
  })
})
