import { addMonths, format, isValid, parse, startOfMonth } from 'date-fns'
import { zhTW } from 'date-fns/locale/zh-TW'
import type { ISODateString } from '@/types/common'

export const DATE_FORMAT = 'yyyy-MM-dd'
export const MONTH_FORMAT = 'yyyy-MM'

/** 目前所在時區的今天，格式 `YYYY-MM-DD`。 */
export function todayISO(now: Date = new Date()): ISODateString {
  return format(now, DATE_FORMAT)
}

/** 把 `YYYY-MM-DD` 解析成當地時間當天的 00:00，避免 UTC 位移造成差一天。 */
export function parseISODate(date: ISODateString): Date {
  return parse(date, DATE_FORMAT, new Date())
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = parseISODate(value)
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value
}

/** 例：2026/09/21 星期一 */
export function formatDateWithWeekday(date: ISODateString): string {
  return format(parseISODate(date), 'yyyy/MM/dd EEEE', { locale: zhTW })
}

/** 例：9/21（週一） */
export function formatShortDate(date: ISODateString): string {
  return format(parseISODate(date), 'M/d（EEEEE）', { locale: zhTW })
}

/** `YYYY-MM-DD` → `YYYY-MM` */
export function monthKeyOf(date: ISODateString): string {
  return date.slice(0, 7)
}

export function currentMonthKey(now: Date = new Date()): string {
  return format(now, MONTH_FORMAT)
}

/** 例：2026 年 9 月 */
export function formatMonthLabel(monthKey: string): string {
  const parsed = parse(monthKey, MONTH_FORMAT, new Date())
  return format(parsed, 'yyyy 年 M 月', { locale: zhTW })
}

export function shiftMonth(monthKey: string, delta: number): string {
  const parsed = startOfMonth(parse(monthKey, MONTH_FORMAT, new Date()))
  return format(addMonths(parsed, delta), MONTH_FORMAT)
}

/** 月份的起訖日（含頭含尾），供 Dexie 的 between 查詢使用。 */
export function monthRange(monthKey: string): { start: ISODateString; end: ISODateString } {
  const start = startOfMonth(parse(monthKey, MONTH_FORMAT, new Date()))
  const nextMonth = addMonths(start, 1)
  return {
    start: format(start, DATE_FORMAT),
    end: format(nextMonth, DATE_FORMAT),
  }
}

export function nowISO(): string {
  return new Date().toISOString()
}
