import { CANONICAL_CATEGORY_KEYS } from '../../types/analytics.types';
import type { SummaryCategoryKey } from '../../types/analytics.types';
import { CollapsibleCategoryCard } from '../analytics/CollapsibleCategoryCard';
import { amountStringToCents } from '../../lib/money';
import type { BudgetFormAmounts } from '../../types/budget.types';

type BudgetCategoryFormProps = {
  amounts: BudgetFormAmounts;
  busy?: boolean;
  categoriesTitle: string;
  amountLabel: string;
  totalLabel: string;
  categoryLabel: (key: SummaryCategoryKey) => string;
  onChange: (amounts: BudgetFormAmounts) => void;
};

export function BudgetCategoryForm({
  amounts,
  busy = false,
  categoriesTitle,
  amountLabel,
  totalLabel,
  categoryLabel,
  onChange,
}: BudgetCategoryFormProps) {
  const totalCents = CANONICAL_CATEGORY_KEYS.reduce(
    (sum, key) => sum + amountStringToCents(amounts[key] ?? ''),
    0,
  );

  const updateAmount = (key: SummaryCategoryKey, value: string) => {
    onChange({ ...amounts, [key]: value });
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
      {CANONICAL_CATEGORY_KEYS.map((key) => (
        <CollapsibleCategoryCard
          key={key}
          expanded={false}
          onToggle={() => undefined}
          title={categoryLabel(key)}
          contentId={`budget-category-${key}`}
          toggleAriaLabel={categoryLabel(key)}
          trailingAlign="center"
          trailing={
            <label className="min-w-40 flex-1 text-sm">
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
          }
        />
      ))}
    </div>
  );
}
