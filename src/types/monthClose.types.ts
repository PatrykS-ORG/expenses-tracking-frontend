import { amountStringToCents, centsToAmountString } from '../lib/money';

export interface MonthClosureStatus {
  needsClosure: boolean;
  period: string;
  currentPeriod: string;
  freeSavingsCents: number;
  salaryCents: number;
  totalExpensesCents: number;
  currency: string;
}

export interface MonthCloseAllocation {
  itemId: string;
  amountCents: number;
}

export interface MonthCloseAllocationDraft extends MonthCloseAllocation {
  id: string;
  eventId: string;
  eventName: string;
  itemName: string;
}

export function remainingToAllocate(
  freeSavingsCents: number,
  allocations: Array<{ amountCents: number }>,
): number {
  return (
    freeSavingsCents -
    allocations.reduce((sum, allocation) => sum + allocation.amountCents, 0)
  );
}

export function clampAllocationInput(value: string, maxCents: number): string {
  if (value.trim() === '') {
    return '';
  }
  const amountCents = amountStringToCents(value);
  if (amountCents <= maxCents) {
    return value;
  }
  return maxCents > 0 ? centsToAmountString(maxCents) : '';
}

export function isValidAllocationAmount(
  amountCents: number,
  remainingCents: number,
): boolean {
  return amountCents > 0 && amountCents <= remainingCents;
}
