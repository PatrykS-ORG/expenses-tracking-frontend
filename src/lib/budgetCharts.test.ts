import { describe, expect, it } from 'vitest';
import {
  actualCentsFromCurrentMonth,
  buildBudgetDonutData,
  buildBudgetVsActualData,
} from './budgetCharts';

describe('buildBudgetDonutData', () => {
  it('returns empty slices when every amount is zero', () => {
    expect(
      buildBudgetDonutData([{ key: 'Groceries', amountCents: 0 }]),
    ).toEqual({ slices: [], total: 0 });
  });

  it('builds percent slices from positive amounts', () => {
    const result = buildBudgetDonutData([
      { key: 'Groceries', amountCents: 75_000 },
      { key: 'Transport', amountCents: 25_000 },
    ]);

    expect(result.total).toBe(1000);
    expect(result.slices).toEqual([
      expect.objectContaining({ key: 'Groceries', value: 750, percent: 75 }),
      expect.objectContaining({ key: 'Transport', value: 250, percent: 25 }),
    ]);
  });
});

describe('buildBudgetVsActualData', () => {
  it('marks categories over budget and skips empty ones', () => {
    const points = buildBudgetVsActualData(
      [{ key: 'Groceries', amountCents: 10_000 }],
      { Groceries: 12_000, Transport: 0, Snacks: 500 },
    );

    expect(points).toEqual([
      {
        key: 'Groceries',
        planned: 100,
        actual: 120,
        overBudget: true,
      },
      {
        key: 'Snacks',
        planned: 0,
        actual: 5,
        overBudget: true,
      },
    ]);
  });
});

describe('actualCentsFromCurrentMonth', () => {
  it('sums category items and folds unassigned into Other', () => {
    expect(
      actualCentsFromCurrentMonth({
        categories: [
          {
            key: 'Groceries',
            items: [{ amount: '10.00' }, { amount: '5.50' }],
          },
        ],
        unassigned: [{ amount: '2.00' }],
      }),
    ).toEqual({
      Groceries: 1550,
      Other: 200,
    });
  });
});

describe('actualCentsFromCurrentMonth', () => {
  it('sums category items and folds unassigned into Other', () => {
    expect(
      actualCentsFromCurrentMonth({
        categories: [
          {
            key: 'Groceries',
            items: [{ amount: '10.00' }, { amount: '5.50' }],
          },
        ],
        unassigned: [{ amount: '2.00' }],
      }),
    ).toEqual({
      Groceries: 1550,
      Other: 200,
    });
  });
});
