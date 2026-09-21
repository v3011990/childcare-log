import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { CareDistribution } from '@/features/statistics/components/CareDistribution'
import { MonthlySummary } from '@/features/statistics/components/MonthlySummary'
import { computeMonthlyStatistics } from '@/features/statistics/statistics'
import { useActiveChild } from '@/app/providers'
import { listRecordsByMonth } from '@/db/repository'
import { CAREGIVER_LABELS } from '@/lib/constants'
import { currentMonthKey, formatMonthLabel, shiftMonth } from '@/lib/dates'

function MonthSwitcher({
  monthKey,
  onChange,
}: {
  monthKey: string
  onChange: (next: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <button
        type="button"
        aria-label="上一個月"
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        className="flex size-11 items-center justify-center rounded-xl border border-line bg-card text-muted active:bg-primary-soft"
      >
        ‹
      </button>
      <span className="text-[15px] font-semibold text-ink">{formatMonthLabel(monthKey)}</span>
      <button
        type="button"
        aria-label="下一個月"
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        className="flex size-11 items-center justify-center rounded-xl border border-line bg-card text-muted active:bg-primary-soft"
      >
        ›
      </button>
    </div>
  )
}

export function StatisticsPage() {
  const { childId } = useActiveChild()
  const [monthKey, setMonthKey] = useState(() => currentMonthKey())

  const records = useLiveQuery(() => listRecordsByMonth(childId, monthKey), [childId, monthKey])

  const statistics = useMemo(
    () => computeMonthlyStatistics(monthKey, records ?? []),
    [monthKey, records],
  )

  return (
    <>
      <PageHeader title="月統計" />
      <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />

      {records === undefined ? (
        <p className="px-4 py-10 text-center text-[14px] text-muted">載入中…</p>
      ) : (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <MonthlySummary statistics={statistics} />
          <CareDistribution statistics={statistics} />

          {statistics.expenseTotal > 0 && (
            <Card title={`費用（共 ${statistics.expenseTotal} 元）`}>
              <ul className="flex flex-col gap-2 text-[15px]">
                {statistics.expenseByPayer.map((item) => (
                  <li key={item.caregiver} className="flex justify-between gap-3">
                    <span className="text-ink">{CAREGIVER_LABELS[item.caregiver]}</span>
                    <span className="text-muted">{item.count} 元</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <p className="px-1 text-[12px] leading-5 text-muted">
            這裡只呈現實際填寫的次數，沒有紀錄的日子不會被推測或補值，也不提供任何評分或排名。
          </p>
        </div>
      )}
    </>
  )
}
