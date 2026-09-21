import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/layout/PageHeader'
import { DateFilter } from '@/features/history/components/DateFilter'
import { RecordList } from '@/features/history/components/RecordList'
import { useActiveChild } from '@/app/providers'
import { listRecords } from '@/db/repository'
import { formatMonthLabel, monthKeyOf } from '@/lib/dates'
import type { DateFilterValue, MonthGroup } from '@/features/history/history.types'

export function HistoryPage() {
  const { childId } = useActiveChild()
  const [filter, setFilter] = useState<DateFilterValue>({ kind: 'all' })

  const records = useLiveQuery(() => listRecords(childId), [childId])

  const months = useMemo(
    () => [...new Set((records ?? []).map((record) => monthKeyOf(record.date)))],
    [records],
  )

  const groups = useMemo<MonthGroup[]>(() => {
    const visible = (records ?? []).filter(
      (record) => filter.kind === 'all' || monthKeyOf(record.date) === filter.monthKey,
    )
    const byMonth = new Map<string, MonthGroup>()
    for (const record of visible) {
      const monthKey = monthKeyOf(record.date)
      const group = byMonth.get(monthKey)
      if (group) {
        group.records.push(record)
      } else {
        byMonth.set(monthKey, { monthKey, label: formatMonthLabel(monthKey), records: [record] })
      }
    }
    return [...byMonth.values()]
  }, [records, filter])

  return (
    <>
      <PageHeader title="歷史紀錄" subtitle={records ? `共 ${records.length} 天` : undefined} />
      {months.length > 0 && (
        <div className="px-4 pt-3">
          <DateFilter months={months} value={filter} onChange={setFilter} />
        </div>
      )}
      {records === undefined ? (
        <p className="px-4 py-10 text-center text-[14px] text-muted">載入中…</p>
      ) : (
        <RecordList groups={groups} />
      )}
    </>
  )
}
