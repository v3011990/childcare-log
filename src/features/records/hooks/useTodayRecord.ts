import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getRecordByDate } from '@/db/repository'
import { useRecordMutation } from '@/features/records/hooks/useRecordMutation'
import { createEmptyDraft, toDraft } from '@/features/records/record.utils'
import type { CareRecordDraft } from '@/features/records/record.types'
import type { ISODateString } from '@/types/common'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/** 使用者停止輸入後多久自動存檔（SPEC §12）。 */
export const AUTOSAVE_DEBOUNCE_MS = 700

interface UseRecordDraftResult {
  draft: CareRecordDraft | null
  ready: boolean
  status: SaveStatus
  /** 修改草稿。傳入 updater 以避免連續輸入時互相覆寫。 */
  update: (updater: (draft: CareRecordDraft) => CareRecordDraft) => void
  /** 立即寫入（「儲存紀錄」按鈕用），會取消尚未觸發的 debounce。 */
  saveNow: () => Promise<void>
  /** 丟棄尚未寫入的內容（刪除紀錄前呼叫，避免離開頁面時又把它寫回去）。 */
  discardPending: () => void
}

/**
 * 某一天的紀錄草稿。
 *
 * 草稿直接以 (childId, date) upsert 進 `records`，不另外開 drafts 表：
 * 使用者切換頁面、被其他 App 打斷或關掉瀏覽器都不會掉資料，
 * 底部的「儲存紀錄」只是把還沒觸發的 debounce 立刻寫掉並給一個明確回饋。
 */
export function useRecordDraft(childId: string, date: ISODateString): UseRecordDraftResult {
  const { save } = useRecordMutation()
  const [draft, setDraft] = useState<CareRecordDraft | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')

  const key = `${childId}|${date}`
  const hydratedKey = useRef<string | null>(null)
  const pendingDraft = useRef<CareRecordDraft | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useLiveQuery(
    async () => ({ key: `${childId}|${date}`, record: await getRecordByDate(childId, date) }),
    [childId, date],
  )

  // 只在日期／孩子改變時載入一次，避免自己寫入觸發的更新把使用者正在打的字蓋掉。
  useEffect(() => {
    if (!query || query.key !== key || hydratedKey.current === key) return
    hydratedKey.current = key
    setDraft(query.record ? toDraft(query.record) : createEmptyDraft(childId, date))
    setStatus('idle')
  }, [query, key, childId, date])

  const flush = useCallback(async () => {
    const next = pendingDraft.current
    if (!next) return
    pendingDraft.current = null
    setStatus('saving')
    try {
      await save(next)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [save])

  const update = useCallback(
    (updater: (current: CareRecordDraft) => CareRecordDraft) => {
      setDraft((current) => {
        if (!current) return current
        const next = updater(current)
        pendingDraft.current = next
        setStatus('pending')
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          timer.current = null
          void flush()
        }, AUTOSAVE_DEBOUNCE_MS)
        return next
      })
    },
    [flush],
  )

  const saveNow = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (pendingDraft.current) {
      await flush()
    } else {
      setStatus('saved')
    }
  }, [flush])

  // 離開頁面前把還沒寫入的內容補存，避免切換分頁造成資料遺失。
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      if (pendingDraft.current) void flush()
    }
  }, [flush])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && pendingDraft.current) void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flush])

  const discardPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    pendingDraft.current = null
  }, [])

  return { draft, ready: draft !== null, status, update, saveNow, discardPending }
}
