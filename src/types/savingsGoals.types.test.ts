import { describe, expect, it } from 'vitest';
import {
  contributionFormToInput,
  dateInputToIso,
  emptySavingsGoalEventForm,
  eventFormToCreateInput,
  itemFormToCreateInput,
  monthlySuggestionCents,
  monthsUntil,
  progressPercent,
  remainingCents,
} from './savingsGoals.types';

describe('progressPercent', () => {
  it('returns 0 when the target is not positive', () => {
    expect(progressPercent(50, 0)).toBe(0);
  });

  it('rounds the coverage percent and caps at 100', () => {
    expect(progressPercent(50_000, 100_000)).toBe(50);
    expect(progressPercent(150_000, 100_000)).toBe(100);
  });
});

describe('remainingCents', () => {
  it('does not go below zero', () => {
    expect(remainingCents(100_000, 40_000)).toBe(60_000);
    expect(remainingCents(100_000, 140_000)).toBe(0);
  });
});

describe('monthsUntil', () => {
  const now = new Date('2026-09-02T00:00:00.000Z');

  it('returns null when the target is in the past', () => {
    expect(monthsUntil(new Date('2026-08-01T00:00:00.000Z'), now)).toBeNull();
  });

  it('counts remaining calendar months with a one-month minimum', () => {
    expect(monthsUntil(new Date('2028-09-02T00:00:00.000Z'), now)).toBe(24);
    expect(monthsUntil(new Date('2026-10-01T00:00:00.000Z'), now)).toBe(1);
  });
});

describe('monthlySuggestionCents', () => {
  const now = new Date('2026-09-02T00:00:00.000Z');

  it('returns null without a usable future date', () => {
    expect(monthlySuggestionCents(10_000, null, now)).toBeNull();
    expect(
      monthlySuggestionCents(10_000, new Date('2026-08-01T00:00:00.000Z'), now),
    ).toBeNull();
  });

  it('ceils remaining amount across remaining months', () => {
    expect(
      monthlySuggestionCents(24_001, new Date('2028-09-02T00:00:00.000Z'), now),
    ).toBe(1001);
  });
});

describe('form mappers', () => {
  it('omits empty currency and converts a date input to ISO', () => {
    expect(
      eventFormToCreateInput({
        ...emptySavingsGoalEventForm(),
        name: '  The wedding  ',
        targetDate: '2028-06-01',
      }),
    ).toEqual({
      name: 'The wedding',
      targetDate: '2028-06-01T00:00:00.000Z',
    });
  });

  it('converts item amounts to cents', () => {
    expect(
      itemFormToCreateInput({
        name: 'Wedding suit',
        amount: '2500.50',
        targetDate: '',
      }),
    ).toEqual({
      name: 'Wedding suit',
      targetAmountCents: 250_050,
      targetDate: null,
    });
  });

  it('maps a contribution form to GraphQL input', () => {
    expect(
      contributionFormToInput({
        amount: '500',
        occurredOn: '2026-06-01',
        note: '  June deposit  ',
      }),
    ).toEqual({
      amountCents: 50_000,
      occurredOn: '2026-06-01T00:00:00.000Z',
      note: 'June deposit',
    });
  });

  it('returns null for a blank date input', () => {
    expect(dateInputToIso('  ')).toBeNull();
  });
});
