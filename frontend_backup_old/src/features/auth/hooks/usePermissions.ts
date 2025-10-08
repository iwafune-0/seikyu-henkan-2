import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

/**
 * 権限チェックフック
 *
 * ユーザーの権限に基づいた表示制御や機能制限を行う
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * 指定されたロールを持っているかチェック
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * 管理者かどうか
   */
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  /**
   * 一般ユーザーかどうか
   */
  const isUser = (): boolean => {
    return hasRole('user');
  };

  /**
   * いずれかのロールを持っているかチェック
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  return {
    hasRole,
    isAdmin,
    isUser,
    hasAnyRole,
  };
}
