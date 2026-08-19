import { NavLink, Outlet } from 'react-router-dom';
import {
  ChartLine,
  FileScan,
  LayoutDashboard,
  LogOut,
  Settings,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SpendwellLogo } from './SpendwellLogo';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;

export function AppLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink
            to="/"
            aria-label={t('navigation.dashboard')}
            className="shrink-0"
          >
            <SpendwellLogo size="md" inheritBackground />
          </NavLink>
          <nav className="order-3 flex flex-wrap w-full items-center gap-1 sm:order-none sm:w-auto">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard className="h-4 w-4" />
              {t('navigation.dashboard')}
            </NavLink>
            <NavLink to="/receipt-scan" className={linkClass}>
              <FileScan className="h-4 w-4" />
              {t('navigation.receipts')}
            </NavLink>
            <NavLink to="/analytics" className={linkClass}>
              <ChartLine className="h-4 w-4" />
              {t('navigation.analytics')}
            </NavLink>
            <NavLink to="/budget" className={linkClass}>
              <Wallet className="h-4 w-4" />
              {t('navigation.budget')}
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              <Settings className="h-4 w-4" />
              {t('navigation.settings')}
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden max-w-48 truncate text-sm text-gray-500 lg:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
