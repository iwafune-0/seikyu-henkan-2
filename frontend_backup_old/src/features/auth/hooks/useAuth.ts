import { useAuthContext } from '../contexts/AuthContext';

/**
 * 認証フック
 *
 * 認証状態と認証操作へのアクセスを提供
 */
export function useAuth() {
  return useAuthContext();
}
