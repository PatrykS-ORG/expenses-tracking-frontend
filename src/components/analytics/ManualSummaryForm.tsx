import type { FormEvent } from 'react';
import type { SummaryCategoryKey } from '../../types/analytics.types';
import { CategoryExpenseForm } from './CategoryExpenseForm';
import type { CategoryFormState } from './manualSummaryFormState';

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
  moveToCategoryLabel: string;
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
  moveToCategoryLabel,
  onSalaryAmountChange,
  onSavingsMessageChange,
  onCategoriesChange,
  onSubmit,
  onCancel,
  cancelLabel,
}: ManualSummaryFormProps) {
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
            placeholder="10000.00"
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

      <CategoryExpenseForm
        categories={categories}
        busy={busy}
        autoTotalWhenItemsPresent
        categoriesTitle={categoriesTitle}
        categoryLabel={categoryLabel}
        categoryTotalLabel={categoryTotalLabel}
        lineItemsLabel={lineItemsLabel}
        itemNameLabel={itemNameLabel}
        itemAmountLabel={itemAmountLabel}
        addLineItemLabel={addLineItemLabel}
        removeLineItemLabel={removeLineItemLabel}
        moveToCategoryLabel={moveToCategoryLabel}
        onCategoriesChange={onCategoriesChange}
      />

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
