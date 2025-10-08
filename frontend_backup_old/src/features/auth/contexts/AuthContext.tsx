import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest } from '@/types';
import * as authService from '../services/mockAuthService';
import * as storage from '../utils/storage.utils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 認証プロバイダー
 *
 * アプリケーション全体で認証状態を共有
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 認証状態をチェック（初回マウント時）
   */
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = storage.getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const currentUser = await authService.getCurrentUser(token);
      setUser(currentUser);
    } catch (error) {
      console.error('認証チェックエラー:', error);
      storage.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ログイン
   */
  const login = async (request: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(request);
      storage.setToken(response.token);
      storage.setUser(response.user);
      setUser(response.user);
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ログアウト
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      storage.clearAuth();
      setUser(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生してもローカルの認証情報はクリアする
      storage.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回マウント時に認証状態をチェック
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストを使用するカスタムフック
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
