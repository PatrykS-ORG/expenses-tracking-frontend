import {
  comparePeriods,
  EARLIEST_PERIOD,
  formatPeriodLabel,
  formatPeriodShortLabel,
  shiftPeriod,
} from './period';
import { amountStringToCents } from './money';
import type {
  SummaryAnalytics,
  SummaryCategoryKey,
} from '../types/analytics.types';
import { CANONICAL_CATEGORY_KEYS } from '../types/analytics.types';

export interface MomChartPoint {
  period: string;
  periodLabel: string;
  income: number | null;
  expenses: number | null;
}

export interface MonthlySavingsChartPoint {
  period: string;
  periodLabel: string;
  /** Missing months are 0 (same rule as YTD aggregates). */
  savings: number;
}

export interface CategoryDonutSlice {
  key: SummaryCategoryKey;
  value: number;
  percent: number;
  color: string;
}

export const CATEGORY_CHART_COLORS: Record<SummaryCategoryKey, string> = {
  Bills: '#059669',
  Groceries: '#38bdf8',
  DiningOut: '#0ea5e9',
  Transport: '#eab308',
  Education: '#8b5cf6',
  Entertainment: '#a855f7',
  Investments: '#10b981',
  Car: '#f97316',
  Clothing: '#db2777',
  Snacks: '#f59e0b',
  Health: '#ea580c',
  Travel: '#06b6d4',
  Gifts: '#ec4899',
  Other: '#64748b',
};

export const CHART_SERIES_COLORS = {
  income: '#059669',
  expenses: '#38bdf8',
  savings: '#059669',
  spent: '#38bdf8',
} as const;

export type YtdSavesVsSpentSliceKey = 'savings' | 'spent';

export interface YtdSavesVsSpentSlice {
  key: YtdSavesVsSpentSliceKey;
  value: number;
  percent: number;
  color: string;
}

export interface YtdSavesVsSpentData {
  savingsCents: number;
  spentCents: number;
  /** Clamped non-negative value used for the savings donut wedge. */
  savingsSliceValue: number;
  spentSliceValue: number;
  slices: YtdSavesVsSpentSlice[];
}

export interface MostExpensiveExpense {
  name: string;
  amountCents: number;
  period: string;
  categoryKey: SummaryCategoryKey;
}

function resolveYtdRange(
  summaries: SummaryAnalytics[],
  options?: { fromPeriod?: string; throughPeriod?: string },
): { start: string; end: string } {
  const byPeriod = new Map(
    summaries.map((summary) => [summary.period, summary] as const),
  );
  const sortedPeriods = [...byPeriod.keys()].sort(comparePeriods);
  const fallbackStart = sortedPeriods[0] ?? EARLIEST_PERIOD;
  const fallbackEnd = sortedPeriods[sortedPeriods.length - 1] ?? fallbackStart;

  let start = options?.fromPeriod ?? fallbackStart;
  let end = options?.throughPeriod ?? fallbackEnd;

  if (comparePeriods(start, EARLIEST_PERIOD) < 0) {
    start = EARLIEST_PERIOD;
  }
  if (comparePeriods(end, start) < 0) {
    end = start;
  }

  return { start, end };
}

/**
 * Cumulative saves vs spent from `fromPeriod` through `throughPeriod`.
 * Months without a summary contribute 0 / 0. Negative cumulative savings
 * clamp to 0 for the donut wedge only; `savingsCents` keeps the true total.
 */
