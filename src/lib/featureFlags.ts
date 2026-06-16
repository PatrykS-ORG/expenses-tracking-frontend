function isEnabled(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const featureFlags = {
  nextcloud: isEnabled(import.meta.env.VITE_FEATURE_NEXTCLOUD),
} as const;
