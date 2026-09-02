import { amountStringToCents, centsToAmountString } from '../lib/money';

export interface SavingsGoalContribution {
  id: string;
  amountCents: number;
  occurredOn: string;
  note: string | null;
  createdAt: string;
}

export interface SavingsGoalItem {
  id: string;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  sortOrder: number;
  savedCents: number;
  remainingCents: number;
  progressPercent: number;
  monthlySuggestionCents: number | null;
  contributions: SavingsGoalContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalEvent {
  id: string;
  name: string;
  currency: string;
  targetDate: string | null;
  totalTargetCents: number;
  totalSavedCents: number;
  progressPercent: number;
  items: SavingsGoalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingsGoalEventInput {
  name: string;
  currency?: string;
  targetDate?: string | null;
}

export interface UpdateSavingsGoalEventInput {
  name?: string;
  currency?: string;
  targetDate?: string | null;
}

export interface CreateSavingsGoalItemInput {
  name: string;
  targetAmountCents: number;
  targetDate?: string | null;
}

export interface UpdateSavingsGoalItemInput {
  name?: string;
  targetAmountCents?: number;
  targetDate?: string | null;
}

export interface AddSavingsGoalContributionInput {
  amountCents: number;
  occurredOn: string;
  note?: string | null;
}

export interface SavingsGoalEventForm {
  name: string;
  currency: string;
  targetDate: string;
}

export interface SavingsGoalItemForm {
  name: string;
  amount: string;
  targetDate: string;
}

export interface SavingsGoalContributionForm {
  amount: string;
  occurredOn: string;
  note: string;
}

export function emptySavingsGoalEventForm(currency = ''): SavingsGoalEventForm {
  return {
    name: '',
    currency,
    targetDate: '',
  };
}

export function emptySavingsGoalItemForm(): SavingsGoalItemForm {
  return {
    name: '',
    amount: '',
    targetDate: '',
  };
}

export function emptySavingsGoalContributionForm(
  occurredOn = '',
): SavingsGoalContributionForm {
  return {
    amount: '',
    occurredOn,
    note: '',
  };
}

export function todayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoDateToInput(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.slice(0, 10);
}

export function dateInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return `${trimmed}T00:00:00.000Z`;
}

export function eventToForm(event: SavingsGoalEvent): SavingsGoalEventForm {
  return {
    name: event.name,
    currency: event.currency,
    targetDate: isoDateToInput(event.targetDate),
  };
}

export function itemToForm(item: SavingsGoalItem): SavingsGoalItemForm {
  return {
    name: item.name,
    amount:
      item.targetAmountCents > 0
        ? centsToAmountString(item.targetAmountCents)
        : '',
    targetDate: isoDateToInput(item.targetDate),
  };
}

export function eventFormToCreateInput(
  form: SavingsGoalEventForm,
): CreateSavingsGoalEventInput {
  const currency = form.currency.trim();
  return {
    name: form.name.trim(),
    ...(currency ? { currency } : {}),
    targetDate: dateInputToIso(form.targetDate),
  };
}

export function eventFormToUpdateInput(
  form: SavingsGoalEventForm,
): UpdateSavingsGoalEventInput {
  const currency = form.currency.trim();
  return {
    name: form.name.trim(),
    ...(currency ? { currency } : {}),
    targetDate: dateInputToIso(form.targetDate),
  };
}

export function itemFormToCreateInput(
  form: SavingsGoalItemForm,
): CreateSavingsGoalItemInput {
  return {
    name: form.name.trim(),
    targetAmountCents: amountStringToCents(form.amount),
    targetDate: dateInputToIso(form.targetDate),
  };
}

export function itemFormToUpdateInput(
  form: SavingsGoalItemForm,
): UpdateSavingsGoalItemInput {
  return {
    name: form.name.trim(),
    targetAmountCents: amountStringToCents(form.amount),
    targetDate: dateInputToIso(form.targetDate),
  };
}

export function contributionFormToInput(
  form: SavingsGoalContributionForm,
): AddSavingsGoalContributionInput {
  const note = form.note.trim();
  const occurredOn = dateInputToIso(form.occurredOn);
  return {
    amountCents: amountStringToCents(form.amount),
    occurredOn: occurredOn ?? form.occurredOn,
    ...(note ? { note } : {}),
  };
}

export function progressPercent(
  savedCents: number,
  targetCents: number,
): number {
  if (targetCents <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((savedCents / targetCents) * 100));
}

export function remainingCents(
  targetCents: number,
  savedCents: number,
): number {
  return Math.max(0, targetCents - savedCents);
}

export function monthsUntil(
  targetDate: Date,
  now: Date = new Date(),
): number | null {
  if (targetDate.getTime() <= now.getTime()) {
    return null;
  }

  let total =
    (targetDate.getUTCFullYear() - now.getUTCFullYear()) * 12 +
    (targetDate.getUTCMonth() - now.getUTCMonth());

  if (targetDate.getUTCDate() < now.getUTCDate()) {
    total -= 1;
  }

  return Math.max(1, total);
}

export function monthlySuggestionCents(
  remaining: number,
  targetDate: Date | null,
  now: Date = new Date(),
): number | null {
  if (!targetDate) {
    return null;
  }

  const months = monthsUntil(targetDate, now);
  if (months === null) {
    return null;
  }
  if (remaining <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(remaining / months));
}
