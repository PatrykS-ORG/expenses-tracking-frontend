import { describe, expect, it } from 'vitest';
import {
  buildLiveSummaryFromCategories,
  buildMomChartData,
  buildMonthlySavingsChartData,
  buildYtdSavesVsSpent,
} from './analyticsCharts';
import { emptyCategoryFormState } from '../components/analytics/manualSummaryFormState';
import type { SummaryAnalytics } from '../types/analytics.types';

function summary(
  overrides: Partial<SummaryAnalytics> &
    Pick<
      SummaryAnalytics,
      'period' | 'investedCents' | 'consumptionSpentCents'
    >,
): SummaryAnalytics {
  const totalExpensesCents =
    overrides.totalExpensesCents ??
    overrides.investedCents + overrides.consumptionSpentCents;
  const salaryCents = overrides.salaryCents ?? 800_000;
  return {
    id: overrides.id ?? `row-${overrides.period}`,
    period: overrides.period,
    source: 'MANUAL',
    currency: 'PLN',
    salaryCents,
    totalExpensesCents,
    investedCents: overrides.investedCents,
    consumptionSpentCents: overrides.consumptionSpentCents,
    savingsCents: overrides.savingsCents ?? salaryCents - totalExpensesCents,
    savingsMessage: null,
    categories: overrides.categories ?? [],
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  };
}

describe('buildYtdSavesVsSpent', () => {
  it('splits free savings, invested, and consumption spend', () => {
    const result = buildYtdSavesVsSpent(
      [
        summary({
          period: '2026-01',
          investedCents: 100_000,
          consumptionSpentCents: 200_000,
          salaryCents: 500_000,
        }),
        summary({
          period: '2026-02',
          investedCents: 50_000,
          consumptionSpentCents: 150_000,
          salaryCents: 500_000,
        }),
      ],
      { fromPeriod: '2026-01', throughPeriod: '2026-02' },
    );

    expect(result.investedCents).toBe(150_000);
    expect(result.spentCents).toBe(350_000);
    expect(result.savingsCents).toBe(500_000);
    expect(result.slices.map((slice) => slice.key)).toEqual([
      'savings',
      'invested',
      'spent',
    ]);
  });

  it('does not treat invested outflow as spent', () => {
    const result = buildYtdSavesVsSpent(
      [
        summary({
          period: '2026-01',
          investedCents: 300_000,
          consumptionSpentCents: 0,
          salaryCents: 500_000,
        }),
      ],
      { fromPeriod: '2026-01', throughPeriod: '2026-01' },
    );

    expect(result.spentCents).toBe(0);
    expect(result.investedCents).toBe(300_000);
    expect(result.slices.some((slice) => slice.key === 'spent')).toBe(false);
    expect(result.slices.some((slice) => slice.key === 'invested')).toBe(true);
  });
});

describe('buildMomChartData', () => {
  it('uses consumption spend and a separate invested series', () => {
    const points = buildMomChartData(
      [
        summary({
          period: '2026-01',
          investedCents: 100_000,
          consumptionSpentCents: 250_000,
          salaryCents: 800_000,
        }),
      ],
      'en',
      { fromPeriod: '2026-01', throughPeriod: '2026-01' },
    );

    expect(points).toEqual([
      {
        period: '2026-01',
        periodLabel: expect.any(String),
        income: 8000,
        expenses: 2500,
        invested: 1000,
      },
    ]);
  });
});

describe('buildMonthlySavingsChartData', () => {
  it('stacks invested beside free savings', () => {
    const points = buildMonthlySavingsChartData(
      [
        summary({
          period: '2026-01',
          investedCents: 120_000,
          consumptionSpentCents: 200_000,
          salaryCents: 500_000,
        }),
      ],
      'en',
      { fromPeriod: '2026-01', throughPeriod: '2026-01' },
    );

    expect(points[0]).toEqual({
      period: '2026-01',
      periodLabel: expect.any(String),
      savings: 1800,
      invested: 1200,
    });
  });
});

describe('buildLiveSummaryFromCategories', () => {
  it('derives invested cents from the Investments category', () => {
    const categories = emptyCategoryFormState();
    categories.Groceries = {
      total: '',
      items: [{ name: 'Biedronka', amount: '200.00' }],
    };
    categories.Investments = {
      total: '',
      items: [{ name: 'ETF', amount: '500.00' }],
    };

    const live = buildLiveSummaryFromCategories({
      period: '2026-08',
      currency: 'PLN',
      salaryCents: 1_000_00,
      categories,
      unassigned: [],
    });

    expect(live.investedCents).toBe(50_000);
    expect(live.consumptionSpentCents).toBe(20_000);
    expect(live.totalExpensesCents).toBe(70_000);
    expect(live.savingsCents).toBe(30_000);
  });
});
