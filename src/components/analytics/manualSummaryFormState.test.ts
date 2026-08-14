import { describe, expect, it } from 'vitest';
import {
  applyCategorySuggestions,
  buildCurrentMonthExpensesPayload,
  buildManualSummaryCategories,
  categoryFormStateFromCurrentMonth,
  emptyCategoryFormState,
  recomputeCategoryTotalFromItems,
} from './manualSummaryFormState';

describe('manualSummaryFormState current-month helpers', () => {
  it('round-trips current month payload through form state', () => {
    const payload = {
      categories: [
        {
          key: 'Groceries',
          items: [{ name: 'Biedronka', amount: '45.20' }],
        },
      ],
      unassigned: [{ name: 'Netflix', amount: '59.00' }],
    };

    const parsed = categoryFormStateFromCurrentMonth(payload);
    expect(parsed.categories.Groceries.items).toEqual([
      { name: 'Biedronka', amount: '45.20' },
    ]);
    expect(parsed.categories.Groceries.total).toBe('45.20');
    expect(parsed.unassigned).toEqual([{ name: 'Netflix', amount: '59.00' }]);

    const rebuilt = buildCurrentMonthExpensesPayload(
      parsed.categories,
      parsed.unassigned,
    );
    expect(rebuilt).toEqual(payload);
  });

  it('applies AI suggestions into categories and clears matched unassigned', () => {
    const categories = emptyCategoryFormState();
    const unassigned = [
      { name: 'Biedronka', amount: '45.20' },
      { name: 'Orlen', amount: '120.00' },
    ];

    const result = applyCategorySuggestions(categories, unassigned, [
      { name: 'Biedronka', amount: '45.20', categoryKey: 'Groceries' },
      { name: 'Orlen', amount: '120.00', categoryKey: 'Transport' },
    ]);

    expect(result.unassigned).toEqual([]);
    expect(result.categories.Groceries.items).toEqual([
      { name: 'Biedronka', amount: '45.20' },
    ]);
    expect(result.categories.Transport.items).toEqual([
      { name: 'Orlen', amount: '120.00' },
    ]);
    expect(result.categories.Groceries.total).toBe('45.20');
    expect(result.categories.Transport.total).toBe('120.00');
  });

  it('recomputes category totals from line items', () => {
    expect(
      recomputeCategoryTotalFromItems([
        { name: 'A', amount: '10.00' },
        { name: 'B', amount: '2.50' },
      ]),
    ).toBe('12.50');
  });

  it('builds manual categories using item sums when items are present', () => {
    const categories = emptyCategoryFormState();
    categories.Groceries = {
      total: '999.00',
      items: [
        { name: 'A', amount: '10.00' },
        { name: 'B', amount: '5.00' },
      ],
    };

    expect(buildManualSummaryCategories(categories)).toEqual([
      {
        name: 'Groceries',
        total: '15.00',
        items: [
          { name: 'A', amount: '10.00' },
          { name: 'B', amount: '5.00' },
        ],
      },
    ]);
  });
});
