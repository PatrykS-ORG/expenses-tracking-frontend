import { useMemo } from 'react';
import { CircleHelp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  currentYearMonth,
  isSelectableYear,
  listCalendarYears,
} from '../lib/period';
import { useCalendarContextStore } from '../store/useCalendarContextStore';

export function CalendarYearSelect() {
  const { t } = useTranslation();
  const initialized = useCalendarContextStore((state) => state.initialized);
  const timezone = useCalendarContextStore((state) => state.timezone);
  const selectedYear = useCalendarContextStore((state) => state.selectedYear);
  const setYear = useCalendarContextStore((state) => state.setYear);
  const currentYear = useMemo(
    () => currentYearMonth(timezone).year,
    [timezone],
  );
  const years = useMemo(() => listCalendarYears(), []);

  if (!initialized) return null;

  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        aria-label={t('calendarContext.yearLabel')}
        value={selectedYear}
        onChange={(event) => setYear(Number(event.target.value))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900"
      >
        {years.map((year) => (
          <option
            key={year}
            value={year}
            disabled={!isSelectableYear(year, currentYear)}
          >
            {year}
          </option>
        ))}
      </select>
      <span className="group relative inline-flex">
        <button
          type="button"
          aria-label={t('calendarContext.yearHelpLabel')}
          className="rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <CircleHelp className="h-4 w-4" aria-hidden />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded-md bg-gray-900 px-3 py-2 text-left text-xs font-normal leading-5 text-white group-hover:block group-focus-within:block"
        >
          {t('calendarContext.yearHelp')}
        </span>
      </span>
    </div>
  );
}
