import { describe, expect, it } from 'vitest';
import {
  clampAllocationInput,
  isValidAllocationAmount,
  remainingToAllocate,
} from './monthClose.types';

describe('remainingToAllocate', () => {
  it('returns the leftover after drafted allocations', () => {
    expect(
      remainingToAllocate(50_000, [
        { amountCents: 10_000 },
        { amountCents: 15_000 },
      ]),
    ).toBe(25_000);
  });

  it('returns the full leftover when nothing is allocated', () => {
    expect(remainingToAllocate(50_000, [])).toBe(50_000);
  });
});

describe('clampAllocationInput', () => {
  it('keeps values at or below the leftover', () => {
    expect(clampAllocationInput('12.50', 285_000)).toBe('12.50');
    expect(clampAllocationInput('', 285_000)).toBe('');
  });

  it('caps values above the leftover', () => {
    expect(clampAllocationInput('20000', 285_000)).toBe('2850.00');
    expect(clampAllocationInput('2850.01', 285_000)).toBe('2850.00');
  });
});

describe('isValidAllocationAmount', () => {
  it('rejects zero, negative, and over-remaining amounts', () => {
    expect(isValidAllocationAmount(0, 285_000)).toBe(false);
    expect(isValidAllocationAmount(285_001, 285_000)).toBe(false);
    expect(isValidAllocationAmount(285_000, 285_000)).toBe(true);
  });
});
