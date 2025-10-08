import type { User } from '@/types';

/**
 * モックユーザーデータ
 *
 * デモアカウント（開発・テスト用）
 */
export const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'user-001',
    email: 'demo@example.com',
    password: 'demo123',
    role: 'user',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'admin-001',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    created_at: '2025-01-01T00:00:00Z',
  },
];

/**
 * メールアドレスからユーザーを検索
 */
export function findUserByEmail(email: string) {
  return MOCK_USERS.find((user) => user.email === email);
}

/**
 * IDからユーザーを検索
 */
export function findUserById(id: string) {
  return MOCK_USERS.find((user) => user.id === id);
}
