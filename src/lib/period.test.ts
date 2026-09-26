import { describe, expect, it } from 'vitest';
import {
  EARLIEST_CALENDAR_YEAR,
  LATEST_CALENDAR_YEAR,
  currentYearMonth,
  isFutureYear,
  isPastYear,
  isSelectableMonth,
  isSelectableYear,
  listCalendarYears,
  listMonthsInYear,
  yearEndPeriod,
  yearStartPeriod,
} from './period';

const warsawSeptember = new Date('2026-09-26T10:00:00.000Z');

describe('calendar year context', () => {
  it('derives the current year and month in the user timezone', () => {
    expect(currentYearMonth('Europe/Warsaw', warsawSeptember)).toEqual({
      year: 2026,
      month: 9,
    });
    expect(
      currentYearMonth(
        'Pacific/Auckland',
        new Date('2026-12-31T12:00:00.000Z'),
      ),
    ).toEqual({ year: 2027, month: 1 });
  });

  it('lists 2025 through 2056 and every month of a year', () => {
    const years = listCalendarYears();
    expect(years[0]).toBe(EARLIEST_CALENDAR_YEAR);
    expect(years[years.length - 1]).toBe(LATEST_CALENDAR_YEAR);
    expect(years).toHaveLength(32);
    expect(listMonthsInYear()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(yearStartPeriod(2030)).toBe('2030-01');
    expect(yearEndPeriod(2030)).toBe('2030-12');
  });

  it('keeps future years visible in range but not selectable', () => {
    expect(isSelectableYear(2026, 2026)).toBe(true);
    expect(isSelectableYear(2056, 2026)).toBe(false);
    expect(isFutureYear(2027, 2026)).toBe(true);
    expect(isPastYear(2026, 2027)).toBe(true);
    expect(isSelectableYear(2025, 2026)).toBe(true);
    expect(isSelectableYear(2024, 2026)).toBe(false);
    expect(isSelectableYear(2057, 2056)).toBe(false);
  });

  it('disables months that have not started in the current year', () => {
    expect(isSelectableMonth(2026, 9, 2026, 9)).toBe(true);
    expect(isSelectableMonth(2026, 10, 2026, 9)).toBe(false);
    expect(isSelectableMonth(2026, 1, 2026, 9)).toBe(true);
    expect(isSelectableMonth(2026, 12, 2027, 2)).toBe(true);
    expect(isSelectableMonth(2027, 1, 2026, 9)).toBe(false);
  });
});
