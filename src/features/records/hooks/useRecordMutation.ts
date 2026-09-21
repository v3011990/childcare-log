import { useCallback } from 'react'
import { deleteRecord, saveRecordForDate } from '@/db/repository'
import type { CareRecord, CareRecordDraft } from '@/features/records/record.types'

/**
 * UI 唯一的寫入入口。所有元件都透過這裡動資料，不直接碰 Dexie（SPEC §7）。
 */
export function useRecordMutation() {
  const save = useCallback(
    (draft: CareRecordDraft): Promise<CareRecord | undefined> => saveRecordForDate(draft),
    [],
  )

  const remove = useCallback((id: string): Promise<void> => deleteRecord(id), [])

  return { save, remove }
}
