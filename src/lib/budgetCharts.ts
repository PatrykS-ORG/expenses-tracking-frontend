import type { SummaryCategoryKey } from '../types/analytics.types';
import { CANONICAL_CATEGORY_KEYS } from '../types/analytics.types';
import { CATEGORY_CHART_COLORS } from './analyticsCharts';
import type {
  BudgetCategory,
  ExtraExpenseCutSummary,
} from '../types/budget.types';
import { amountStringToCents } from './money';

export const BUDGET_VS_ACTUAL_COLORS = {
  planned: '#cbd5e1',
  overBudget: '#f87171',
} as const;

export const EXTRA_EXPENSE_SLICE_KEY = 'ExtraExpense' as const;
export const EXTRA_EXPENSE_SLICE_COLOR = '#8b5cf6';

export type BudgetDonutSliceKey =
  | SummaryCategoryKey
  | typeof EXTRA_EXPENSE_SLICE_KEY;

export interface BudgetDonutSlice {
  key: BudgetDonutSliceKey;
  value: number;
  percent: number;
  color: string;
}

export interface BudgetVsActualPoint {
  key: SummaryCategoryKey;
  planned: number;
  actual: number;
  overBudget: boolean;
}

function amountMap(
  categories: readonly BudgetCategory[],
): Map<SummaryCategoryKey, number> {
  return new Map(
    categories.map((category) => [category.key, category.amountCents]),
  );
}

function adjustedPlannedCents(
  plannedCents: number,
  savedCents: number | undefined,
): number {
  return Math.max(0, plannedCents - (savedCents ?? 0));
}

export function buildBudgetDonutData(
  categories: readonly BudgetCategory[],
  cutSummary?: ExtraExpenseCutSummary | null,
): {
  slices: BudgetDonutSlice[];
  total: number;
} {
  const byKey = amountMap(categories);
  const amounts: Array<Omit<BudgetDonutSlice, 'percent'>> =
    CANONICAL_CATEGORY_KEYS.map((key) => ({
      key,
      value:
        adjustedPlannedCents(
          byKey.get(key) ?? 0,
          cutSummary?.savedByCategory[key],
        ) / 100,
      color: CATEGORY_CHART_COLORS[key],
    })).filter((slice) => slice.value > 0);

  const extraSaved = (cutSummary?.totalSavedCents ?? 0) / 100;
  if (extraSaved > 0) {
    amounts.push({
      key: EXTRA_EXPENSE_SLICE_KEY,
      value: extraSaved,
      color: EXTRA_EXPENSE_SLICE_COLOR,
    });
  }

  const total = amounts.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) {
    return { slices: [], total: 0 };
  }

  const slices = amounts
    .map((slice) => ({
      ...slice,
      percent: (slice.value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  return { slices, total };
}

export function buildBudgetVsActualData(
  planned: readonly BudgetCategory[],
  actualCents: Partial<Record<SummaryCategoryKey, number>>,
  cutSummary?: ExtraExpenseCutSummary | null,
): BudgetVsActualPoint[] {
  const plannedByKey = amountMap(planned);

  return CANONICAL_CATEGORY_KEYS.flatMap((key) => {
    const plannedValue =
      adjustedPlannedCents(
        plannedByKey.get(key) ?? 0,
        cutSummary?.savedByCategory[key],
      ) / 100;
    const actualValue = (actualCents[key] ?? 0) / 100;
    if (plannedValue <= 0 && actualValue <= 0) {
      return [];
    }

    return [
      {
        key,
        planned: plannedValue,
        actual: actualValue,
        overBudget: actualValue > plannedValue,
      },
    ];
  });
}

export function actualCentsFromCurrentMonth(payload: {
  categories: Array<{ key: string; items: Array<{ amount: string }> }>;
  unassigned: Array<{ amount: string }>;
}): Partial<Record<SummaryCategoryKey, number>> {
  const actual: Partial<Record<SummaryCategoryKey, number>> = {};

  for (const category of payload.categories) {
    if (!CANONICAL_CATEGORY_KEYS.includes(category.key as SummaryCategoryKey)) {
      continue;
    }
    const key = category.key as SummaryCategoryKey;
    actual[key] = category.items.reduce(
      (sum, item) => sum + amountStringToCents(item.amount),
      0,
    );
  }

  const unassignedCents = payload.unassigned.reduce(
    (sum, item) => sum + amountStringToCents(item.amount),
    0,
  );
  if (unassignedCents > 0) {
    actual.Other = (actual.Other ?? 0) + unassignedCents;
  }

  return actual;
}
