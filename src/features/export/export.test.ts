import { describe, expect, it } from 'vitest'
import {
  CSV_BOM,
  CSV_HEADERS,
  buildCsv,
  parseCsvRecords,
  parseCsvText,
  recordToCsvRow,
} from '@/features/export/csv'
import { buildRecord, createEmptyDraft } from '@/features/records/record.utils'
import { DEFAULT_CHILD_ID, SCHEMA_VERSION } from '@/lib/constants'
import type { CareRecord } from '@/features/records/record.types'

function sampleRecord(): CareRecord {
  return buildRecord({
    ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-21'),
    primaryCaregiver: 'mother',
    activities: [
      { activity: 'dropoff', caregivers: ['mother'] },
      { activity: 'pickup', caregivers: ['grandmother', 'father'] },
      { activity: 'bottle', caregivers: ['mother', 'father', 'grandmother'] },
    ],
    childStatus: ['sick', 'emotional'],
    childStatusNote: '下午開始咳嗽\n晚上比較黏人',
    caregiverNotes: {
      father: '陪玩積木，之後帶去洗澡',
      grandmother: '下午接托',
    },
    importantEvents: ['doctor', 'other'],
    importantNote: '約晚上去診所，醫生說先觀察',
    expenses: [
      { id: 'e1', amount: 150, category: 'medical', payer: 'father', note: '掛號費' },
      { id: 'e2', amount: 200, category: 'medical', payer: 'mother', note: '藥費 | 三天份' },
    ],
  })
}

describe('CSV 匯出', () => {
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
      '泡奶',
      '副食品',
      '換尿布',
      '餵藥',
      '外出',
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

  it('每個活動欄位填入實際參與者，沒做的留空', () => {
    expect(cell('送托')).toBe('媽媽')
    // 多人協助時並列，順序依固定的照顧者順序而非輸入順序
    expect(cell('接托')).toBe('爸爸、外婆')
    expect(cell('陪玩')).toBe('')
  })

  it('每位照顧者的紀錄各自成欄，不會互相覆蓋', () => {
    expect(cell('爸爸照顧紀錄')).toBe('陪玩積木，之後帶去洗澡')
    expect(cell('媽媽照顧紀錄')).toBe('')
    expect(cell('外婆照顧紀錄')).toBe('下午接托')
  })

  it('重要事項的標籤與說明分開成兩欄', () => {
    expect(cell('重要事項')).toBe('看醫生、其他')
    expect(cell('重要事項說明')).toBe('約晚上去診所，醫生說先觀察')
  })

  it('費用有合計、付款人與逐筆明細', () => {
    expect(cell('費用')).toBe('350')
    expect(cell('付款人')).toBe('媽媽、爸爸')
    expect(cell('費用明細')).toBe('醫療|150|爸爸|掛號費\n醫療|200|媽媽|藥費 | 三天份')
  })

  it('輸出的 CSV 有標題列，欄位以雙引號包起來並依日期排序', () => {
    const csv = buildCsv([
      record,
      buildRecord({
        ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-01'),
        primaryCaregiver: 'father',
      }),
    ])
    const rows = parseCsvText(csv)
    expect(rows[0]).toEqual(CSV_HEADERS)
    expect(rows[1]?.[0]).toBe('2026-09-01')
    expect(rows[2]?.[0]).toBe('2026-09-21')
  })

  it('內含雙引號與換行的內容會被正確跳脫', () => {
    const tricky = buildRecord({
      ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-22'),
      importantEvents: ['other'],
      importantNote: '老師說 "今天午睡不錯"，逗號, 換行\n也在裡面',
    })
    const csv = buildCsv([tricky])
    expect(csv).toContain('""今天午睡不錯""')
    const rows = parseCsvText(csv)
    expect(rows[1]?.[CSV_HEADERS.indexOf('重要事項說明')]).toBe(
      '老師說 "今天午睡不錯"，逗號, 換行\n也在裡面',
    )
  })
})

describe('CSV 匯入', () => {
  it('匯出後再匯入，內容完全一致（round trip）', () => {
    const original = sampleRecord()
    const csv = CSV_BOM + buildCsv([original])

    const result = parseCsvRecords(csv, DEFAULT_CHILD_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const restored = result.records[0]
    expect(restored?.date).toBe(original.date)
    expect(restored?.primaryCaregiver).toBe('mother')
    expect(restored?.activities).toEqual(original.activities)
    expect(restored?.childStatus).toEqual(original.childStatus)
    expect(restored?.childStatusNote).toBe(original.childStatusNote)
    expect(restored?.caregiverNotes).toEqual(original.caregiverNotes)
    expect(restored?.importantEvents).toEqual(original.importantEvents)
    expect(restored?.importantNote).toBe(original.importantNote)
    expect(restored?.createdAt).toBe(original.createdAt)
    expect(restored?.updatedAt).toBe(original.updatedAt)
    expect(restored?.schemaVersion).toBe(SCHEMA_VERSION)

    // 費用的 id 是內部識別碼，不進 CSV，其餘欄位必須一致
    expect(restored?.expenses.map(({ id: _id, ...rest }) => rest)).toEqual(
      original.expenses.map(({ id: _id, ...rest }) => rest),
    )
  })

  it('備註裡有直線也能正確還原', () => {
    const result = parseCsvRecords(CSV_BOM + buildCsv([sampleRecord()]), DEFAULT_CHILD_ID)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.records[0]?.expenses[1]?.note).toBe('藥費 | 三天份')
    }
  })

  it('空白的一天也能來回一次不掉東西', () => {
    const minimal = buildRecord({
      ...createEmptyDraft(DEFAULT_CHILD_ID, '2026-09-05'),
      primaryCaregiver: 'grandmother',
    })
    const result = parseCsvRecords(buildCsv([minimal]), DEFAULT_CHILD_ID)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.records[0]?.primaryCaregiver).toBe('grandmother')
      expect(result.records[0]?.activities).toEqual([])
      expect(result.records[0]?.expenses).toEqual([])
      expect(result.records[0]?.childStatusNote).toBeUndefined()
    }
  })

  it('缺少欄位時回報缺哪些，不會 crash', () => {
    const result = parseCsvRecords('"日期","主要照顧者"\r\n"2026-09-01","媽媽"', DEFAULT_CHILD_ID)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('無法匯入此檔案')
      expect(result.detail).toContain('缺少欄位')
    }
  })

  it('無法辨識的照顧者會指出是第幾列、哪一欄，整份都不匯入', () => {
    const csv = buildCsv([sampleRecord()]).replace('"媽媽"', '"叔叔"')
    const result = parseCsvRecords(csv, DEFAULT_CHILD_ID)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.detail).toContain('第 2 列')
      expect(result.detail).toContain('叔叔')
    }
  })

  it('日期格式錯誤會被擋下', () => {
    const csv = buildCsv([sampleRecord()]).replace('"2026-09-21"', '"2026/09/21"')
    const result = parseCsvRecords(csv, DEFAULT_CHILD_ID)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.detail).toContain('YYYY-MM-DD')
  })

  it('同一份檔案裡日期重複會被擋下', () => {
    const csv = buildCsv([sampleRecord()])
    const rows = csv.split('\r\n')
    const duplicated = [...rows, rows[1] ?? ''].join('\r\n')
    const result = parseCsvRecords(duplicated, DEFAULT_CHILD_ID)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.detail).toContain('重複')
  })

  it('不是 CSV 的檔案不會 crash', () => {
    const result = parseCsvRecords('這不是一份 CSV', DEFAULT_CHILD_ID)
    expect(result.ok).toBe(false)
  })
})
