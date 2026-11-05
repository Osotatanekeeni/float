import { formatInTimeZone } from "date-fns-tz";

/** A wall-calendar day ("YYYY-MM-DD") with no time or zone. All engine dates are these. */
export type CalendarDate = string & { readonly __brand: "CalendarDate" };

const MS_PER_DAY = 86_400_000;
const PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Arithmetic goes through UTC epoch days so the host timezone and DST can never shift a date.
function toEpochDay(date: CalendarDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function fromEpochDay(day: number): CalendarDate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10) as CalendarDate;
}

export function isCalendarDate(value: string): value is CalendarDate {
  return PATTERN.test(value) && fromEpochDay(toEpochDay(value as CalendarDate)) === value;
}

export function calendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) throw new Error(`Invalid calendar date: expected a real YYYY-MM-DD date`);
  return value;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date in `timeZone` at `instant`. The caller supplies the clock, keeping the engine pure. */
export function todayIn(timeZone: string, instant: Date): CalendarDate {
  if (!isValidTimeZone(timeZone)) throw new Error(`Invalid time zone: ${timeZone}`);
  return formatInTimeZone(instant, timeZone, "yyyy-MM-dd") as CalendarDate;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

export function compareDates(a: CalendarDate, b: CalendarDate): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error(`Invalid month: ${month}`);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Adds months, clamping the day to the target month's length (Jan 31 + 1 month = Feb 28 or 29). */
export function addMonthsClamped(date: CalendarDate, months: number): CalendarDate {
  const [y, m, d] = date.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12 + 1;
  const day = Math.min(d, daysInMonth(year, month));
  return calendarDate(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

/** Every date from `start` to `start + days`, inclusive. */
export function dateRange(start: CalendarDate, days: number): CalendarDate[] {
  if (!Number.isInteger(days) || days < 0) throw new Error(`Invalid range length: ${days}`);
  const first = toEpochDay(start);
  return Array.from({ length: days + 1 }, (_, i) => fromEpochDay(first + i));
}
