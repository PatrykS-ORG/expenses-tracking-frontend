export function getTestNowIso(): string | null {
  if (!import.meta.env.DEV) {
    return null;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  const value = new URLSearchParams(window.location.search).get('testNow');
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function getTestNowDate(): Date {
  const iso = getTestNowIso();
  return iso ? new Date(iso) : new Date();
}
