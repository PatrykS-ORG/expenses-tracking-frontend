import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalendarContextStore } from './useCalendarContextStore';

describe('useCalendarContextStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-26T10:00:00.000Z'));
    useCalendarContextStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes a new session to the current year and month', () => {
    useCalendarContextStore.getState().initialize('Europe/Warsaw');
    expect(useCalendarContextStore.getState()).toMatchObject({
      initialized: true,
      timezone: 'Europe/Warsaw',
      selectedYear: 2026,
      selectedMonth: 9,
    });
  });

  it('keeps the selection when the timezone is refreshed in the same session', () => {
    const store = useCalendarContextStore.getState();
    store.initialize('Europe/Warsaw');
    store.setMonth(3);
    useCalendarContextStore.getState().initialize('UTC');
    expect(useCalendarContextStore.getState()).toMatchObject({
      timezone: 'UTC',
      selectedYear: 2026,
      selectedMonth: 3,
    });
  });

  it('resets the month to January when the year changes', () => {
    vi.setSystemTime(new Date('2027-02-02T10:00:00.000Z'));
    const store = useCalendarContextStore.getState();
    store.initialize('Europe/Warsaw');
    store.setMonth(2);
    useCalendarContextStore.getState().setYear(2026);
    expect(useCalendarContextStore.getState()).toMatchObject({
      selectedYear: 2026,
      selectedMonth: 1,
    });
  });

  it('ignores future years and months that have not started', () => {
    const store = useCalendarContextStore.getState();
    store.initialize('Europe/Warsaw');
    store.setYear(2027);
    store.setMonth(12);
    expect(useCalendarContextStore.getState()).toMatchObject({
      selectedYear: 2026,
      selectedMonth: 9,
    });
  });

  it('allows every month of a past year after a fresh initialization in a later year', () => {
    vi.setSystemTime(new Date('2027-02-02T10:00:00.000Z'));
    const store = useCalendarContextStore.getState();
    store.initialize('Europe/Warsaw');
    store.setYear(2026);
    store.setMonth(12);
    expect(useCalendarContextStore.getState()).toMatchObject({
      selectedYear: 2026,
      selectedMonth: 12,
    });
  });

  it('clears the session selection on reset', () => {
    useCalendarContextStore.getState().initialize('Europe/Warsaw');
    useCalendarContextStore.getState().reset();
    expect(useCalendarContextStore.getState().initialized).toBe(false);
  });
});
