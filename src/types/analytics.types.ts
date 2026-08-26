export type SummarySource = 'MANUAL' | 'SCHEDULED';

export type SummaryCategoryKey =
  | 'Bills'
  | 'Groceries'
  | 'DiningOut'
  | 'Transport'
  | 'Education'
  | 'Entertainment'
  | 'Investments'
  | 'Car'
  | 'Clothing'
  | 'Snacks'
  | 'Health'
  | 'Travel'
  | 'Gifts'
  | 'Other';

export const CANONICAL_CATEGORY_KEYS: readonly SummaryCategoryKey[] = [
  'Bills',
  'Groceries',
  'DiningOut',
  'Transport',
  'Education',
  'Entertainment',
  'Investments',
  'Car',
  'Clothing',
  'Snacks',
  'Health',
  'Travel',
  'Gifts',
  'Other',
] as const;

/** Canonical keys whose outflow is treated as investing/saving, not consumption. */
export const SAVINGS_LIKE_CATEGORY_KEYS: readonly SummaryCategoryKey[] = [
  'Investments',
];

export function isSavingsLikeCategory(value: string): boolean {
  return (SAVINGS_LIKE_CATEGORY_KEYS as readonly string[]).includes(value);
}

export function sumInvestedCents(
  categories: Array<{ name: string; totalCents: number }>,
): number {
  return categories.reduce(
    (sum, category) =>
      isSavingsLikeCategory(category.name) ? sum + category.totalCents : sum,
    0,
  );
}

export interface SummaryCategoryItem {
  name: string;
  amountCents: number;
}

export interface SummaryCategory {
  name: string;
  totalCents: number;
  items: SummaryCategoryItem[];
}

export interface SummaryAnalytics {
  id: string;
  period: string;
  source: SummarySource;
  currency: string;
  salaryCents: number;
  totalExpensesCents: number;
  investedCents: number;
  consumptionSpentCents: number;
  savingsCents: number;
  savingsMessage: string | null;
  categories: SummaryCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface ManualSummaryCategoryItemInput {
  name: string;
  amount: string;
}

export interface ManualSummaryCategoryInput {
  name: SummaryCategoryKey;
  total: string;
  items?: ManualSummaryCategoryItemInput[];
}

export interface CreateManualSummaryInput {
  period: string;
  salaryAmount: string;
  categories: ManualSummaryCategoryInput[];
  savingsMessage?: string | null;
}

export type UpdateManualSummaryInput = CreateManualSummaryInput;
