import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'

// dayjsのグローバルロケールを日本語に設定
dayjs.locale('ja')

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

// Main pages
import { ProcessPage } from '@/pages/process/ProcessPage'
import { HistoryPage } from '@/pages/history/HistoryPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { CompaniesPage } from '@/pages/companies/CompaniesPage'

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return <Navigate to={isAuthenticated ? '/process' : '/login'} replace />
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
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

          {/* Default redirect - check auth state first */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  )
}

export default App
