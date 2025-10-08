import { test, expect } from '@playwright/test';

test.describe('ログイン機能', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに遷移
    await page.goto('/login');
  });

  test('ログインフォームが正しく表示される', async ({ page }) => {
    // フォーム要素の存在確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // デモアカウント情報の表示確認
    await expect(page.getByText('demo@example.com / demo123')).toBeVisible();
    await expect(page.getByText('admin@example.com / admin123')).toBeVisible();
  });

  test('一般ユーザーでログインできる', async ({ page }) => {
    // メールアドレス入力
    await page.fill('input[type="email"]', 'demo@example.com');

    // パスワード入力
    await page.fill('input[type="password"]', 'demo123');

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // 処理ページへの遷移を確認（最大10秒待機）
    await expect(page).toHaveURL('/process', { timeout: 10000 });
  });

  test('管理者でログインできる', async ({ page }) => {
    // メールアドレス入力
    await page.fill('input[type="email"]', 'admin@example.com');

    // パスワード入力
    await page.fill('input[type="password"]', 'admin123');

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // 処理ページへの遷移を確認（最大10秒待機）
    await expect(page).toHaveURL('/process', { timeout: 10000 });
  });

  test('誤った認証情報でログインできない', async ({ page }) => {
    // メールアドレス入力
    await page.fill('input[type="email"]', 'invalid@example.com');

    // パスワード入力
    await page.fill('input[type="password"]', 'wrongpassword');

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // エラーメッセージの表示を確認（URLは変わらない）
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});
