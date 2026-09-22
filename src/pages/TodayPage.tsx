import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DateSwitcher } from '@/features/records/components/DateSwitcher'
import { QuickRecordForm } from '@/features/records/components/QuickRecordForm'
import { useRecordDraft } from '@/features/records/hooks/useTodayRecord'
import { useActiveChild } from '@/app/providers'
import { formatDateWithWeekday, todayISO } from '@/lib/dates'

export function TodayPage() {
  const { childId, ready } = useActiveChild()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const isToday = date === today

  const { draft, status, update, saveNow } = useRecordDraft(childId, date)

  return (
    <>
      <PageHeader
        title={isToday ? '今日照顧' : '補記紀錄'}
        subtitle={formatDateWithWeekday(date)}
      />
      <DateSwitcher date={date} today={today} onChange={setDate} />
      {ready && draft ? (
        <QuickRecordForm
          draft={draft}
          status={status}
          onChange={update}
          onSave={() => void saveNow()}
          saveLabel={isToday ? '儲存紀錄' : '儲存補記'}
          dayWord={isToday ? '今天' : '這天'}
        />
      ) : (
        <p className="px-4 py-8 text-center text-[14px] text-muted">載入中…</p>
      )}
    </>
  )
}
