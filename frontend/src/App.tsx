import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

// Main pages
import { ProcessPage } from '@/pages/process/ProcessPage'
import { HistoryPage } from '@/pages/history/HistoryPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { CompaniesPage } from '@/pages/companies/CompaniesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/process"
          element={
            <ProtectedRoute>
              <ProcessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute adminOnly>
              <CompaniesPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
