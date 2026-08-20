import { CANONICAL_CATEGORY_KEYS } from '../../types/analytics.types';
import type { SummaryCategoryKey } from '../../types/analytics.types';
import { CollapsibleCategoryCard } from '../analytics/CollapsibleCategoryCard';
import { amountStringToCents, formatCentsAsCurrency } from '../../lib/money';
import type {
  BudgetFormAmounts,
  ExtraExpenseCutSummary,
  ExtraExpenseForm,
} from '../../types/budget.types';

type BudgetCategoryFormProps = {
  amounts: BudgetFormAmounts;
  busy?: boolean;
  categoriesTitle: string;
  amountLabel: string;
  totalLabel: string;
  categoryLabel: (key: SummaryCategoryKey) => string;
  extraExpense?: ExtraExpenseForm;
  cutSummary?: ExtraExpenseCutSummary;
  cutLabel?: string;
  cutPlaceholder?: string;
  locale?: string;
  currency?: string;
  onChange: (amounts: BudgetFormAmounts) => void;
  onExtraExpenseChange?: (form: ExtraExpenseForm) => void;
};

export function BudgetCategoryForm({
  amounts,
  busy = false,
  categoriesTitle,
  amountLabel,
  totalLabel,
  categoryLabel,
  extraExpense,
  cutSummary,
  cutLabel,
  cutPlaceholder,
  locale = 'pl',
  currency = 'PLN',
  onChange,
  onExtraExpenseChange,
}: BudgetCategoryFormProps) {
  const extraExpenseEnabled = Boolean(extraExpense?.enabled);
  const totalCents = CANONICAL_CATEGORY_KEYS.reduce(
    (sum, key) => sum + amountStringToCents(amounts[key] ?? ''),
    0,
  );

  const updateAmount = (key: SummaryCategoryKey, value: string) => {
    onChange({ ...amounts, [key]: value });
  };

  const updateCut = (key: SummaryCategoryKey, value: string) => {
    if (!extraExpense || !onExtraExpenseChange) return;
    onExtraExpenseChange({
      ...extraExpense,
      cuts: { ...extraExpense.cuts, [key]: sanitizeCutPercentInput(value) },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900">{categoriesTitle}</h3>
        <p className="text-sm text-gray-600">
          {totalLabel}{' '}
          <span className="font-semibold tabular-nums text-gray-900">
            {(totalCents / 100).toFixed(2)}
          </span>
        </p>
      </div>
      {CANONICAL_CATEGORY_KEYS.map((key) => {
        const plannedCents = amountStringToCents(amounts[key] ?? '');
        const cutDisabled = busy || plannedCents <= 0;
        const savedCents = cutSummary?.savedByCategory[key] ?? 0;

        return (
          <CollapsibleCategoryCard
            key={key}
            expanded={false}
            onToggle={() => undefined}
            title={categoryLabel(key)}
            contentId={`budget-category-${key}`}
            toggleAriaLabel={categoryLabel(key)}
            trailingAlign={extraExpenseEnabled ? 'end' : 'center'}
            trailing={
              <div className="min-w-40 flex-1 space-y-2 text-sm">
                <label className="block">
                  {amountLabel}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amounts[key] ?? ''}
                    disabled={busy}
                    onChange={(event) => updateAmount(key, event.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
                    placeholder="0.00"
                  />
                </label>
                {extraExpenseEnabled ? (
                  <label className="block">
                    {cutLabel}
                    <span className="relative mt-1 block">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={extraExpense?.cuts[key] ?? ''}
                        disabled={cutDisabled}
                        onChange={(event) => updateCut(key, event.target.value)}
                        className="w-full rounded-md border px-3 py-2 pr-8 disabled:bg-gray-50"
                        placeholder={cutPlaceholder}
                        aria-label={cutLabel}
                      />
                      <span
                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400"
                        aria-hidden
                      >
                        %
                      </span>
                    </span>
                    {savedCents > 0 ? (
                      <p className="mt-1 text-xs tabular-nums text-gray-500">
                        = {formatCentsAsCurrency(savedCents, currency, locale)}
                      </p>
                    ) : null}
                  </label>
                ) : null}
              </div>
            }
          />
        );
      })}
    </div>
  );
}

function sanitizeCutPercentInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits === '') return '';
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isInteger(parsed) || parsed < 0) return '';
  return String(Math.min(parsed, 100));
}