export function buildYtdSavesVsSpent(
  summaries: SummaryAnalytics[],
  options?: { fromPeriod?: string; throughPeriod?: string },
): YtdSavesVsSpentData {
  const byPeriod = new Map(
    summaries.map((summary) => [summary.period, summary] as const),
  );
  const { start, end } = resolveYtdRange(summaries, options);

  let savingsCents = 0;
  let spentCents = 0;
  for (const period of listPeriodsInclusive(start, end)) {
    const summary = byPeriod.get(period);
    if (!summary) continue;
    savingsCents += summary.savingsCents;
    spentCents += summary.totalExpensesCents;
  }

  const savingsSliceValue = Math.max(0, savingsCents);
  const spentSliceValue = Math.max(0, spentCents);
  const sliceTotal = savingsSliceValue + spentSliceValue;

  if (sliceTotal <= 0) {
    return {
      savingsCents,
      spentCents,
      savingsSliceValue,
      spentSliceValue,
      slices: [],
    };
  }

  const slices: YtdSavesVsSpentSlice[] = (
    [
      {
        key: 'savings' as const,
        value: savingsSliceValue / 100,
        color: CHART_SERIES_COLORS.savings,
      },
      {
        key: 'spent' as const,
        value: spentSliceValue / 100,
        color: CHART_SERIES_COLORS.spent,
      },
    ] as const
  )
    .filter((slice) => slice.value > 0)
    .map((slice) => ({
      ...slice,
      percent: (slice.value / (sliceTotal / 100)) * 100,
    }));

  return {
    savingsCents,
    spentCents,
    savingsSliceValue,
    spentSliceValue,
    slices,
  };
}

/**
 * Max single line item by amountCents across summaries in range.
 * Ties: earlier period wins, then canonical category order, then first item.
 * Category totals without items are ignored.
 */
export function findMostExpensiveExpense(
  summaries: SummaryAnalytics[],
  options?: { fromPeriod?: string; throughPeriod?: string },
): MostExpensiveExpense | null {
  const { start, end } = resolveYtdRange(summaries, options);
  const inRange = summaries
    .filter(
      (summary) =>
        comparePeriods(summary.period, start) >= 0 &&
        comparePeriods(summary.period, end) <= 0,
    )
    .sort((a, b) => comparePeriods(a.period, b.period));

  let best: MostExpensiveExpense | null = null;

  for (const summary of inRange) {
    for (const categoryKey of CANONICAL_CATEGORY_KEYS) {
      const category = summary.categories.find(
        (entry) => entry.name === categoryKey,
      );
      if (!category) continue;

      for (const item of category.items) {
        if (!item.name.trim() || item.amountCents <= 0) continue;
        if (!best || item.amountCents > best.amountCents) {
          best = {
            name: item.name.trim(),
            amountCents: item.amountCents,
            period: summary.period,
            categoryKey,
          };
        }
      }
    }
  }

  return best;
}

function listPeriodsInclusive(
  fromPeriod: string,
  throughPeriod: string,
): string[] {
  if (comparePeriods(fromPeriod, throughPeriod) > 0) return [];
  const out: string[] = [];
  let period = fromPeriod;
  while (comparePeriods(period, throughPeriod) <= 0) {
    out.push(period);
    period = shiftPeriod(period, 1);
  }
  return out;
}

/**
 * Builds a continuous month axis from `fromPeriod` through `throughPeriod`.
 * Months without a summary keep null values so bars leave a visible gap.
 */
export function buildMomChartData(
  summaries: SummaryAnalytics[],
  locale: string,
  options?: { fromPeriod?: string; throughPeriod?: string },
): MomChartPoint[] {
  const byPeriod = new Map(
    summaries.map((summary) => [summary.period, summary] as const),
  );
  const sortedPeriods = [...byPeriod.keys()].sort(comparePeriods);
  const fallbackStart = sortedPeriods[0] ?? EARLIEST_PERIOD;
  const fallbackEnd = sortedPeriods[sortedPeriods.length - 1] ?? fallbackStart;

  let start = options?.fromPeriod ?? fallbackStart;
  let end = options?.throughPeriod ?? fallbackEnd;

  if (comparePeriods(start, EARLIEST_PERIOD) < 0) {
    start = EARLIEST_PERIOD;
  }
  if (comparePeriods(end, start) < 0) {
    end = start;
  }

  return listPeriodsInclusive(start, end).map((period) => {
    const summary = byPeriod.get(period);
    return {
      period,
      periodLabel: formatPeriodShortLabel(period, locale),
      income: summary ? summary.salaryCents / 100 : null,
      expenses: summary ? summary.totalExpensesCents / 100 : null,
    };
  });
}

