import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCentsAsCurrency } from '../../lib/money';
import { monthsUntil } from '../../types/savingsGoals.types';
import type { SavingsGoalEvent } from '../../types/savingsGoals.types';
import { formatGoalDate } from './formatGoalDate';

type EventPanelProps = {
  event: SavingsGoalEvent;
  locale: string;
  busy?: boolean;
  formSlot?: ReactNode;
  children?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
};

export function EventPanel({
  event,
  locale,
  busy = false,
  formSlot,
  children,
  onEdit,
  onDelete,
  onAddItem,
}: EventPanelProps) {
  const { t } = useTranslation();
  const targetLabel = formatGoalDate(event.targetDate, locale);
  const months = event.targetDate
    ? monthsUntil(new Date(event.targetDate))
    : null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{event.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('savingsGoals.progressLabel', {
              saved: formatCentsAsCurrency(
                event.totalSavedCents,
                event.currency,
                locale,
              ),
              target: formatCentsAsCurrency(
                event.totalTargetCents,
                event.currency,
                locale,
              ),
            })}
          </p>
          {targetLabel ? (
            <p className="mt-1 text-sm text-gray-500">
              {months === null
                ? t('savingsGoals.targetDatePassed', { date: targetLabel })
                : t('savingsGoals.monthsRemaining', {
                    count: months,
                    date: targetLabel,
                  })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
            {t('savingsGoals.editEvent')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${event.progressPercent}%` }}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('savingsGoals.itemsTitle')}
        </h3>
        <button
          type="button"
          disabled={busy}
          onClick={onAddItem}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t('savingsGoals.addItem')}
        </button>
      </div>

      {formSlot ? <div className="mt-4">{formSlot}</div> : null}

      <div className="mt-4 space-y-4">
        {event.items.length === 0 && !formSlot ? (
          <p className="text-sm text-gray-600">{t('savingsGoals.noItems')}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
