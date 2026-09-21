import { Link } from 'react-router-dom'
import { formatShortDate } from '@/lib/dates'
import { recordSummaryLines } from '@/features/records/record.utils'
import type { CareRecord } from '@/features/records/record.types'

export function RecordCard({ record }: { record: CareRecord }) {
  const lines = recordSummaryLines(record)

  return (
    <Link
      to={`/history/${record.id}`}
      className="block rounded-2xl bg-card p-4 active:bg-primary-soft"
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[15px] font-semibold text-ink">{formatShortDate(record.date)}</span>
        <span aria-hidden="true" className="text-[13px] text-muted">
          詳細 ›
        </span>
      </div>
      {lines.length === 0 ? (
        <p className="text-[14px] text-muted">沒有其他內容</p>
      ) : (
        <dl className="flex flex-col gap-1">
          {lines.map((line, index) => (
            <div key={`${line.label}-${index}`} className="flex gap-2 text-[14px] leading-6">
              <dt className="shrink-0 text-muted">{line.label}</dt>
              <dd className="text-ink">{line.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Link>
  )
}