/**
 * Monthly savings columns from `fromPeriod` through `throughPeriod`.
 * Months without a summary contribute 0 (aligned with YTD missing-month rule).
 */
export function buildMonthlySavingsChartData(
  summaries: SummaryAnalytics[],
  locale: string,
  options?: { fromPeriod?: string; throughPeriod?: string },
): MonthlySavingsChartPoint[] {
  const byPeriod = new Map(
    summaries.map((summary) => [summary.period, summary] as const),
  );
  const { start, end } = resolveYtdRange(summaries, options);

  return listPeriodsInclusive(start, end).map((period) => {
    const summary = byPeriod.get(period);
    return {
      period,
      periodLabel: formatPeriodShortLabel(period, locale),
      savings: summary ? summary.savingsCents / 100 : 0,
    };
  });
}

export function buildCategoryDonutData(summary: SummaryAnalytics): {
  slices: CategoryDonutSlice[];
  total: number;
} {
  const amounts = CANONICAL_CATEGORY_KEYS.map((key) => {
    const category = summary.categories.find((item) => item.name === key);
    return {
      key,
      value: (category?.totalCents ?? 0) / 100,
      color: CATEGORY_CHART_COLORS[key],
    };
  }).filter((slice) => slice.value > 0);

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

export function formatCompactAmount(
  amount: number,
  locale: string,
  currency?: string,
): string {
  const compact = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);

  return currency ? `${compact} ${currency}` : compact;
}

export function formatMomRangeCaption(
  points: Array<{ period: string }>,
  locale: string,
): string {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  if (first.period === last.period) {
    return formatPeriodLabel(first.period, locale);
  }
  const lastYear = last.period.slice(0, 4);
  return `${formatPeriodShortLabel(first.period, locale)}–${formatPeriodShortLabel(last.period, locale)} ${lastYear}`;
}

/**
 * Builds an in-memory SummaryAnalytics snapshot for the in-progress month
 * so existing charts can render without a persisted SummaryAnalytics row.
 * Unassigned items are folded into Other for the donut.
 */
export function buildLiveSummaryFromCategories(params: {
  period: string;
  currency: string;
  salaryCents: number;
  categories: Record<
    SummaryCategoryKey,
    { total: string; items: Array<{ name: string; amount: string }> }
  >;
  unassigned: Array<{ name: string; amount: string }>;
}): SummaryAnalytics {
  const categories = CANONICAL_CATEGORY_KEYS.flatMap((key) => {
    const row = params.categories[key];
    const items = row.items
      .filter((item) => item.name.trim() && item.amount.trim())
      .map((item) => ({
        name: item.name.trim(),
        amountCents: amountStringToCents(item.amount),
      }));

    // Current-month live preview is item-driven. Do not fall back to a stale
    // category total when items were moved away (that double-counted spend).
    let totalCents = items.reduce((sum, item) => sum + item.amountCents, 0);

    if (key === 'Other') {
      const unassignedItems = params.unassigned
        .filter((item) => item.name.trim() && item.amount.trim())
        .map((item) => ({
          name: item.name.trim(),
          amountCents: amountStringToCents(item.amount),
        }));
      items.push(...unassignedItems);
      totalCents += unassignedItems.reduce(
        (sum, item) => sum + item.amountCents,
        0,
      );
    }

    if (totalCents === 0 && items.length === 0) {
      return [];
    }

    return [
      {
        name: key,
        totalCents,
        items,
      },
    ];
  });

  const totalExpensesCents = categories.reduce(
    (sum, category) => sum + category.totalCents,
    0,
  );

  return {
    id: `live-${params.period}`,
    period: params.period,
    source: 'MANUAL',
    currency: params.currency,
    salaryCents: params.salaryCents,
    totalExpensesCents,
    savingsCents: params.salaryCents - totalExpensesCents,
    savingsMessage: null,
    categories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
