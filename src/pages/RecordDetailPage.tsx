import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecordDetail } from '@/features/history/components/RecordDetail'
import { QuickRecordForm } from '@/features/records/components/QuickRecordForm'
import { useRecordDraft } from '@/features/records/hooks/useTodayRecord'
import { useRecordMutation } from '@/features/records/hooks/useRecordMutation'
import { useActiveChild } from '@/app/providers'
import { getRecordById } from '@/db/repository'
import { formatShortDate } from '@/lib/dates'

function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label="回到歷史紀錄"
      onClick={() => navigate('/history')}
      className="-ml-2 flex size-11 items-center justify-center rounded-xl text-muted active:bg-primary-soft"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function RecordDetailPage() {
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()
  const { childId } = useActiveChild()
  const { remove } = useRecordMutation()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const query = useLiveQuery(
    async () => ({ record: recordId ? await getRecordById(recordId) : undefined }),
    [recordId],
  )
  const record = query?.record

  const { draft, status, update, saveNow, discardPending } = useRecordDraft(
    childId,
    record?.date ?? '',
  )

  if (!query) {
    return (
      <>
        <PageHeader title="紀錄" back={<BackButton />} />
        <p className="px-4 py-10 text-center text-[14px] text-muted">載入中…</p>
      </>
    )
  }

  if (!record) {
    return (
      <>
        <PageHeader title="紀錄" back={<BackButton />} />
        <p className="px-4 py-10 text-center text-[14px] text-muted">找不到這筆紀錄。</p>
      </>
    )
  }

  const onDelete = async () => {
    discardPending()
    await remove(record.id)
    setConfirmingDelete(false)
    navigate('/history', { replace: true })
  }

  return (
    <>
      <PageHeader
        title={formatShortDate(record.date)}
        back={<BackButton />}
        action={
          <Button variant="ghost" onClick={() => setEditing((value) => !value)}>
            {editing ? '完成' : '編輯'}
          </Button>
        }
      />

      {editing && draft ? (
        <QuickRecordForm
          draft={draft}
          status={status}
          onChange={update}
          onSave={() => void saveNow()}
          saveLabel="儲存修改"
        />
      ) : (
        <RecordDetail record={record} />
      )}

      <div className="px-4 pb-6">
        <Button variant="danger" fullWidth onClick={() => setConfirmingDelete(true)}>
          刪除這筆紀錄
        </Button>
      </div>

      <Modal
        open={confirmingDelete}
        title="刪除這筆紀錄？"
        description={`${formatShortDate(record.date)} 的紀錄會被永久刪除，無法復原。`}
        onClose={() => setConfirmingDelete(false)}
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirmingDelete(false)}>
              取消
            </Button>
            <Button variant="danger" fullWidth onClick={() => void onDelete()}>
              刪除
            </Button>
          </>
        }
      />
    </>
  )
}
