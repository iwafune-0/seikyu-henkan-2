/**
 * セキュアストレージ管理
 *
 * 認証トークンとユーザー情報の永続化を管理
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * トークンを保存
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * トークンを取得
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * トークンを削除
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * ユーザー情報を保存
 */
export function setUser(user: object): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * ユーザー情報を取得
 */
export function getUser<T>(): T | null {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user) as T;
  } catch {
    return null;
  }
}

/**
 * ユーザー情報を削除
 */
export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

/**
 * 全ての認証情報をクリア
 */
export function clearAuth(): void {
  removeToken();
  removeUser();
}
