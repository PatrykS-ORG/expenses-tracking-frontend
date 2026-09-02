import type { FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCentsAsCurrency } from '../../lib/money';
import {
  emptySavingsGoalContributionForm,
  monthsUntil,
  todayDateInput,
  type SavingsGoalContributionForm,
  type SavingsGoalItem,
} from '../../types/savingsGoals.types';
import { formatGoalDate } from './formatGoalDate';

type SubGoalCardProps = {
  item: SavingsGoalItem;
  currency: string;
  locale: string;
  busy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddContribution: (
    form: SavingsGoalContributionForm,
  ) => Promise<boolean> | boolean;
  onDeleteContribution: (id: string) => void;
};

export function SubGoalCard({
  item,
  currency,
  locale,
  busy = false,
  onEdit,
  onDelete,
  onAddContribution,
  onDeleteContribution,
}: SubGoalCardProps) {
  const { t } = useTranslation();
  const [contribution, setContribution] = useState(
    emptySavingsGoalContributionForm(todayDateInput()),
  );
  const targetLabel = formatGoalDate(item.targetDate, locale);
  const months = item.targetDate
    ? monthsUntil(new Date(item.targetDate))
    : null;
  const contributions = [...item.contributions].reverse();

  const handleAddContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await onAddContribution(contribution);
    if (saved) {
      setContribution(emptySavingsGoalContributionForm(todayDateInput()));
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <p className="mt-1 text-sm text-gray-500">
            {t('savingsGoals.progressLabel', {
              saved: formatCentsAsCurrency(item.savedCents, currency, locale),
              target: formatCentsAsCurrency(
                item.targetAmountCents,
                currency,
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
          {item.monthlySuggestionCents != null &&
          item.monthlySuggestionCents > 0 ? (
            <p className="mt-1 text-sm text-gray-700">
              {t('savingsGoals.monthlySuggestion', {
                amount: formatCentsAsCurrency(
                  item.monthlySuggestionCents,
                  currency,
                  locale,
                ),
              })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
            {t('savingsGoals.editItem')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${item.progressPercent}%` }}
        />
      </div>

      <h5 className="mt-4 text-sm font-medium text-gray-900">
        {t('savingsGoals.contributionsTitle')}
      </h5>
      {contributions.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">
          {t('savingsGoals.noContributions')}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {contributions.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-gray-900">
                  {formatCentsAsCurrency(entry.amountCents, currency, locale)}
                </span>
                <span className="ml-2 text-gray-500">
                  {formatGoalDate(entry.occurredOn, locale)}
                </span>
                {entry.note ? (
                  <span className="ml-2 text-gray-500">{entry.note}</span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDeleteContribution(entry.id)}
                className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
              >
                {t('common.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAddContribution}
        className="mt-3 grid gap-3 sm:grid-cols-3"
      >
        <label className="text-sm text-gray-700">
          {t('savingsGoals.contributionAmountLabel')}
          <input
            type="text"
            inputMode="decimal"
            required
            value={contribution.amount}
            disabled={busy}
            onChange={(change) =>
              setContribution({ ...contribution, amount: change.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
            placeholder="0.00"
          />
        </label>
        <label className="text-sm text-gray-700">
          {t('savingsGoals.contributionDateLabel')}
          <input
            type="date"
            required
            value={contribution.occurredOn}
            disabled={busy}
            onChange={(change) =>
              setContribution({
                ...contribution,
                occurredOn: change.target.value,
              })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
          />
        </label>
        <label className="text-sm text-gray-700">
          {t('savingsGoals.contributionNoteLabel')}
          <input
            type="text"
            maxLength={200}
            value={contribution.note}
            disabled={busy}
            onChange={(change) =>
              setContribution({ ...contribution, note: change.target.value })
            }
            className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
            placeholder={t('savingsGoals.contributionNotePlaceholder')}
          />
        </label>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('savingsGoals.addContribution')}
          </button>
        </div>
      </form>
    </article>
  );
}
