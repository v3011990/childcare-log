import { SCHEMA_VERSION } from '@/lib/constants'
import { IMPORT_ERROR_MESSAGE, backupFileSchema, type BackupFile } from '@/lib/validation'
import type { Child, SettingEntry } from '@/types/common'
import type { CareRecord } from '@/features/records/record.types'

export interface BackupInput {
  children: Child[]
  records: CareRecord[]
  settings: SettingEntry[]
}

/** 匯出的 JSON 保留完整資料與 metadata（SPEC §15、§16.4）。 */
export function buildBackup(input: BackupInput, exportedAt: string = new Date().toISOString()) {
  return {
    app: 'childcare-log' as const,
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    children: input.children,
    records: input.records,
    settings: input.settings,
  }
}

export function serializeBackup(input: BackupInput, exportedAt?: string): string {
  return JSON.stringify(buildBackup(input, exportedAt), null, 2)
}

export type ParseResult =
  { ok: true; data: BackupFile } | { ok: false; message: string; detail?: string }

/**
 * 解析備份檔。格式不符時回傳訊息，絕對不讓 App crash（SPEC §21）。
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, message: IMPORT_ERROR_MESSAGE, detail: '檔案不是有效的 JSON。' }
  }

  const result = backupFileSchema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    return {
      ok: false,
      message: IMPORT_ERROR_MESSAGE,
      detail: first ? `${first.path.join('.') || '檔案'}：${first.message}` : undefined,
    }
  }

  return { ok: true, data: result.data }
}

export function backupFileName(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10)
  return `育兒紀錄備份-${stamp}.json`
}
