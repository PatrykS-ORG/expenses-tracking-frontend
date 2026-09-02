import { useEffect, type ReactNode } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Auth } from './components/Auth';
import { BlockingLoaderHost } from './components/BlockingLoaderHost';
import { Analytics } from './pages/Analytics';
import { BudgetPlanner } from './pages/BudgetPlanner';
import { LongTermSavings } from './pages/LongTermSavings';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { ReceiptScanner } from './pages/ReceiptScanner';
import { Settings } from './pages/Settings';
import { AppLayout } from './components/AppLayout';

function AuthBootstrap({ children }: { children: ReactNode }) {
  const { isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return children;
}

function RootLayout() {
  return (
    <>
      <Outlet />
      <BlockingLoaderHost />
    </>
  );
}

function ProtectedLayout() {
  const session = useAuthStore((state) => state.session);
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <AppLayout />;
}

function AuthRoute() {
  const session = useAuthStore((state) => state.session);
  if (session) {
    return <Navigate to="/" replace />;
  }
  return <Auth />;
}

function CatchAll() {
  const session = useAuthStore((state) => state.session);
  return <Navigate to={session ? '/' : '/auth'} replace />;
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/auth',
        element: <AuthRoute />,
      },
      {
        element: <ProtectedLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/onboarding', element: <Onboarding /> },
          { path: '/receipt-scan', element: <ReceiptScanner /> },
          { path: '/analytics', element: <Analytics /> },
          { path: '/budget', element: <BudgetPlanner /> },
          { path: '/savings-goals', element: <LongTermSavings /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
      {
        path: '*',
        element: <CatchAll />,
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  );
}
