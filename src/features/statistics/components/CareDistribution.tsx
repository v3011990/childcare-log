import { Card } from '@/components/ui/Card'
import { CARE_ACTIVITY_LABELS, CAREGIVER_LABELS } from '@/lib/constants'
import type { MonthlyStatistics } from '@/features/statistics/statistics'

export function CareDistribution({ statistics }: { statistics: MonthlyStatistics }) {
  const visible = statistics.activities.filter((item) => item.total > 0)

  return (
    <Card title="各項活動" hint="只呈現實際勾選的次數。">
      {visible.length === 0 ? (
        <p className="text-[14px] text-muted">這個月還沒有勾選任何活動。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => (
            <li key={item.activity}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] text-ink">{CARE_ACTIVITY_LABELS[item.activity]}</span>
                <span className="text-[13px] text-muted">{item.total} 次</span>
              </div>
              <p className="mt-0.5 text-[13px] leading-5 text-muted">
                {item.byCaregiver
                  .map((entry) => `${CAREGIVER_LABELS[entry.caregiver]} ${entry.count}`)
                  .join('、')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
