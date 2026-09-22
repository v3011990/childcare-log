import { addDays, format } from 'date-fns'
import { DATE_FORMAT, formatDateWithWeekday, parseISODate } from '@/lib/dates'
import type { ISODateString } from '@/types/common'

interface DateSwitcherProps {
  date: ISODateString
  today: ISODateString
  onChange: (date: ISODateString) => void
}

function shiftDay(date: ISODateString, delta: number): ISODateString {
  return format(addDays(parseISODate(date), delta), DATE_FORMAT)
}

/**
 * 切換要記錄的日期，讓忘記當天填的人可以回頭補記。
 *
 * 不允許選未來日期：還沒發生的照顧行為不該先被記下來（SPEC §16.5）。
 */
export function DateSwitcher({ date, today, onChange }: DateSwitcherProps) {
  const isToday = date === today

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="前一天"
          onClick={() => onChange(shiftDay(date, -1))}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-lg text-muted active:bg-primary-soft"
        >
          ‹
        </button>

        <div className="relative flex-1">
          <div className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-card px-3 text-[15px] font-medium text-ink">
            {formatDateWithWeekday(date)}
          </div>
          {/* 疊在上面的原生日期輸入：點一下就叫出系統日曆，不必自己做選單 */}
          <input
            type="date"
            aria-label="選擇日期"
            value={date}
            max={today}
            min="2000-01-01"
            onChange={(event) => {
              if (event.target.value) onChange(event.target.value)
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <button
          type="button"
          aria-label="後一天"
          disabled={isToday}
          onClick={() => onChange(shiftDay(date, 1))}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-lg text-muted active:bg-primary-soft disabled:opacity-35"
        >
          ›
        </button>
      </div>

      {!isToday && (
        <div className="mt-2 flex items-start justify-between gap-3 rounded-xl bg-primary-soft px-3 py-2">
          <p className="text-[13px] leading-5 text-muted">
            這是補記。紀錄會存在這一天，建立時間另外記為今天，不會偽造成當天寫的。
          </p>
          <button
            type="button"
            onClick={() => onChange(today)}
            className="min-h-9 shrink-0 rounded-lg px-2 text-[13px] font-medium text-primary"
          >
            回到今天
          </button>
        </div>
      )}
    </div>
  )
}
