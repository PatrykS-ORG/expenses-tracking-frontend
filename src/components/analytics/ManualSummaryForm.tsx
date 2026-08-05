import type { FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  ManualSummaryCategoryInput,
  SummaryAnalytics,
  SummaryCategoryKey,
} from '../../types/analytics.types';
import { CANONICAL_CATEGORY_KEYS } from '../../types/analytics.types';
import { amountStringToCents, centsToAmountString } from '../../lib/money';

export interface CategoryFormRow {
  total: string;
  items: Array<{ name: string; amount: string }>;
}

export type CategoryFormState = Record<SummaryCategoryKey, CategoryFormRow>;

export function emptyCategoryFormState(): CategoryFormState {
  const state = {} as CategoryFormState;
  for (const key of CANONICAL_CATEGORY_KEYS) {
    state[key] = { total: '', items: [] };
  }
  return state;
}

export function categoryFormStateFromSummary(
  summary: SummaryAnalytics,
): CategoryFormState {
  const state = emptyCategoryFormState();

  for (const category of summary.categories) {
    if (
      !CANONICAL_CATEGORY_KEYS.includes(category.name as SummaryCategoryKey)
    ) {
      continue;
    }

    const key = category.name as SummaryCategoryKey;
    state[key] = {
      total: centsToAmountString(category.totalCents),
      items: category.items.map((item) => ({
        name: item.name,
        amount: centsToAmountString(item.amountCents),
      })),
    };
  }

  return state;
}

export function buildManualSummaryCategories(
  categories: CategoryFormState,
): ManualSummaryCategoryInput[] {
  return CANONICAL_CATEGORY_KEYS.flatMap((key) => {
    const row = categories[key];
    if (!row.total.trim() || amountStringToCents(row.total) === 0) {
      return [];
    }

    const items = row.items
      .filter((item) => item.name.trim() && item.amount.trim())
      .map((item) => ({
        name: item.name.trim(),
        amount: item.amount.trim(),
      }));

    return [
      {
        name: key,
        total: row.total.trim(),
        ...(items.length > 0 ? { items } : {}),
      },
    ];
  });
}

type ManualSummaryFormProps = {
  period: string;
  salaryAmount: string;
  savingsMessage: string;
  categories: CategoryFormState;
  busy: boolean;
  submitLabel: string;
  salaryLabel: string;
  savingsMessageLabel: string;
  categoriesTitle: string;
  categoryLabel: (key: SummaryCategoryKey) => string;
  categoryTotalLabel: string;
  lineItemsLabel: string;
  itemNameLabel: string;
  itemAmountLabel: string;
  addLineItemLabel: string;
  removeLineItemLabel: string;
  onSalaryAmountChange: (value: string) => void;
  onSavingsMessageChange: (value: string) => void;
  onCategoriesChange: (value: CategoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  cancelLabel?: string;
};

export function ManualSummaryForm({
  period,
  salaryAmount,
  savingsMessage,
  categories,
  busy,
  submitLabel,
  salaryLabel,
  savingsMessageLabel,
  categoriesTitle,
  categoryLabel,
  categoryTotalLabel,
  lineItemsLabel,
  itemNameLabel,
  itemAmountLabel,
  addLineItemLabel,
  removeLineItemLabel,
  onSalaryAmountChange,
  onSavingsMessageChange,
  onCategoriesChange,
  onSubmit,
  onCancel,
  cancelLabel,
}: ManualSummaryFormProps) {
  const updateCategoryTotal = (key: SummaryCategoryKey, total: string) => {
    onCategoriesChange({
      ...categories,
      [key]: { ...categories[key], total },
    });
  };

  const addLineItem = (key: SummaryCategoryKey) => {
    onCategoriesChange({
      ...categories,
      [key]: {
        ...categories[key],
        items: [...categories[key].items, { name: '', amount: '' }],
      },
    });
  };

  const updateLineItem = (
    key: SummaryCategoryKey,
    index: number,
    field: 'name' | 'amount',
    value: string,
  ) => {
    const items = categories[key].items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    );
    onCategoriesChange({
      ...categories,
      [key]: { ...categories[key], items },
    });
  };

  const removeLineItem = (key: SummaryCategoryKey, index: number) => {
    onCategoriesChange({
      ...categories,
      [key]: {
        ...categories[key],
        items: categories[key].items.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      },
    });
  };

  return (
    <form
      className="space-y-6 rounded-lg border bg-white p-6 shadow-sm"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="period" value={period} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          {salaryLabel}
          <input
            type="text"
            inputMode="decimal"
            required
            value={salaryAmount}
            onChange={(event) => onSalaryAmountChange(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="6500.00"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          {savingsMessageLabel}
          <textarea
            value={savingsMessage}
            onChange={(event) => onSavingsMessageChange(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">{categoriesTitle}</h3>
        {CANONICAL_CATEGORY_KEYS.map((key) => (
          <div
            key={key}
            className="space-y-3 rounded-md border border-gray-200 p-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1 text-sm font-medium text-gray-700">
                {categoryLabel(key)}
              </div>
              <label className="min-w-40 flex-1 text-sm">
                {categoryTotalLabel}
                <input
                  type="text"
                  inputMode="decimal"
                  value={categories[key].total}
                  onChange={(event) =>
                    updateCategoryTotal(key, event.target.value)
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  placeholder="0.00"
                />
              </label>
            </div>

            {categories[key].items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {lineItemsLabel}
                </p>
                {categories[key].items.map((item, index) => (
                  <div
                    key={`${key}-${index}`}
                    className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"
                  >
                    <label className="text-sm">
                      {itemNameLabel}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(event) =>
                          updateLineItem(key, index, 'name', event.target.value)
                        }
                        className="mt-1 w-full rounded-md border px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      {itemAmountLabel}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.amount}
                        onChange={(event) =>
                          updateLineItem(
                            key,
                            index,
                            'amount',
                            event.target.value,
                          )
                        }
                        className="mt-1 w-full rounded-md border px-3 py-2"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeLineItem(key, index)}
                      className="mt-6 inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      aria-label={removeLineItemLabel}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => addLineItem(key)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              {addLineItemLabel}
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && cancelLabel && (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  );
}
