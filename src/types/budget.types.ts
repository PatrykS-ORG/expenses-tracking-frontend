import type { SummaryCategoryKey } from './analytics.types';
import { CANONICAL_CATEGORY_KEYS } from './analytics.types';
import { amountStringToCents, centsToAmountString } from '../lib/money';

export interface BudgetCategory {
  key: SummaryCategoryKey;
  amountCents: number;
}

export interface MonthlyBudget {
  id: string;
  currency: string;
  categories: BudgetCategory[];
  updatedAt: string;
}

export interface SaveMonthlyBudgetInput {
  currency: string;
  categories: BudgetCategory[];
}

export type BudgetFormAmounts = Record<SummaryCategoryKey, string>;

export function emptyBudgetFormAmounts(): BudgetFormAmounts {
  return Object.fromEntries(
    CANONICAL_CATEGORY_KEYS.map((key) => [key, '']),
  ) as BudgetFormAmounts;
}

export function budgetToFormAmounts(
  budget: MonthlyBudget | null,
): BudgetFormAmounts {
  const amounts = emptyBudgetFormAmounts();
  if (!budget) return amounts;

  for (const category of budget.categories) {
    amounts[category.key] =
      category.amountCents > 0 ? centsToAmountString(category.amountCents) : '';
  }

  return amounts;
}

export function formAmountsToCategories(
  amounts: BudgetFormAmounts,
): BudgetCategory[] {
  return CANONICAL_CATEGORY_KEYS.map((key) => ({
    key,
    amountCents: amountStringToCents(amounts[key] ?? ''),
  }));
}
