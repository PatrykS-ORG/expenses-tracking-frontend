import { getTestNowDate } from './testNow';

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function toPeriod(year: number, monthOneBased: number): string {
  return `${String(year).padStart(4, '0')}-${String(monthOneBased).padStart(2, '0')}`;
}

export function currentMonthInTimezone(
  tz: string,
  now: Date = getTestNowDate(),
): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value ?? '0');
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '0');
  return toPeriod(year, month);
}

export function shiftPeriod(period: string, deltaMonths: number): string {
  const [yStr, mStr] = period.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return period;
  const zeroIndexed = month - 1 + deltaMonths;
  const targetYear = year + Math.floor(zeroIndexed / 12);
  const normalized = ((zeroIndexed % 12) + 12) % 12;
  return toPeriod(targetYear, normalized + 1);
}

export function previousPeriod(period: string): string {
  return shiftPeriod(period, -1);
}

export function isPeriodBefore(a: string, b: string): boolean {
  return a < b;
}

export function comparePeriods(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Earliest YYYY-MM shown / accepted on the analytics page. */
export const EARLIEST_PERIOD = '2025-01';

export const EARLIEST_CALENDAR_YEAR = 2025;
export const LATEST_CALENDAR_YEAR = 2056;
export const LATEST_PERIOD = '2056-12';

export function parsePeriod(
  period: string,
): { year: number; month: number } | null {
  const [yearText, monthText] = period.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function currentYearMonth(
  timezone: string,
  now: Date = getTestNowDate(),
): { year: number; month: number } {
  const parsed = parsePeriod(currentMonthInTimezone(timezone, now));
  return parsed ?? { year: EARLIEST_CALENDAR_YEAR, month: 1 };
}

export function listCalendarYears(
  earliest = EARLIEST_CALENDAR_YEAR,
  latest = LATEST_CALENDAR_YEAR,
): number[] {
  const years: number[] = [];
  for (let year = earliest; year <= latest; year += 1) {
    years.push(year);
  }
  return years;
}

export function listMonthsInYear(): number[] {
  return Array.from({ length: 12 }, (_, index) => index + 1);
}

export function isCalendarYearInRange(year: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= EARLIEST_CALENDAR_YEAR &&
    year <= LATEST_CALENDAR_YEAR
  );
}

export function isFutureYear(year: number, currentYear: number): boolean {
  return year > currentYear;
}

export function isPastYear(year: number, currentYear: number): boolean {
  return year < currentYear;
}

export function isSelectableYear(year: number, currentYear: number): boolean {
  return isCalendarYearInRange(year) && year <= currentYear;
}

export function isSelectableMonth(
  year: number,
  month: number,
  currentYear: number,
  currentMonth: number,
): boolean {
  if (!isSelectableYear(year, currentYear)) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (year < currentYear) return true;
  return month <= currentMonth;
}

export function yearStartPeriod(year: number): string {
  return toPeriod(year, 1);
}

export function yearEndPeriod(year: number): string {
  return toPeriod(year, 12);
}

export function listEndedPeriods(currentPeriod: string, count = 24): string[] {
  const out: string[] = [];
  let period = previousPeriod(currentPeriod);
  for (let i = 0; i < count; i += 1) {
    if (comparePeriods(period, EARLIEST_PERIOD) < 0) break;
    out.push(period);
    period = previousPeriod(period);
  }
  return out;
}

export function formatPeriodLabel(period: string, locale: string): string {
  const [yStr, mStr] = period.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return period;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/** Short month label for chart axes, e.g. "Jun" / "cze". */
export function formatPeriodShortLabel(period: string, locale: string): string {
  const [yStr, mStr] = period.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return period;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}
