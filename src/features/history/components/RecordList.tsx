import { RecordCard } from '@/features/records/components/RecordCard'
import type { MonthGroup } from '@/features/history/history.types'

export function RecordList({ groups }: { groups: MonthGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-[14px] leading-6 text-muted">
        還沒有紀錄。
        <br />
        到「今日」記下今天的情況就會出現在這裡。
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-3">
      {groups.map((group) => (
        <section key={group.monthKey}>
          <h2 className="mb-2 px-1 text-[13px] font-medium text-muted">{group.label}</h2>
          <div className="flex flex-col gap-2">
            {group.records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
