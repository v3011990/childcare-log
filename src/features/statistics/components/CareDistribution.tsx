import { Card } from '@/components/ui/Card'
import { CARE_ACTIVITY_LABELS, CAREGIVER_LABELS } from '@/lib/constants'
import type { MonthlyStatistics } from '@/features/statistics/statistics'

export function CareDistribution({ statistics }: { statistics: MonthlyStatistics }) {
  const visible = statistics.activities.filter((item) => item.days > 0)
  const hasShared = visible.some(
    (item) => item.byCaregiver.reduce((sum, entry) => sum + entry.count, 0) > item.days,
  )

  return (
    <Card title="各項活動" hint="只呈現實際勾選的天數。">
      {visible.length === 0 ? (
        <p className="text-[14px] text-muted">這個月還沒有勾選任何活動。</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((item) => (
              <li key={item.activity}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] text-ink">
                    {CARE_ACTIVITY_LABELS[item.activity]}
                  </span>
                  <span className="text-[13px] text-muted">{item.days} 天</span>
                </div>
                <p className="mt-0.5 text-[13px] leading-5 text-muted">
                  {item.byCaregiver
                    .map((entry) => `${CAREGIVER_LABELS[entry.caregiver]} ${entry.count}`)
                    .join('、')}
                </p>
              </li>
            ))}
          </ul>
          {hasShared && (
            <p className="mt-3 text-[12px] leading-5 text-muted">
              同一項活動可能由多人一起完成，所以各人天數加總可能大於總天數。
            </p>
          )}
        </>
      )}
    </Card>
  )
}
