import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCentsAsCurrency } from '../../lib/money';
import { formatPeriodLabel } from '../../lib/period';
import type { MonthClosureStatus } from '../../types/monthClose.types';
import { CloseMonthWizard } from './CloseMonthWizard';

type MonthCloseBannerProps = {
  token: string;
  status: MonthClosureStatus;
  locale: string;
  onClosed: () => void;
};

export function MonthCloseBanner({
  token,
  status,
  locale,
  onClosed,
}: MonthCloseBannerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!status.needsClosure) {
    return null;
  }

  return (
    <>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">
          {t('monthClose.bannerTitle', {
            month: formatPeriodLabel(status.period, locale),
          })}
        </p>
        <p className="mt-1">
          {t('monthClose.bannerBody', {
            amount: formatCentsAsCurrency(
              status.freeSavingsCents,
              status.currency,
              locale,
            ),
          })}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-md bg-amber-700 px-3 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          {t('monthClose.openWizard')}
        </button>
      </div>
      {open && (
        <CloseMonthWizard
          token={token}
          status={status}
          locale={locale}
          onDismiss={() => setOpen(false)}
          onClosed={() => {
            setOpen(false);
            onClosed();
          }}
        />
      )}
    </>
  );
}
