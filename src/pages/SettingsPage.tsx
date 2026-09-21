import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { useActiveChild } from '@/app/providers'
import { clearAllData, dumpAll, renameChild, replaceAll } from '@/db/repository'
import { ensureDefaultChild } from '@/db/database'
import { buildCsv, CSV_BOM, csvFileName } from '@/features/export/csv'
import { backupFileName, parseBackup, serializeBackup } from '@/features/export/json'
import { APP_NAME, PRIVACY_NOTICE } from '@/lib/constants'
import { downloadTextFile } from '@/lib/download'
import type { BackupFile } from '@/lib/validation'

export function SettingsPage() {
  const { childId, childName, refresh } = useActiveChild()
  const [name, setName] = useState(childName)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportJson = async () => {
    const data = await dumpAll()
    downloadTextFile(backupFileName(), serializeBackup(data), 'application/json')
    setMessage('已匯出 JSON 備份')
  }

  const exportCsv = async () => {
    const data = await dumpAll()
    downloadTextFile(csvFileName(), CSV_BOM + buildCsv(data.records), 'text/csv')
    setMessage('已匯出 CSV')
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    const result = parseBackup(await file.text())
    if (result.ok) {
      setImportError(null)
      setPendingImport(result.data)
    } else {
      setPendingImport(null)
      setImportError([result.message, result.detail].filter(Boolean).join('\n\n'))
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    await replaceAll({
      children: pendingImport.children,
      records: pendingImport.records,
      settings: pendingImport.settings ?? [],
    })
    await ensureDefaultChild()
    setPendingImport(null)
    refresh()
    setMessage(`已匯入 ${pendingImport.records.length} 天的紀錄`)
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

        <Card title="資料管理" hint="備份檔只會存到你自己的裝置，不會上傳到任何地方。">
          <div className="flex flex-col gap-2">
            <Button variant="secondary" fullWidth onClick={() => void exportJson()}>
              匯出 JSON
            </Button>
            <Button variant="secondary" fullWidth onClick={() => void exportCsv()}>
              匯出 CSV
            </Button>
            <Button variant="secondary" fullWidth onClick={() => fileInput.current?.click()}>
              匯入備份
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="選擇備份檔"
              onChange={(event) => void onPickFile(event.target.files?.[0])}
            />
            <Button variant="danger" fullWidth onClick={() => setConfirmingClear(true)}>
              清除所有資料
            </Button>
          </div>
          <p aria-live="polite" className="mt-3 min-h-5 text-[13px] text-muted">
            {message}
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
        title="匯入這份備份？"
        description={
          pendingImport
            ? `備份匯出時間：${pendingImport.exportedAt}\n包含 ${pendingImport.records.length} 天的紀錄。\n\n匯入會「取代」目前這台裝置上的所有紀錄，建議先匯出一份現在的備份。`
            : undefined
        }
        onClose={() => setPendingImport(null)}
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setPendingImport(null)}>
              取消
            </Button>
            <Button fullWidth onClick={() => void confirmImport()}>
              匯入並取代
            </Button>
          </>
        }
      />

      <Modal
        open={importError !== null}
        title="無法匯入此備份"
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
        description="這台裝置上的所有紀錄都會被永久刪除，無法復原。建議先匯出備份。"
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
