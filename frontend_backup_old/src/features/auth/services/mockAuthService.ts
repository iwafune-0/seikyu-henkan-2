import type { User, LoginRequest, LoginResponse } from '@/types';
import { findUserByEmail } from '@/services/mock/data/users';

/**
 * モック認証サービス
 *
 * 実際のSupabase Auth連携前に使用するモック実装
 */

/**
 * ログイン（モック）
 */
export async function login(
  request: LoginRequest
): Promise<LoginResponse> {
  // 意図的な遅延（実際のAPI呼び出しをシミュレート）
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = findUserByEmail(request.email);

  // ユーザーが存在しない、またはパスワードが一致しない
  if (!user || user.password !== request.password) {
    throw new Error('メールアドレスまたはパスワードが正しくありません');
  }

  // パスワードを除外したユーザー情報
  const { password: _, ...userWithoutPassword } = user;

  // モックトークンを生成（実際にはJWTを使用）
  const token = `mock_token_${user.id}_${Date.now()}`;

  return {
    user: userWithoutPassword as User,
    token,
  };
}

/**
 * ログアウト（モック）
 */
export async function logout(): Promise<void> {
  // 意図的な遅延
  await new Promise((resolve) => setTimeout(resolve, 300));
  // モックなので何もしない
}

/**
 * 現在のユーザーを取得（モック）
 */
export async function getCurrentUser(token: string): Promise<User> {
  // 意図的な遅延
  await new Promise((resolve) => setTimeout(resolve, 300));

  // トークンからユーザーIDを抽出（簡易的な実装）
  const match = token.match(/mock_token_([^_]+)_/);
  if (!match) {
    throw new Error('無効なトークンです');
  }

  const userId = match[1];
  const user = findUserByEmail(
    userId === 'user-001' ? 'demo@example.com' : 'admin@example.com'
  );

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}
