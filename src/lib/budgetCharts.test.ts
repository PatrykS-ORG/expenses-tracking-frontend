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

  it('uses post-cut amounts and adds an extra-expense slice', () => {
    const result = buildBudgetDonutData(
      [
        { key: 'Groceries', amountCents: 120_000 },
        { key: 'DiningOut', amountCents: 30_000 },
      ],
      {
        savedByCategory: {
          Bills: 0,
          Groceries: 12_000,
          DiningOut: 3_000,
          Transport: 0,
          Education: 0,
          Entertainment: 0,
          Investments: 0,
          Car: 0,
          Clothing: 0,
          Snacks: 0,
          Health: 0,
          Travel: 0,
          Gifts: 0,
          Other: 0,
        },
        totalSavedCents: 15_000,
        targetCents: 200_000,
      },
    );

    expect(result.total).toBe(1500);
    expect(result.slices).toEqual([
      expect.objectContaining({ key: 'Groceries', value: 1080, percent: 72 }),
      expect.objectContaining({ key: 'DiningOut', value: 270, percent: 18 }),
      expect.objectContaining({
        key: 'ExtraExpense',
        value: 150,
        percent: 10,
      }),
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

  it('compares actuals against post-cut planned amounts', () => {
    const points = buildBudgetVsActualData(
      [{ key: 'Groceries', amountCents: 12_000 }],
      { Groceries: 11_000 },
      {
        savedByCategory: {
          Bills: 0,
          Groceries: 2_000,
          DiningOut: 0,
          Transport: 0,
          Education: 0,
          Entertainment: 0,
          Investments: 0,
          Car: 0,
          Clothing: 0,
          Snacks: 0,
          Health: 0,
          Travel: 0,
          Gifts: 0,
          Other: 0,
        },
        totalSavedCents: 2_000,
        targetCents: 2_000,
      },
    );

    expect(points).toEqual([
      {
        key: 'Groceries',
        planned: 100,
        actual: 110,
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
