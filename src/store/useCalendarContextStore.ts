import { create } from 'zustand';
import {
  EARLIEST_CALENDAR_YEAR,
  currentYearMonth,
  isSelectableMonth,
  isSelectableYear,
  toPeriod,
} from '../lib/period';

type CalendarContextState = {
  initialized: boolean;
  timezone: string;
  selectedYear: number;
  selectedMonth: number;
  initialize: (timezone: string) => void;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  reset: () => void;
};

export const useCalendarContextStore = create<CalendarContextState>(
  (set, get) => ({
    initialized: false,
    timezone: 'UTC',
    selectedYear: EARLIEST_CALENDAR_YEAR,
    selectedMonth: 1,
    initialize: (timezone) => {
      const current = currentYearMonth(timezone);
      set((state) =>
        state.initialized
          ? { timezone }
          : {
              initialized: true,
              timezone,
              selectedYear: current.year,
              selectedMonth: current.month,
            },
      );
    },
    setYear: (year) => {
      const current = currentYearMonth(get().timezone);
      if (!isSelectableYear(year, current.year)) return;
      set({ selectedYear: year, selectedMonth: 1 });
    },
    setMonth: (month) => {
      const { timezone, selectedYear } = get();
      const current = currentYearMonth(timezone);
      if (
        !isSelectableMonth(selectedYear, month, current.year, current.month)
      ) {
        return;
      }
      set({ selectedMonth: month });
    },
    reset: () =>
      set({
        initialized: false,
        timezone: 'UTC',
        selectedYear: EARLIEST_CALENDAR_YEAR,
        selectedMonth: 1,
      }),
  }),
);

export function selectedPeriodFromContext(year: number, month: number): string {
  return toPeriod(year, month);
}
