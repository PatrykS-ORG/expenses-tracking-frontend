import type { SummaryCategoryKey } from './analytics.types';
import { CANONICAL_CATEGORY_KEYS } from './analytics.types';
import { amountStringToCents, centsToAmountString } from '../lib/money';

export interface BudgetCategory {
  key: SummaryCategoryKey;
  amountCents: number;
}

export interface ExtraExpenseCut {
  key: SummaryCategoryKey;
  cutPercent: number;
}

export interface ExtraExpense {
  name: string;
  amountCents: number;
  cuts: ExtraExpenseCut[];
}

export interface MonthlyBudget {
  id: string;
  currency: string;
  categories: BudgetCategory[];
  extraExpense?: ExtraExpense | null;
  updatedAt: string;
}

export interface SaveMonthlyBudgetInput {
  currency: string;
  categories: BudgetCategory[];
  extraExpense?: ExtraExpense | null;
}

export type BudgetFormAmounts = Record<SummaryCategoryKey, string>;

export interface ExtraExpenseForm {
  enabled: boolean;
  name: string;
  amount: string;
  cuts: Record<SummaryCategoryKey, string>;
}

export interface ExtraExpenseCutSummary {
  savedByCategory: Record<SummaryCategoryKey, number>;
  totalSavedCents: number;
  targetCents: number;
}

export function emptyBudgetFormAmounts(): BudgetFormAmounts {
  return Object.fromEntries(
    CANONICAL_CATEGORY_KEYS.map((key) => [key, '']),
  ) as BudgetFormAmounts;
}

export function emptyExtraExpenseCuts(): Record<SummaryCategoryKey, string> {
  return Object.fromEntries(
    CANONICAL_CATEGORY_KEYS.map((key) => [key, '']),
  ) as Record<SummaryCategoryKey, string>;
}

export function emptyExtraExpenseForm(): ExtraExpenseForm {
  return {
    enabled: false,
    name: '',
    amount: '',
    cuts: emptyExtraExpenseCuts(),
  };
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

export function budgetToExtraExpenseForm(
  budget: MonthlyBudget | null,
): ExtraExpenseForm {
  const form = emptyExtraExpenseForm();
  if (!budget?.extraExpense) return form;

  form.enabled = true;
  form.name = budget.extraExpense.name;
  form.amount =
    budget.extraExpense.amountCents > 0
      ? centsToAmountString(budget.extraExpense.amountCents)
      : '';

  for (const cut of budget.extraExpense.cuts) {
    form.cuts[cut.key] = String(cut.cutPercent);
  }

  return form;
}

export function formAmountsToCategories(
  amounts: BudgetFormAmounts,
): BudgetCategory[] {
  return CANONICAL_CATEGORY_KEYS.map((key) => ({
    key,
    amountCents: amountStringToCents(amounts[key] ?? ''),
  }));
}

export function extraExpenseFormToInput(
  form: ExtraExpenseForm,
): ExtraExpense | null {
  if (!form.enabled) return null;

  const cuts: ExtraExpenseCut[] = [];
  for (const key of CANONICAL_CATEGORY_KEYS) {
    const cutPercent = parseCutPercent(form.cuts[key] ?? '');
    if (cutPercent < 1) continue;
    cuts.push({ key, cutPercent });
  }

  return {
    name: form.name.trim(),
    amountCents: amountStringToCents(form.amount),
    cuts,
  };
}

export function computeCutSummary(
  amounts: BudgetFormAmounts,
  extraExpense: ExtraExpenseForm,
): ExtraExpenseCutSummary {
  const savedByCategory = Object.fromEntries(
    CANONICAL_CATEGORY_KEYS.map((key) => [key, 0]),
  ) as Record<SummaryCategoryKey, number>;

  let totalSavedCents = 0;
  for (const key of CANONICAL_CATEGORY_KEYS) {
    const plannedCents = amountStringToCents(amounts[key] ?? '');
    const cutPercent = parseCutPercent(extraExpense.cuts[key] ?? '');
    const savedCents =
      plannedCents > 0 && cutPercent > 0
        ? Math.round((plannedCents * cutPercent) / 100)
        : 0;
    savedByCategory[key] = savedCents;
    totalSavedCents += savedCents;
  }

  return {
    savedByCategory,
    totalSavedCents,
    targetCents: extraExpense.enabled
      ? amountStringToCents(extraExpense.amount)
      : 0,
  };
}

function parseCutPercent(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const parsed = Number.parseInt(trimmed, 10);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > 100 ||
    String(parsed) !== trimmed
  ) {
    return 0;
  }
  return parsed;
}
