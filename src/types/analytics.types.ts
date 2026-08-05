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
