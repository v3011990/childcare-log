import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { useActiveChild } from '@/app/providers'
import { clearAllData, dumpAll, importRecords, renameChild } from '@/db/repository'
import { ensureDefaultChild } from '@/db/database'
import { CSV_BOM, buildCsv, csvFileName, parseCsvRecords } from '@/features/export/csv'
import { APP_NAME, PRIVACY_NOTICE } from '@/lib/constants'
import { downloadTextFile } from '@/lib/download'
import type { CareRecord } from '@/features/records/record.types'

export function SettingsPage() {
  const { childId, childName, refresh } = useActiveChild()
  const [name, setName] = useState(childName)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<CareRecord[] | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportCsv = async () => {
    const data = await dumpAll()
    if (data.records.length === 0) {
      setMessage('目前還沒有任何紀錄可以匯出')
      return
    }
    downloadTextFile(csvFileName(), CSV_BOM + buildCsv(data.records), 'text/csv')
    setMessage(`已匯出 ${data.records.length} 天的紀錄`)
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    const result = parseCsvRecords(await file.text(), childId)
    if (result.ok) {
      setImportError(null)
      setPendingImport(result.records)
    } else {
      setPendingImport(null)
      setImportError([result.message, result.detail].filter(Boolean).join('\n\n'))
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    const outcome = await importRecords(pendingImport)
    setPendingImport(null)
    setMessage(`已匯入：新增 ${outcome.created} 天、覆寫 ${outcome.updated} 天`)
  }

  const confirmClear = async () => {
    await clearAllData()
    const child = await ensureDefaultChild()
    setName(child.name)
    setConfirmingClear(false)
    refresh()
    setMessage('已清除所有資料')
  }

  const saveName = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await renameChild(childId, trimmed)
    refresh()
    setMessage('已更新孩子名稱')
  }

  return (
    <>
      <PageHeader title="設定" />

      <div className="flex flex-col gap-3 px-4 py-3">
        <Card title="孩子">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                id="child-name"
                label="名稱（只會顯示在這台裝置）"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={() => void saveName()}>
              儲存
            </Button>
          </div>
        </Card>

        <Card
          title="備份與還原"
          hint="備份格式是 CSV，可以直接用 Excel 或 Google 試算表打開，也可以再匯入回來。檔案只會存到你自己的裝置。"
        >
          <div className="flex flex-col gap-2">
            <Button variant="secondary" fullWidth onClick={() => void exportCsv()}>
              匯出 CSV
            </Button>
            <Button variant="secondary" fullWidth onClick={() => fileInput.current?.click()}>
              匯入 CSV
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="text/csv,.csv"
              className="sr-only"
              aria-label="選擇 CSV 檔"
              onChange={(event) => void onPickFile(event.target.files?.[0])}
            />
            <Button variant="danger" fullWidth onClick={() => setConfirmingClear(true)}>
              清除所有資料
            </Button>
          </div>
          <p aria-live="polite" className="mt-3 min-h-5 text-[13px] text-muted">
            {message}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-muted">
            匯入會以日期為準：檔案裡有的日期覆寫現有紀錄，檔案裡沒有的日期保留不動。要完整還原成某份備份，請先清除所有資料再匯入。孩子名稱不包含在
            CSV 裡。
          </p>
        </Card>

        <Card title="隱私">
          <p className="text-[14px] leading-6 text-muted">{PRIVACY_NOTICE}</p>
          <p className="mt-3 text-[14px] leading-6 text-muted">
            {APP_NAME} 不含任何分析、廣告或追蹤程式，也不會把紀錄傳送到第三方服務。
          </p>
        </Card>
      </div>

      <Modal
        open={pendingImport !== null}
        title="匯入這份 CSV？"
        description={
          pendingImport
            ? `檔案裡有 ${pendingImport.length} 天的紀錄。\n\n相同日期的現有紀錄會被檔案內容覆寫，其他日子不受影響。建議先匯出一份目前的備份。`
            : undefined
        }
        onClose={() => setPendingImport(null)}
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setPendingImport(null)}>
              取消
            </Button>
            <Button fullWidth onClick={() => void confirmImport()}>
              匯入
            </Button>
          </>
        }
      />

      <Modal
        open={importError !== null}
        title="無法匯入此檔案"
        description={importError ?? undefined}
        onClose={() => setImportError(null)}
        footer={
          <Button variant="secondary" fullWidth onClick={() => setImportError(null)}>
            我知道了
          </Button>
        }
      />

      <Modal
        open={confirmingClear}
        title="清除所有資料？"
        description="這台裝置上的所有紀錄都會被永久刪除，無法復原。建議先匯出 CSV 備份。"
        onClose={() => setConfirmingClear(false)}
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmingClear(false)}>
              取消
            </Button>
            <Button variant="danger" fullWidth onClick={() => void confirmClear()}>
              全部清除
            </Button>
          </>
        }
      />
    </>
  )
}
