import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '@/types';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * ルート保護コンポーネント
 *
 * 認証が必要なルートを保護し、未認証の場合はログインページにリダイレクト
 * 権限が不足している場合は403ページにリダイレクト
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user } = useAuth();

  // 認証状態をチェック中
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // 未認証の場合、ログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 権限チェック
  if (requiredRole && user?.role !== requiredRole) {
    // 権限が不足している場合、403ページにリダイレクト
    // TODO: 403ページを作成したら以下のパスに変更
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
