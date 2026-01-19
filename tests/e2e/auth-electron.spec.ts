/**
 * P-001: 認証ページ E2Eテスト（Electron版専用）
 *
 * APP_MODE=electron 時のみ表示される機能のテスト
 * - 「パスワードをお忘れですか？」ダイアログ表示
 * - 管理者連絡先の表示
 * - ダイアログを閉じる（ボタン/オーバーレイ）
 *
 * APIレスポンスをモックしてElectronモードをシミュレート
 */
import { test, expect, type Page } from '@playwright/test'

// 管理者連絡先（LoginPage.tsxと同じ値）
const ADMIN_CONTACT = {
  name: '岩船',
  email: 'iwafune-hiroko@terracom.co.jp',
}

/**
 * APP_MODEをelectronにモックする
 */
async function mockElectronMode(page: Page) {
  // 認証後のAPI（/api/users/app-mode）
  await page.route('**/api/users/app-mode', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { mode: 'electron' },
        message: 'アプリケーションモードを取得しました',
      }),
    })
  })

  // 認証前のAPI（/api/public/app-mode）- シンプルな形式
  await page.route('**/api/public/app-mode', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'electron',
      }),
    })
  })
}

/**
 * P-001 Electron版: 認証ページ
 */
test.describe('P-001 Electron版: 認証ページ', () => {
  // 各テスト前にElectronモードモック
  test.beforeEach(async ({ page }) => {
    // Electronモードをモック（ページ遷移前に設定）
    await mockElectronMode(page)

    // ログインページに遷移
    await page.goto('/login')

    // appModeが反映されるまで待機
    await page.waitForTimeout(500)
  })

  // E2E-AUTH-041: 「パスワードをお忘れですか？」ダイアログ表示
  test('E2E-AUTH-041: 「パスワードをお忘れですか？」ダイアログ表示', async ({ page }) => {
    // 「パスワードをお忘れですか？」リンクをクリック
    await page.click('text=パスワードをお忘れですか？')

    // ダイアログが表示されることを確認
    const dialog = page.locator('text=パスワードをお忘れの方へ')
    await expect(dialog).toBeVisible()

    // パスワードリセットページに遷移していないことを確認
    await expect(page).toHaveURL('/login')
  })

  // E2E-AUTH-042: 管理者連絡先の表示確認
  test('E2E-AUTH-042: 管理者連絡先の表示確認', async ({ page }) => {
    // 「パスワードをお忘れですか？」リンクをクリック
    await page.click('text=パスワードをお忘れですか？')

    // ダイアログが表示されることを確認
    await expect(page.locator('text=パスワードをお忘れの方へ')).toBeVisible()

    // 管理者連絡先が表示されることを確認
    await expect(page.locator(`text=${ADMIN_CONTACT.name}`)).toBeVisible()
    await expect(page.locator(`text=${ADMIN_CONTACT.email}`)).toBeVisible()

    // 説明文が表示されることを確認
    await expect(page.locator('text=パスワードをお忘れの場合は、管理者にご連絡ください')).toBeVisible()
  })

  // E2E-AUTH-043: ダイアログ閉じる（ボタン）
  test('E2E-AUTH-043a: ダイアログ閉じる - ボタンクリック', async ({ page }) => {
    // 「パスワードをお忘れですか？」リンクをクリック
    await page.click('text=パスワードをお忘れですか？')

    // ダイアログが表示されることを確認
    const dialogTitle = page.locator('text=パスワードをお忘れの方へ')
    await expect(dialogTitle).toBeVisible()

    // 「閉じる」ボタンをクリック
    await page.click('button:has-text("閉じる")')

    // ダイアログが閉じることを確認
    await expect(dialogTitle).not.toBeVisible()
  })

  // E2E-AUTH-043: ダイアログ閉じる（オーバーレイ）
  test('E2E-AUTH-043b: ダイアログ閉じる - オーバーレイクリック', async ({ page }) => {
    // 「パスワードをお忘れですか？」リンクをクリック
    await page.click('text=パスワードをお忘れですか？')

    // ダイアログが表示されることを確認
    const dialogTitle = page.locator('text=パスワードをお忘れの方へ')
    await expect(dialogTitle).toBeVisible()

    // オーバーレイ（背景）をクリック
    // ダイアログの外側をクリックするため、座標指定
    await page.click('.fixed.inset-0.bg-black\\/50', { position: { x: 10, y: 10 } })

    // ダイアログが閉じることを確認
    await expect(dialogTitle).not.toBeVisible()
  })
})
