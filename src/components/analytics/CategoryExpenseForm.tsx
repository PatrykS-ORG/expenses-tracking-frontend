import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import type { SummaryCategoryKey } from '../../types/analytics.types';
import { CANONICAL_CATEGORY_KEYS } from '../../types/analytics.types';
import { CollapsibleCategoryCard } from './CollapsibleCategoryCard';
import {
  recomputeCategoryTotalFromItems,
  type CategoryFormState,
  type UnassignedExpenseItem,
} from './manualSummaryFormState';

type CategoryExpenseFormProps = {
  categories: CategoryFormState;
  unassigned?: UnassignedExpenseItem[];
  showUnassigned?: boolean;
  /** When true, category totals are always derived from line items. */
  autoTotalFromItems?: boolean;
  /**
   * When true (and autoTotalFromItems is false), totals auto-sum from line
   * items whenever a category has items; empty categories stay editable.
   */
  autoTotalWhenItemsPresent?: boolean;
  busy?: boolean;
  suggestBusy?: boolean;
  categoriesTitle: string;
  categoryLabel: (key: SummaryCategoryKey) => string;
  categoryTotalLabel: string;
  lineItemsLabel: string;
  itemNameLabel: string;
  itemAmountLabel: string;
  addLineItemLabel: string;
  removeLineItemLabel: string;
  unassignedTitle?: string;
  unassignedHint?: string;
  moveToCategoryLabel?: string;
  suggestCategoriesLabel?: string;
  addUnassignedLabel?: string;
  onCategoriesChange: (value: CategoryFormState) => void;
  onUnassignedChange?: (value: UnassignedExpenseItem[]) => void;
  onSuggestCategories?: () => void;
};

