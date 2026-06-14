import { APP_NAME, LOGO_SRC } from '../lib/constants';

type SpendwellLogoProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Kept for call-site clarity; transparent PNG already shows the parent background. */
  inheritBackground?: boolean;
  className?: string;
};

const logoSizes = {
  xs: 'h-10',
  sm: 'h-20',
  md: 'h-24',
  lg: 'h-36',
  xl: 'h-44',
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
      className={`block w-auto ${logoSizes[size]} ${className}`}
    />
  );
}
