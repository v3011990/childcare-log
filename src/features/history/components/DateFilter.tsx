import { Select } from '@/components/ui/Select'
import { formatMonthLabel } from '@/lib/dates'
import type { DateFilterValue } from '@/features/history/history.types'

interface DateFilterProps {
  months: string[]
  value: DateFilterValue
  onChange: (value: DateFilterValue) => void
}

export function DateFilter({ months, value, onChange }: DateFilterProps) {
  const options = [
    { value: 'all', label: '全部日期' },
    ...months.map((monthKey) => ({ value: monthKey, label: formatMonthLabel(monthKey) })),
  ]

  return (
    <Select
      id="history-date-filter"
      aria-label="篩選月份"
      options={options}
      value={value.kind === 'all' ? 'all' : value.monthKey}
      onChange={(event) =>
        onChange(
          event.target.value === 'all'
            ? { kind: 'all' }
            : { kind: 'month', monthKey: event.target.value },
        )
      }
    />
  )
}
