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

export interface UnassignedExpenseItem {
  name: string;
  amount: string;
}

export interface CurrentMonthExpensesPayload {
  categories: Array<{
    key: string;
    items: Array<{ name: string; amount: string }>;
  }>;
  unassigned: Array<{ name: string; amount: string }>;
}

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

export function categoryFormStateFromCurrentMonth(
  payload: CurrentMonthExpensesPayload,
): { categories: CategoryFormState; unassigned: UnassignedExpenseItem[] } {
  const categories = emptyCategoryFormState();

  for (const category of payload.categories) {
    if (!CANONICAL_CATEGORY_KEYS.includes(category.key as SummaryCategoryKey)) {
      continue;
    }

    const key = category.key as SummaryCategoryKey;
    const items = category.items.map((item) => ({
      name: item.name,
      amount: item.amount,
    }));
    const totalCents = items.reduce(
      (sum, item) => sum + amountStringToCents(item.amount),
      0,
    );

    categories[key] = {
      total: totalCents > 0 ? centsToAmountString(totalCents) : '',
      items,
    };
  }

  return {
    categories,
    unassigned: payload.unassigned.map((item) => ({
      name: item.name,
      amount: item.amount,
    })),
  };
}

export function buildManualSummaryCategories(
  categories: CategoryFormState,
): ManualSummaryCategoryInput[] {
  return CANONICAL_CATEGORY_KEYS.flatMap((key) => {
    const row = categories[key];
    const items = row.items
      .filter((item) => item.name.trim() && item.amount.trim())
      .map((item) => ({
        name: item.name.trim(),
        amount: item.amount.trim(),
      }));

    const totalFromItems =
      items.length > 0 ? recomputeCategoryTotalFromItems(items) : '';
    const total = totalFromItems || row.total.trim();

    if (!total || amountStringToCents(total) === 0) {
      return [];
    }

    return [
      {
        name: key,
        total,
        ...(items.length > 0 ? { items } : {}),
      },
    ];
  });
}

export function buildCurrentMonthExpensesPayload(
  categories: CategoryFormState,
  unassigned: UnassignedExpenseItem[],
): CurrentMonthExpensesPayload {
  return {
    categories: CANONICAL_CATEGORY_KEYS.flatMap((key) => {
      const items = categories[key].items
        .filter((item) => item.name.trim() && item.amount.trim())
        .map((item) => ({
          name: item.name.trim(),
          amount: item.amount.trim(),
        }));
      if (items.length === 0) {
        return [];
      }
      return [{ key, items }];
    }),
    unassigned: unassigned
      .filter((item) => item.name.trim() && item.amount.trim())
      .map((item) => ({
        name: item.name.trim(),
        amount: item.amount.trim(),
      })),
  };
}

export function applyCategorySuggestions(
  categories: CategoryFormState,
  unassigned: UnassignedExpenseItem[],
  suggestions: Array<{ name: string; amount: string; categoryKey: string }>,
): { categories: CategoryFormState; unassigned: UnassignedExpenseItem[] } {
  const nextCategories = emptyCategoryFormState();
  for (const key of CANONICAL_CATEGORY_KEYS) {
    nextCategories[key] = {
      total: categories[key].total,
      items: [...categories[key].items],
    };
  }

  const remaining = [...unassigned];

  for (const suggestion of suggestions) {
    if (
      !CANONICAL_CATEGORY_KEYS.includes(
        suggestion.categoryKey as SummaryCategoryKey,
      )
    ) {
      continue;
    }

    const key = suggestion.categoryKey as SummaryCategoryKey;
    const matchIndex = remaining.findIndex(
      (item) =>
        item.name.trim() === suggestion.name.trim() &&
        item.amount.trim() === suggestion.amount.trim(),
    );
    if (matchIndex < 0) {
      continue;
    }

    remaining.splice(matchIndex, 1);
    nextCategories[key] = {
      ...nextCategories[key],
      items: [
        ...nextCategories[key].items,
        { name: suggestion.name, amount: suggestion.amount },
      ],
    };

    const totalCents = nextCategories[key].items.reduce(
      (sum, item) => sum + amountStringToCents(item.amount),
      0,
    );
    nextCategories[key].total =
      totalCents > 0 ? centsToAmountString(totalCents) : '';
  }

  return { categories: nextCategories, unassigned: remaining };
}

export function recomputeCategoryTotalFromItems(
  items: Array<{ name: string; amount: string }>,
): string {
  const totalCents = items.reduce(
    (sum, item) => sum + amountStringToCents(item.amount),
    0,
  );
  return totalCents > 0 ? centsToAmountString(totalCents) : '';
}
