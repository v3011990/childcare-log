import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { QuickRecordForm } from '@/features/records/components/QuickRecordForm'
import { useRecordDraft } from '@/features/records/hooks/useTodayRecord'
import { useActiveChild } from '@/app/providers'
import { formatDateWithWeekday, todayISO } from '@/lib/dates'

export function TodayPage() {
  const { childId, ready } = useActiveChild()
  const date = useMemo(() => todayISO(), [])
  const { draft, status, update, saveNow } = useRecordDraft(childId, date)

  return (
    <>
      <PageHeader title="今日照顧" subtitle={formatDateWithWeekday(date)} />
      {ready && draft ? (
        <QuickRecordForm
          draft={draft}
          status={status}
          onChange={update}
          onSave={() => void saveNow()}
        />
      ) : (
        <p className="px-4 py-8 text-center text-[14px] text-muted">載入中…</p>
      )}
    </>
  )
}
