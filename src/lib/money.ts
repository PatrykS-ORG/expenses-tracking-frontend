export function centsToAmountString(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absCents = Math.abs(Math.round(cents));
  const whole = Math.floor(absCents / 100);
  const fraction = absCents % 100;
  return `${sign}${whole}.${String(fraction).padStart(2, '0')}`;
}

export function amountStringToCents(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '' || normalized === '-') return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatCentsAsCurrency(
  cents: number,
  currency: string,
  locale: string,
): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
