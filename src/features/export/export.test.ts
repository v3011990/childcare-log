import { describe, expect, it } from 'vitest'
import { CSV_HEADERS, buildCsv, recordToCsvRow } from '@/features/export/csv'
import { parseBackup, serializeBackup } from '@/features/export/json'
import { buildRecord, createEmptyDraft } from '@/features/records/record.utils'
import { DEFAULT_CHILD_ID, SCHEMA_VERSION } from '@/lib/constants'
import type { CareRecord } from '@/features/records/record.types'

function sampleRecord(): CareRecord {
  return buildRecord({
    ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21'),
    primaryCaregiver: 'mother',
    activities: [
      { activity: 'dropoff', caregiver: 'mother' },
      { activity: 'pickup', caregiver: 'grandmother' },
    ],
    childStatus: ['sick'],
    childStatusNote: '下午開始咳嗽',
    caregiverNotes: {
      father: '陪玩積木，之後帶去洗澡',
      grandmother: '下午接托',
    },
    importantEvents: ['doctor'],
    importantNote: '約晚上去診所，醫生說先觀察',
    expenses: [
      { id: 'e1', amount: 150, category: 'medical', payer: 'father', note: '掛號費' },
      { id: 'e2', amount: 200, category: 'medical', payer: 'mother', note: '藥費' },
    ],
  })
}

describe('CSV export', () => {
  const record = sampleRecord()
  const row = recordToCsvRow(record)
  const cell = (header: string) => row[CSV_HEADERS.indexOf(header)]

  it('包含 SPEC §15 要求的欄位', () => {
    for (const header of [
      '日期',
      '主要照顧者',
      '早晨準備',
      '送托',
      '接托',
      '吃飯',
      '陪玩',
      '洗澡',
      '哄睡',
      '夜間照顧',
      '孩子狀況',
      '爸爸照顧紀錄',
      '媽媽照顧紀錄',
      '重要事項',
      '費用',
      '付款人',
    ]) {
      expect(CSV_HEADERS).toContain(header)
    }
  })

  it('每個活動欄位填入實際執行者，沒做的留空', () => {
    expect(cell('送托')).toBe('媽媽')
    expect(cell('接托')).toBe('外婆')
    expect(cell('陪玩')).toBe('')
  })

  it('爸爸與媽媽的紀錄各自成欄，其他照顧者不會遺失', () => {
    expect(cell('爸爸照顧紀錄')).toBe('陪玩積木，之後帶去洗澡')
    expect(cell('媽媽照顧紀錄')).toBe('')
    expect(cell('其他照顧者紀錄')).toBe('外婆：下午接托')
  })

  it('費用加總、列出所有付款人，並保留每筆明細', () => {
    expect(cell('費用')).toBe('350')
    expect(cell('付款人')).toBe('媽媽、爸爸')
    expect(cell('費用明細')).toContain('掛號費')
    expect(cell('費用明細')).toContain('藥費')
  })

  it('原樣保留使用者寫的模糊時間描述', () => {
    expect(cell('重要事項')).toContain('約晚上去診所')
  })

  it('輸出的 CSV 有標題列，欄位以雙引號包起來並依日期排序', () => {
    const csv = buildCsv([
      record,
      buildRecord({
        ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-01'),
        primaryCaregiver: 'father',
      }),
    ])
    const lines = csv.split('\r\n')
    expect(lines[0]).toContain('"日期"')
    expect(lines[1]).toContain('"2026-09-01"')
    expect(lines[2]).toContain('"2026-09-21"')
  })

  it('內含雙引號的內容會被正確跳脫', () => {
    const tricky = buildRecord({
      ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-22'),
      importantEvents: ['other'],
      importantNote: '老師說 "今天午睡不錯"，逗號, 換行\n也在裡面',
    })
    const csv = buildCsv([tricky])
    expect(csv).toContain('""今天午睡不錯""')
    expect(csv.split('\r\n')[0]).toBe(CSV_HEADERS.map((header) => `"${header}"`).join(','))
  })
})

describe('JSON export / import', () => {
  const payload = { children: [], records: [sampleRecord()], settings: [] }

  it('匯出的內容含 metadata 且可以原樣讀回', () => {
    const json = serializeBackup(payload, '2026-09-21T10:00:00.000Z')
    const parsed = JSON.parse(json)
    expect(parsed.app).toBe('childcare-log')
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION)
    expect(parsed.exportedAt).toBe('2026-09-21T10:00:00.000Z')

    const result = parseBackup(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.records[0]?.importantNote).toBe('約晚上去診所，醫生說先觀察')
      expect(result.data.records[0]?.createdAt).toBe(payload.records[0]?.createdAt)
    }
  })

  it('壞掉的 JSON 不會 crash，回傳可讀的錯誤', () => {
    const result = parseBackup('{ 這不是 JSON')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('無法匯入此備份')
  })

  it('格式不符的備份會被擋下', () => {
    const result = parseBackup(JSON.stringify({ app: 'something-else', records: [] }))
    expect(result.ok).toBe(false)
  })

  it('可以讀入 SPEC 原始形狀的舊資料（單筆 expense、father/motherCareNote）', () => {
    const legacy = {
      app: 'childcare-log',
      schemaVersion: 1,
      exportedAt: '2026-09-01T00:00:00.000Z',
      children: [],
      records: [
        {
          id: 'r1',
          childId: DEFAULT_CHILD_ID,
          date: '2026-09-01',
          primaryCaregiver: 'mother',
          activities: [],
          childStatus: [],
          fatherCareNote: '晚上陪玩',
          motherCareNote: '白天照顧',
          expense: { amount: 100, category: 'daily', payer: 'mother' },
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
    }

    const result = parseBackup(JSON.stringify(legacy))
    expect(result.ok).toBe(true)
    if (result.ok) {
      const record = result.data.records[0]
      expect(record?.caregiverNotes).toEqual({ mother: '白天照顧', father: '晚上陪玩' })
      expect(record?.expenses).toHaveLength(1)
      expect(record?.expenses[0]?.amount).toBe(100)
    }
  })
})
