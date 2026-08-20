import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCentsAsCurrency } from '../../lib/money';
import {
  emptyExtraExpenseForm,
  type ExtraExpenseCutSummary,
  type ExtraExpenseForm,
} from '../../types/budget.types';

type ExtraExpenseSectionProps = {
  form: ExtraExpenseForm;
  summary: ExtraExpenseCutSummary;
  busy?: boolean;
  locale: string;
  currency: string;
  onChange: (form: ExtraExpenseForm) => void;
};

function progressMessageClass(savedCents: number, targetCents: number) {
  if (targetCents <= 0 || savedCents < targetCents) {
    return 'text-red-700';
  }
  if (savedCents === targetCents) {
    return 'text-emerald-700';
  }
  return 'text-amber-800';
}

export function ExtraExpenseSection({
  form,
  summary,
  busy = false,
  locale,
  currency,
  onChange,
}: ExtraExpenseSectionProps) {
  const { t } = useTranslation();
  const { totalSavedCents, targetCents } = summary;
  const coveragePercent =
    targetCents > 0
      ? Math.min(100, Math.round((totalSavedCents / targetCents) * 100))
      : 0;
  const messageClass = progressMessageClass(totalSavedCents, targetCents);
  const savedLabel = formatCentsAsCurrency(totalSavedCents, currency, locale);
  const targetLabel = formatCentsAsCurrency(targetCents, currency, locale);

  if (!form.enabled) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onChange({ ...emptyExtraExpenseForm(), enabled: true })
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t('budget.extraExpense.addButton')}
        </button>
      </section>
    );
  }

  let statusMessage: string | null = null;
  if (targetCents > 0) {
    if (totalSavedCents < targetCents) {
      statusMessage = t('budget.extraExpense.deficit', {
        amount: formatCentsAsCurrency(
          targetCents - totalSavedCents,
          currency,
          locale,
        ),
      });
    } else if (totalSavedCents === targetCents) {
      statusMessage = t('budget.extraExpense.fullyCovered');
    } else {
      statusMessage = t('budget.extraExpense.exceeded', {
        amount: formatCentsAsCurrency(
          totalSavedCents - targetCents,
          currency,
          locale,
        ),
      });
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700">
          {t('budget.extraExpense.nameLabel')}
          <input
            type="text"
            required
            maxLength={100}
            value={form.name}
            disabled={busy}
            onChange={(event) =>
              onChange({ ...form, name: event.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
            placeholder={t('budget.extraExpense.namePlaceholder')}
          />
        </label>
        <label className="text-sm text-gray-700">
          {t('budget.extraExpense.amountLabel')}
          <input
            type="text"
            inputMode="decimal"
            required
            value={form.amount}
            disabled={busy}
            onChange={(event) =>
              onChange({ ...form, amount: event.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
            placeholder="0.00"
          />
        </label>
      </div>

      <div className="mx-auto mt-6 w-full max-w-md text-center">
        <p className="text-sm font-medium text-gray-900">
          {t('budget.extraExpense.progressLabel', {
            saved: savedLabel,
            target: targetLabel,
          })}
        </p>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width]"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
        {statusMessage ? (
          <p className={`mt-2 text-sm font-medium ${messageClass}`}>
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(emptyExtraExpenseForm())}
          className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
        >
          {t('budget.extraExpense.removeButton')}
        </button>
      </div>
    </section>
  );
}
