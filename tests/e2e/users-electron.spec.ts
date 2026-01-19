/**
 * P-004: ユーザー管理ページ E2Eテスト（Electron版専用）
 *
 * APP_MODE=electron 時のみ表示される機能のテスト
 * - 新規ユーザー直接作成
 * - パスワード直接リセット
 *
 * APIレスポンスをモックしてElectronモードをシミュレート
 */
import { test, expect, type Page } from '@playwright/test'
import { createTestUser, deleteTestUserByEmail, cleanupAllE2ETestUsers } from './helpers/supabase-admin'

// テスト用認証情報
const TEST_ADMIN = {
  email: 'iwafune-hiroko@terracom.co.jp',
  password: 'IwafuneTerra2025',
}

// テスト用ユーザー（直接作成テスト用）
const TEST_CREATE_USER = {
  email: 'e2e-electron-create-test@example.com',
  password: 'TestPass123',
}

// テスト用ユーザー（パスワードリセットテスト用）
const TEST_RESET_USER = {
  email: 'e2e-electron-reset-test@example.com',
  password: 'OldPass123',
  newPassword: 'NewPass456',
}

/**
 * APP_MODEをelectronにモックする
 */
async function mockElectronMode(page: Page) {
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

  await page.route('**/api/public/app-mode', async (route) => {
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
}

/**
 * P-004 Electron版: ユーザー管理ページ
 */
test.describe('P-004 Electron版: ユーザー管理ページ', () => {
  // データベース操作の競合を避けるため、全テストをシリアル実行
  test.describe.configure({ mode: 'serial' })

  // テスト前のクリーンアップ
  test.beforeAll(async () => {
    await deleteTestUserByEmail(TEST_CREATE_USER.email)
    await deleteTestUserByEmail(TEST_RESET_USER.email)
  })

  // テスト後のクリーンアップ
  test.afterAll(async () => {
    await deleteTestUserByEmail(TEST_CREATE_USER.email)
    await deleteTestUserByEmail(TEST_RESET_USER.email)
  })

  // 各テスト前にログイン + Electronモードモック
  test.beforeEach(async ({ page }) => {
    // Electronモードをモック
    await mockElectronMode(page)

    // ストレージをクリア
    await page.context().clearCookies()
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // ログイン
    await page.fill('#email', TEST_ADMIN.email)
    await page.fill('#password', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // ログイン完了を待機
    await expect(page).toHaveURL(/\/process/, { timeout: 15000 })
  })

  test.describe('新規ユーザー直接作成', () => {
    // E2E-USER-023: 正常系 - ユーザー直接作成成功
    test('E2E-USER-023: 新規ユーザー直接作成（正常系）', async ({ page }) => {
      // クリーンアップ（テスト開始前に確実に削除）
      await deleteTestUserByEmail(TEST_CREATE_USER.email)

      await page.goto('/users')

      // 「新規ユーザーを追加」ボタンが表示されることを確認（Electronモード）
      const addButton = page.getByRole('button', { name: /新規ユーザーを追加/ })
      await expect(addButton).toBeVisible()

      // ボタンをクリック
      await addButton.click()

      // モーダルが表示されることを確認
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      await expect(modal.getByText('新規ユーザーを追加')).toBeVisible()

      // 入力
      await modal.locator('input[type="email"], input[name="email"]').fill(TEST_CREATE_USER.email)
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill(TEST_CREATE_USER.password)
      await passwordInputs.nth(1).fill(TEST_CREATE_USER.password)

      // 作成ボタンをクリック
      await modal.getByRole('button', { name: /作成|追加/ }).click()

      // 成功メッセージを確認
      await expect(page.locator('[role="alert"]').filter({ hasText: /作成しました|追加しました/ })).toBeVisible({ timeout: 10000 })

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible()

      // 一覧に新しいユーザーが表示されることを確認
      await expect(page.getByText(TEST_CREATE_USER.email)).toBeVisible()
    })

    // E2E-USER-024: キャンセルボタンで閉じる
    test('E2E-USER-024: 新規ユーザー直接作成 - キャンセルボタンで閉じる', async ({ page }) => {
      await page.goto('/users')

      // モーダルを開く
      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // キャンセルボタンをクリック
      await modal.getByRole('button', { name: /キャンセル/ }).click()

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible()
    })

    // E2E-USER-025: メールアドレス未入力エラー
    test('E2E-USER-025: 新規ユーザー直接作成 - メールアドレス未入力エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // メールアドレスを入力せずに作成ボタンをクリック
      await modal.getByRole('button', { name: /作成|追加/ }).click()

      // エラーメッセージを確認
      await expect(page.locator('[role="alert"]').filter({ hasText: /メールアドレスを入力/ })).toBeVisible()
    })

    // E2E-USER-026: 登録済みメールアドレスエラー
    test('E2E-USER-026: 新規ユーザー直接作成 - 登録済みメールアドレスエラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // 既存のメールアドレスを入力
      await modal.locator('input[type="email"], input[name="email"]').fill(TEST_ADMIN.email)
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('TestPass123')
      await passwordInputs.nth(1).fill('TestPass123')

      // 作成ボタンをクリック
      await modal.getByRole('button', { name: /作成|追加/ }).click()

      // エラーメッセージを確認
      await expect(page.locator('[role="alert"]').filter({ hasText: /既に登録/ })).toBeVisible({ timeout: 10000 })
    })

    // E2E-USER-027: パスワード未入力エラー
    test('E2E-USER-027: 新規ユーザー直接作成 - パスワード未入力エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // メールアドレスのみ入力
      await modal.locator('input[type="email"], input[name="email"]').fill('test@example.com')

      // 作成ボタンをクリック
      await modal.getByRole('button', { name: /作成|追加/ }).click()

      // エラーメッセージを確認
      await expect(page.locator('[role="alert"]').filter({ hasText: /パスワードを入力/ })).toBeVisible()
    })

    // E2E-USER-028: パスワード8文字未満エラー
    test('E2E-USER-028: 新規ユーザー直接作成 - パスワード8文字未満エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      await modal.locator('input[type="email"], input[name="email"]').fill('test@example.com')
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('short1')
      await passwordInputs.nth(1).fill('short1')

      await modal.getByRole('button', { name: /作成|追加/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /8文字以上/ })).toBeVisible()
    })

    // E2E-USER-029: パスワード英数字以外エラー
    test('E2E-USER-029: 新規ユーザー直接作成 - パスワード英数字以外エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      await modal.locator('input[type="email"], input[name="email"]').fill('test@example.com')
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('password123!')
      await passwordInputs.nth(1).fill('password123!')

      await modal.getByRole('button', { name: /作成|追加/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /英数字のみ/ })).toBeVisible()
    })

    // E2E-USER-030: パスワード英字・数字両方必須エラー
    test('E2E-USER-030: 新規ユーザー直接作成 - パスワード英字・数字両方必須エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      await modal.locator('input[type="email"], input[name="email"]').fill('test@example.com')
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('12345678')  // 数字のみ
      await passwordInputs.nth(1).fill('12345678')

      await modal.getByRole('button', { name: /作成|追加/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /英字と数字の両方/ })).toBeVisible()
    })

    // E2E-USER-031: パスワード確認未入力エラー
    test('E2E-USER-031: 新規ユーザー直接作成 - パスワード確認未入力エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      await modal.locator('input[type="email"], input[name="email"]').fill('test@example.com')
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('TestPass123')
      // 確認パスワードは未入力

      await modal.getByRole('button', { name: /作成|追加/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /確認.*入力/ })).toBeVisible()
    })

    // E2E-USER-032: パスワード確認不一致エラー
    test('E2E-USER-032: 新規ユーザー直接作成 - パスワード確認不一致エラー', async ({ page }) => {
      await page.goto('/users')

      await page.getByRole('button', { name: /新規ユーザーを追加/ }).click()
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      await modal.locator('input[type="email"], input[name="email"]').fill('test@example.com')
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('TestPass123')
      await passwordInputs.nth(1).fill('DifferentPass456')

      await modal.getByRole('button', { name: /作成|追加/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /一致しません/ })).toBeVisible()
    })
  })

  test.describe('パスワード直接リセット', () => {
    // テスト用ユーザーを事前作成
    test.beforeAll(async () => {
      await deleteTestUserByEmail(TEST_RESET_USER.email)
      await createTestUser(TEST_RESET_USER.email, TEST_RESET_USER.password, 'user')
    })

    test.afterAll(async () => {
      await deleteTestUserByEmail(TEST_RESET_USER.email)
    })

    // E2E-USER-033: 正常系 - パスワード直接リセット成功
    test('E2E-USER-033: パスワード直接リセット（正常系）', async ({ page }) => {
      await page.goto('/users')

      // テスト対象ユーザーの行を探す
      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()

      // パスワードリセットボタンをクリック（デスクトップ: PW変更, モバイル: パスワード変更）
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      // モーダルが表示されることを確認
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // 新しいパスワードを入力
      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill(TEST_RESET_USER.newPassword)
      await passwordInputs.nth(1).fill(TEST_RESET_USER.newPassword)

      // リセットボタンをクリック
      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      // 成功メッセージを確認
      await expect(page.locator('[role="alert"]').filter({ hasText: /リセットしました|変更しました/ })).toBeVisible({ timeout: 10000 })

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible()
    })

    // E2E-USER-034: キャンセルボタンで閉じる
    test('E2E-USER-034: パスワード直接リセット - キャンセルボタンで閉じる', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // キャンセルボタンをクリック
      await modal.getByRole('button', { name: /キャンセル/ }).click()

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible()
    })

    // E2E-USER-035: 新しいパスワード未入力エラー
    test('E2E-USER-035: パスワード直接リセット - 新しいパスワード未入力エラー', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // パスワード未入力でリセット
      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /パスワードを入力/ })).toBeVisible()
    })

    // E2E-USER-036: パスワード8文字未満エラー
    test('E2E-USER-036: パスワード直接リセット - パスワード8文字未満エラー', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('short1')
      await passwordInputs.nth(1).fill('short1')

      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /8文字以上/ })).toBeVisible()
    })

    // E2E-USER-037: パスワード英数字以外エラー
    test('E2E-USER-037: パスワード直接リセット - パスワード英数字以外エラー', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('password123!')
      await passwordInputs.nth(1).fill('password123!')

      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /英数字のみ/ })).toBeVisible()
    })

    // E2E-USER-038: パスワード英字・数字両方必須エラー
    test('E2E-USER-038: パスワード直接リセット - パスワード英字・数字両方必須エラー', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('12345678')
      await passwordInputs.nth(1).fill('12345678')

      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /英字と数字の両方/ })).toBeVisible()
    })

    // E2E-USER-039: パスワード確認未入力エラー
    test('E2E-USER-039: パスワード直接リセット - パスワード確認未入力エラー', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('NewPass456')
      // 確認は未入力

      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /確認.*入力/ })).toBeVisible()
    })

    // E2E-USER-040: パスワード確認不一致エラー
    test('E2E-USER-040: パスワード直接リセット - パスワード確認不一致エラー', async ({ page }) => {
      await page.goto('/users')

      const userRow = page.locator('tr, [role="listitem"]').filter({ hasText: TEST_RESET_USER.email })
      await expect(userRow).toBeVisible()
      await userRow.getByRole('button', { name: /PW変更|パスワード変更/ }).click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      const passwordInputs = modal.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('NewPass456')
      await passwordInputs.nth(1).fill('DifferentPass789')

      await modal.getByRole('button', { name: /リセット|変更/ }).click()

      await expect(page.locator('[role="alert"]').filter({ hasText: /一致しません/ })).toBeVisible()
    })
  })
})
