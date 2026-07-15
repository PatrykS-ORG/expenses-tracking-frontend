import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Auth } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { ReceiptScanner } from './pages/ReceiptScanner';
import { Settings } from './pages/Settings';
import { AppLayout } from './components/AppLayout';

export default function App() {
  const { session, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={!session ? <Auth /> : <Navigate to="/" />}
        />
        <Route
          element={session ? <AppLayout /> : <Navigate to="/auth" replace />}
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/receipt-scan" element={<ReceiptScanner />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={session ? '/' : '/auth'} replace />}
        />
      </Routes>
    </Router>
  );
}
