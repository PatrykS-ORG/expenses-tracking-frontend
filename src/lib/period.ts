/**
 * Utilities for working with `YYYY-MM` period strings in a specific
 * timezone. The analytics feature relies on the user's summary timezone to
 * decide which months are "ended" and which one is the currently-running
 * calendar month.
 */

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

export function currentMonthInTimezone(tz: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
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
export const EARLIEST_PERIOD = '2026-01';

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
