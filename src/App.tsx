import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { Auth } from './components/Auth'
import { Dashboard } from './pages/Dashboard'
import { Onboarding } from './pages/Onboarding'

export default function App() {
  const { session, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={session ? <Dashboard /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/auth" 
          element={!session ? <Auth /> : <Navigate to="/" />} 
        />
        <Route 
          path="/onboarding" 
          element={session ? <Onboarding /> : <Navigate to="/auth" />} 
        />
      </Routes>
    </Router>
  )
}
