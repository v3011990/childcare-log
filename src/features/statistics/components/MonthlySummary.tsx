import { Card } from '@/components/ui/Card'
import { CAREGIVER_LABELS } from '@/lib/constants'
import type { MonthlyStatistics } from '@/features/statistics/statistics'

/** 條狀長度只反映次數多寡，不代表好壞，也不做排名（SPEC §14）。 */
function CountRow({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0
  return (
    <li className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-[14px] text-ink">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </span>
      <span className="w-12 shrink-0 text-right text-[13px] text-muted">{count} 天</span>
    </li>
  )
}

export function MonthlySummary({ statistics }: { statistics: MonthlyStatistics }) {
  const max = Math.max(1, ...statistics.primaryCaregiverDays.map((item) => item.count))

  return (
    <Card title="主要照顧者" hint={`這個月共有 ${statistics.recordedDays} 天留下紀錄。`}>
      {statistics.primaryCaregiverDays.length === 0 ? (
        <p className="text-[14px] text-muted">這個月還沒有填寫主要照顧者。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {statistics.primaryCaregiverDays.map((item) => (
            <CountRow
              key={item.caregiver}
              label={CAREGIVER_LABELS[item.caregiver]}
              count={item.count}
              max={max}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}
