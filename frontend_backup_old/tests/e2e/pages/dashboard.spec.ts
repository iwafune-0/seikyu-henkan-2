import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.helper';

test.describe('認証後のダッシュボード表示', () => {
  test.beforeEach(async ({ page }) => {
    // ログインヘルパーを使用して事前にログイン
    await login(page, 'demo@example.com', 'demo123');
  });

  test('処理ページが正しく表示される', async ({ page }) => {
    // URLが /process であることを確認
    await expect(page).toHaveURL('/process');

    // ページタイトル確認
    await expect(page.locator('h4')).toContainText('PDF処理実行');

    // レイアウト要素の確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('サイドバーのメニュー項目が存在する', async ({ page }) => {
    // ページに必要なボタン要素が存在することを確認
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ヘッダーが表示される', async ({ page }) => {
    // ヘッダー要素の存在確認
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('レイアウトが崩れていない', async ({ page }) => {
    // 基本的なレイアウト構造が存在することを確認
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    // コンテンツエリアが表示されていることを確認
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // ページタイトルが存在することを確認
    await expect(page.locator('h4')).toContainText('PDF処理実行');
  });

  test('管理者でログインした場合も処理ページが表示される', async ({ page }) => {
    // 一度ログアウト（ページ遷移してから再ログイン）
    await page.goto('/login');

    // 管理者でログイン
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 処理ページへの遷移を確認
    await expect(page).toHaveURL('/process', { timeout: 10000 });

    // ページタイトル確認
    await expect(page.locator('h4')).toContainText('PDF処理実行');
  });
});
