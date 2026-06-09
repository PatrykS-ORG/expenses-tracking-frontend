import { APP_NAME } from '../lib/constants';

type SpendwellLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light';
  showWordmark?: boolean;
  className?: string;
};

const iconSizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const wordmarkSizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export function SpendwellLogo({
  size = 'md',
  variant = 'default',
  showWordmark = true,
  className = '',
}: SpendwellLogoProps) {
  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl shadow-sm ${iconSizes[size]} ${
          isLight
            ? 'bg-white/15 ring-1 ring-white/20'
            : 'bg-blue-600 shadow-blue-600/20'
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={
            size === 'lg' ? 'h-9 w-9' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5'
          }
        >
          <path
            d="M8 12.5C8 10.0147 10.0147 8 12.5 8H19.5C21.9853 8 24 10.0147 24 12.5V19.5C24 21.9853 21.9853 24 19.5 24H12.5C10.0147 24 8 21.9853 8 19.5V12.5Z"
            className={isLight ? 'fill-white' : 'fill-white'}
          />
          <path
            d="M11 14.5H21"
            stroke={isLight ? '#2563eb' : '#2563eb'}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M14 18.5L16.5 21L21 15.5"
            stroke={isLight ? '#2563eb' : '#2563eb'}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="22.5"
            cy="11"
            r="3.25"
            className={isLight ? 'fill-emerald-300' : 'fill-emerald-400'}
          />
        </svg>
      </div>
      {showWordmark && (
        <span
          className={`font-bold tracking-tight ${wordmarkSizes[size]} ${
            isLight ? 'text-white' : 'text-slate-900'
          }`}
        >
          {APP_NAME}
        </span>
      )}
    </div>
  );
}