export function CategoryExpenseForm({
  categories,
  unassigned = [],
  showUnassigned = false,
  autoTotalFromItems = false,
  autoTotalWhenItemsPresent = false,
  busy = false,
  suggestBusy = false,
  categoriesTitle,
  categoryLabel,
  categoryTotalLabel,
  lineItemsLabel,
  itemNameLabel,
  itemAmountLabel,
  addLineItemLabel,
  removeLineItemLabel,
  unassignedTitle,
  unassignedHint,
  moveToCategoryLabel,
  suggestCategoriesLabel,
  addUnassignedLabel,
  onCategoriesChange,
  onUnassignedChange,
  onSuggestCategories,
}: CategoryExpenseFormProps) {
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState<
    Partial<Record<SummaryCategoryKey, boolean>>
  >({});

  const isExpanded = (key: SummaryCategoryKey) => expandedKeys[key] === true;
  const toggleCategory = (key: SummaryCategoryKey) => {
    setExpandedKeys((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const isAutoTotal = (
    key: SummaryCategoryKey,
    itemCount = categories[key].items.length,
  ) => autoTotalFromItems || (autoTotalWhenItemsPresent && itemCount > 0);

  const nextTotal = (
    _key: SummaryCategoryKey,
    items: Array<{ name: string; amount: string }>,
    fallback: string,
  ) => {
    // When auto-calc is enabled on the form, always derive from the new items
    // list — including clearing the total when the category becomes empty.
    // Using the previous total as fallback left stale amounts after moves.
    if (autoTotalFromItems || autoTotalWhenItemsPresent) {
      return recomputeCategoryTotalFromItems(items);
    }
    return fallback;
  };

  const updateCategoryTotal = (key: SummaryCategoryKey, total: string) => {
    if (isAutoTotal(key)) return;
    onCategoriesChange({
      ...categories,
      [key]: { ...categories[key], total },
    });
  };

  const addLineItem = (key: SummaryCategoryKey) => {
    const items = [...categories[key].items, { name: '', amount: '' }];
    onCategoriesChange({
      ...categories,
      [key]: {
        ...categories[key],
        items,
        total: nextTotal(key, items, categories[key].total),
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
      [key]: {
        ...categories[key],
        items,
        total: nextTotal(key, items, categories[key].total),
      },
    });
  };

  const removeLineItem = (key: SummaryCategoryKey, index: number) => {
    const items = categories[key].items.filter(
      (_, itemIndex) => itemIndex !== index,
    );
    onCategoriesChange({
      ...categories,
      [key]: {
        ...categories[key],
        items,
        total: nextTotal(key, items, categories[key].total),
      },
    });
  };

  const addUnassignedItem = () => {
    onUnassignedChange?.([...unassigned, { name: '', amount: '' }]);
  };

  const updateUnassignedItem = (
    index: number,
    field: 'name' | 'amount',
    value: string,
  ) => {
    onUnassignedChange?.(
      unassigned.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeUnassignedItem = (index: number) => {
    onUnassignedChange?.(
      unassigned.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const moveUnassignedToCategory = (
    index: number,
    key: SummaryCategoryKey | '',
  ) => {
    if (!key || !onUnassignedChange) return;
    const item = unassigned[index];
    if (!item) return;

    const remaining = unassigned.filter((_, itemIndex) => itemIndex !== index);
    const items = [...categories[key].items, { ...item }];
    onUnassignedChange(remaining);
    onCategoriesChange({
      ...categories,
      [key]: {
        ...categories[key],
        items,
        total: nextTotal(key, items, categories[key].total),
      },
    });
  };

  const moveLineItemToCategory = (
    fromKey: SummaryCategoryKey,
    index: number,
    toKey: SummaryCategoryKey | 'unassigned' | '',
  ) => {
    if (!toKey || toKey === fromKey) return;

    const item = categories[fromKey].items[index];
    if (!item) return;

    const sourceItems = categories[fromKey].items.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    if (toKey === 'unassigned') {
      if (!onUnassignedChange) return;
      onUnassignedChange([...unassigned, { ...item }]);
      onCategoriesChange({
        ...categories,
        [fromKey]: {
          ...categories[fromKey],
          items: sourceItems,
          total: nextTotal(fromKey, sourceItems, categories[fromKey].total),
        },
      });
      return;
    }

    const targetItems = [...categories[toKey].items, { ...item }];
    onCategoriesChange({
      ...categories,
      [fromKey]: {
        ...categories[fromKey],
        items: sourceItems,
        total: nextTotal(fromKey, sourceItems, categories[fromKey].total),
      },
      [toKey]: {
        ...categories[toKey],
        items: targetItems,
        total: nextTotal(toKey, targetItems, categories[toKey].total),
      },
    });
  };

  const categoryMoveOptions = (
    currentKey?: SummaryCategoryKey,
  ): Array<{ value: string; label: string }> => {
    const options: Array<{ value: string; label: string }> =
      CANONICAL_CATEGORY_KEYS.filter((key) => key !== currentKey).map(
        (key) => ({
          value: key,
          label: categoryLabel(key),
        }),
      );

    if (showUnassigned && onUnassignedChange) {
      options.unshift({
        value: 'unassigned',
        label: unassignedTitle ?? 'Unassigned',
      });
    }

    return options;
  };

  return (
    <div className="space-y-4">
      {showUnassigned && (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {unassignedTitle}
              </h3>
              {unassignedHint && (
                <p className="mt-1 text-xs text-gray-600">{unassignedHint}</p>
              )}
            </div>
            {onSuggestCategories && (
              <button
                type="button"
                disabled={
                  busy ||
                  suggestBusy ||
                  unassigned.filter((item) => item.name.trim()).length === 0
                }
                onClick={onSuggestCategories}
                className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {suggestCategoriesLabel}
              </button>
            )}
          </div>

          {unassigned.map((item, index) => (
            <div
              key={`unassigned-${index}`}
              className="grid gap-2 sm:grid-cols-[1fr_140px_minmax(140px,1fr)_auto]"
            >
              <label className="text-sm">
                {itemNameLabel}
                <input
                  type="text"
                  value={item.name}
                  disabled={busy}
                  onChange={(event) =>
                    updateUnassignedItem(index, 'name', event.target.value)
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
                  disabled={busy}
                  onChange={(event) =>
                    updateUnassignedItem(index, 'amount', event.target.value)
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </label>
              <label className="text-sm">
                {moveToCategoryLabel}
                <select
                  value=""
                  disabled={busy}
                  onChange={(event) =>
                    moveUnassignedToCategory(
                      index,
                      event.target.value as SummaryCategoryKey | '',
                    )
                  }
                  className="mt-1 w-full rounded-md border px-3 py-2"
                >
                  <option value="">—</option>
                  {CANONICAL_CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {categoryLabel(key)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeUnassignedItem(index)}
                className="mt-6 inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                aria-label={removeLineItemLabel}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={busy}
            onClick={addUnassignedItem}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {addUnassignedLabel ?? addLineItemLabel}
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">{categoriesTitle}</h3>
        {CANONICAL_CATEGORY_KEYS.map((key) => {
          const autoTotal = isAutoTotal(key);
          const expanded = isExpanded(key);
          const name = categoryLabel(key);
          return (
            <CollapsibleCategoryCard
              key={key}
              expanded={expanded}
              onToggle={() => toggleCategory(key)}
              title={name}
              contentId={`category-panel-${key}`}
              toggleAriaLabel={
                expanded
                  ? t('analytics.collapseCategory', { name })
                  : t('analytics.expandCategory', { name })
              }
              trailing={
                <label className="min-w-40 flex-1 text-sm">
                  {categoryTotalLabel}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={categories[key].total}
                    readOnly={autoTotal}
                    disabled={busy || autoTotal}
                    onChange={(event) =>
                      updateCategoryTotal(key, event.target.value)
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 disabled:bg-gray-50"
                    placeholder="0.00"
                  />
                </label>
              }
            >
              {categories[key].items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {lineItemsLabel}
                  </p>
                  {categories[key].items.map((item, index) => (
                    <div
                      key={`${key}-${index}`}
                      className="grid gap-2 sm:grid-cols-[1fr_140px_minmax(140px,1fr)_auto]"
                    >
                      <label className="text-sm">
                        {itemNameLabel}
                        <input
                          type="text"
                          value={item.name}
                          disabled={busy}
                          onChange={(event) =>
                            updateLineItem(
                              key,
                              index,
                              'name',
                              event.target.value,
                            )
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
                          disabled={busy}
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
                      <label className="text-sm">
                        {moveToCategoryLabel}
                        <select
                          value={key}
                          disabled={busy}
                          onChange={(event) =>
                            moveLineItemToCategory(
                              key,
                              index,
                              event.target.value as
                                | SummaryCategoryKey
                                | 'unassigned'
                                | '',
                            )
                          }
                          className="mt-1 w-full rounded-md border px-3 py-2"
                        >
                          <option value={key}>{categoryLabel(key)}</option>
                          {categoryMoveOptions(key).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeLineItem(key, index)}
                        className="mt-6 inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
                disabled={busy}
                onClick={() => addLineItem(key)}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {addLineItemLabel}
              </button>
            </CollapsibleCategoryCard>
          );
        })}
      </div>
    </div>
  );
}
