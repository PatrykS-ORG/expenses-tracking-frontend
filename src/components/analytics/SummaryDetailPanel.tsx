import { Pencil } from 'lucide-react';
import type {
  SummaryAnalytics,
  SummaryCategoryKey,
} from '../../types/analytics.types';
import { formatCentsAsCurrency } from '../../lib/money';

type SummaryDetailPanelProps = {
  summary: SummaryAnalytics;
  locale: string;
  sourceLabel: string;
  sourceManualLabel: string;
  sourceScheduledLabel: string;
  incomeLabel: string;
  expensesLabel: string;
  savingsLabel: string;
  narrativeLabel: string;
  categoriesTitle: string;
  categoryLabel: (key: SummaryCategoryKey) => string;
  lineItemsLabel: string;
  editLabel: string;
  onEdit: () => void;
};

export function SummaryDetailPanel({
  summary,
  locale,
  sourceLabel,
  sourceManualLabel,
  sourceScheduledLabel,
  incomeLabel,
  expensesLabel,
  savingsLabel,
  narrativeLabel,
  categoriesTitle,
  categoryLabel,
  lineItemsLabel,
  editLabel,
  onEdit,
}: SummaryDetailPanelProps) {
  const formatMoney = (cents: number) =>
    formatCentsAsCurrency(cents, summary.currency, locale);

  return (
    <section className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{sourceLabel}</p>
          <p className="text-sm font-medium text-gray-900">
            {summary.source === 'MANUAL'
              ? sourceManualLabel
              : sourceScheduledLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
          {editLabel}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-sm text-gray-600">{incomeLabel}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatMoney(summary.salaryCents)}
          </p>
        </div>
        <div className="rounded-md border border-red-100 bg-red-50/60 p-4">
          <p className="text-sm text-gray-600">{expensesLabel}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatMoney(summary.totalExpensesCents)}
          </p>
        </div>
        <div className="rounded-md border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-sm text-gray-600">{savingsLabel}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatMoney(summary.savingsCents)}
          </p>
        </div>
      </div>

      {summary.savingsMessage && (
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            {narrativeLabel}
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
            {summary.savingsMessage}
          </p>
        </div>
      )}

      {summary.categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            {categoriesTitle}
          </h3>
          <div className="space-y-3">
            {summary.categories.map((category) => (
              <div
                key={category.name}
                className="rounded-md border border-gray-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">
                    {categoryLabel(category.name as SummaryCategoryKey)}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMoney(category.totalCents)}
                  </p>
                </div>
                {category.items.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t pt-3 text-sm text-gray-600">
                    <li className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {lineItemsLabel}
                    </li>
                    {category.items.map((item) => (
                      <li
                        key={`${category.name}-${item.name}`}
                        className="flex justify-between gap-3"
                      >
                        <span>{item.name}</span>
                        <span>{formatMoney(item.amountCents)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
