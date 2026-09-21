import { Card } from '@/components/ui/Card'
import {
  CARE_ACTIVITY_LABELS,
  CAREGIVER_LABELS,
  CHILD_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  IMPORTANT_EVENT_LABELS,
} from '@/lib/constants'
import { formatDateWithWeekday } from '@/lib/dates'
import { totalExpense } from '@/features/records/record.utils'
import type { CareRecord } from '@/features/records/record.types'
import type { Caregiver } from '@/types/common'

function formatTimestamp(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('zh-TW')
}

export function RecordDetail({ record }: { record: CareRecord }) {
  const noteEntries = Object.entries(record.caregiverNotes) as [Caregiver, string][]

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <Card title={formatDateWithWeekday(record.date)}>
        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-muted">主要照顧者</dt>
            <dd className="text-ink">
              {record.primaryCaregiver ? CAREGIVER_LABELS[record.primaryCaregiver] : '未填寫'}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-muted">孩子狀況</dt>
            <dd className="text-ink">
              {record.childStatus.length > 0
                ? record.childStatus.map((status) => CHILD_STATUS_LABELS[status]).join('、')
                : '未填寫'}
            </dd>
          </div>
          {record.childStatusNote && (
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-muted">狀況補充</dt>
              <dd className="whitespace-pre-line text-ink">{record.childStatusNote}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card title="照顧活動">
        {record.activities.length === 0 ? (
          <p className="text-[14px] text-muted">沒有勾選任何活動。</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[15px]">
            {record.activities.map((item) => (
              <li key={item.activity} className="flex justify-between gap-3">
                <span className="text-ink">{CARE_ACTIVITY_LABELS[item.activity]}</span>
                <span className="text-right text-muted">
                  {item.caregivers.map((caregiver) => CAREGIVER_LABELS[caregiver]).join('、')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {noteEntries.length > 0 && (
        <Card title="照顧紀錄">
          <dl className="flex flex-col gap-3 text-[15px]">
            {noteEntries.map(([caregiver, note]) => (
              <div key={caregiver}>
                <dt className="text-[13px] text-muted">{CAREGIVER_LABELS[caregiver]}</dt>
                <dd className="mt-1 whitespace-pre-line text-ink">{note}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {(record.importantEvents.length > 0 || record.importantNote) && (
        <Card title="重要事項">
          {record.importantEvents.length > 0 && (
            <p className="text-[15px] text-ink">
              {record.importantEvents.map((tag) => IMPORTANT_EVENT_LABELS[tag]).join('、')}
            </p>
          )}
          {record.importantNote && (
            <p className="mt-2 whitespace-pre-line text-[15px] leading-6 text-ink">
              {record.importantNote}
            </p>
          )}
        </Card>
      )}

      {record.expenses.length > 0 && (
        <Card title={`費用（共 ${totalExpense(record)} 元）`}>
          <ul className="flex flex-col gap-2 text-[15px]">
            {record.expenses.map((expense) => (
              <li key={expense.id} className="flex justify-between gap-3">
                <span className="text-ink">
                  {EXPENSE_CATEGORY_LABELS[expense.category]}
                  {expense.note ? `・${expense.note}` : ''}
                </span>
                <span className="text-muted">
                  {expense.amount} 元／{CAREGIVER_LABELS[expense.payer]}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="px-1 text-[12px] leading-5 text-muted">
        建立於 {formatTimestamp(record.createdAt)}
        <br />
        最後修改 {formatTimestamp(record.updatedAt)}
      </p>
    </div>
  )
}
