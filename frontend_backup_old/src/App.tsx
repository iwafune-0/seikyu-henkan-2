import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './features/auth';
import { ProtectedRoute } from './features/auth';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout';

// Public pages
import { LoginPage } from './pages/public/LoginPage';
import { InviteAcceptPage } from './pages/public/InviteAcceptPage';
import { PasswordResetPage } from './pages/public/PasswordResetPage';

// User pages
import { DashboardPage } from './pages/user/DashboardPage';
import { ProcessPage } from './pages/user/ProcessPage';
import { HistoryPage } from './pages/user/HistoryPage';

// Admin pages
import { UsersPage } from './pages/admin/UsersPage';
import { CompaniesPage } from './pages/admin/CompaniesPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/invite-accept" element={<InviteAcceptPage />} />
              <Route path="/password-reset" element={<PasswordResetPage />} />
            </Route>

            {/* Authenticated routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect root to process page */}
              <Route path="/" element={<Navigate to="/process" replace />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* User & Admin accessible */}
              <Route path="/process" element={<ProcessPage />} />
              <Route path="/history" element={<HistoryPage />} />

              {/* Admin only */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CompaniesPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
