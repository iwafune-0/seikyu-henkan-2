import type { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import type { UserRole } from '@/types';

interface PermissionGateProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
}

/**
 * 権限ベース表示制御コンポーネント
 *
 * 指定された権限を持つユーザーにのみコンテンツを表示
 */
export function PermissionGate({
  children,
  requiredRole,
  requiredRoles,
  fallback = null,
}: PermissionGateProps) {
  const { hasRole, hasAnyRole } = usePermissions();

  // 単一ロールチェック
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // 複数ロールチェック（いずれか）
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
