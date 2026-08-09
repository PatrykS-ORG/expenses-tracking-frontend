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
