import { APP_NAME, LOGO_SRC } from '../lib/constants';

type SpendwellLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Kept for call-site clarity; transparent PNG already shows the parent background. */
  inheritBackground?: boolean;
  className?: string;
};

/** Height scale for the stacked ~4:3 mark (icon + wordmark + tagline). */
const logoSizes = {
  xs: 'h-14',
  sm: 'h-20',
  md: 'h-28 sm:h-32 lg:h-40',
  lg: 'h-40 sm:h-48',
  xl: 'h-40 sm:h-48 lg:h-58',
};

export function SpendwellLogo({
  size = 'md',
  inheritBackground = false,
  className = '',
}: SpendwellLogoProps) {
  void inheritBackground;

  return (
    <img
      src={LOGO_SRC}
      alt={APP_NAME}
      className={`block w-auto max-w-full object-contain ${logoSizes[size]} ${className}`}
    />
  );
}
