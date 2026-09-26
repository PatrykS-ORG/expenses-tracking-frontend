import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { currentYearMonth, isPastYear } from '../lib/period';
import { useCalendarContextStore } from '../store/useCalendarContextStore';

export function ArchiveYearBanner() {
  const { t } = useTranslation();
  const initialized = useCalendarContextStore((state) => state.initialized);
  const timezone = useCalendarContextStore((state) => state.timezone);
  const selectedYear = useCalendarContextStore((state) => state.selectedYear);
  const currentYear = useMemo(
    () => currentYearMonth(timezone).year,
    [timezone],
  );

  if (!initialized || !isPastYear(selectedYear, currentYear)) return null;

  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {t('calendarContext.readOnlyBanner', { year: selectedYear })}
    </p>
  );
}
