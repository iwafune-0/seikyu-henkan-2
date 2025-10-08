import { Page } from '@playwright/test';

/**
 * ログインヘルパー関数
 *
 * @param page - Playwrightのページオブジェクト
 * @param email - ログインメールアドレス（デフォルト: demo@example.com）
 * @param password - ログインパスワード（デフォルト: demo123）
 */
export async function login(
  page: Page,
  email: string = 'demo@example.com',
  password: string = 'demo123'
): Promise<void> {
  // ログインページに遷移
  await page.goto('/login');

  // メールアドレス入力
  await page.fill('input[type="email"]', email);

  // パスワード入力
  await page.fill('input[type="password"]', password);

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // 処理ページへの遷移を待機
  await page.waitForURL('/process', { timeout: 10000 });
}
