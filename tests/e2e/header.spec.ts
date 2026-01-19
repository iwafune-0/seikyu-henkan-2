import { test, expect } from '@playwright/test'

// テスト用認証情報
const TEST_ADMIN = {
  email: 'iwafune-hiroko@terracom.co.jp',
  password: 'IwafuneTerra2025',
}

/**
 * 共通ヘッダー機能 E2Eテスト
 *
 * ユーザーメニュー（ドロップダウン）とパスワード変更ダイアログのテスト
 */
test.describe('共通ヘッダー機能', () => {
  // 各テスト前にログイン状態にする
  test.beforeEach(async ({ page }) => {
    // ストレージをクリア
    await page.context().clearCookies()
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()

    // ログイン
    await page.fill('#email', TEST_ADMIN.email)
    await page.fill('#password', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // /process にリダイレクトされることを確認
    await expect(page).toHaveURL(/\/process/, { timeout: 15000 })
  })

  test.describe('ユーザーメニュー（ドロップダウン）', () => {
    // E2E-HEADER-001: ドロップダウンメニュー表示
    test('E2E-HEADER-001: ドロップダウンメニュー表示（ユーザー名クリック）', async ({ page }) => {
      // デスクトップ表示（1024px以上）
      await page.setViewportSize({ width: 1280, height: 720 })

      // デスクトップ用ヘッダー内のユーザーメニューボタンをクリック
      // hidden lg:block のヘッダー内のボタンを選択
      const desktopHeader = page.locator('header.hidden.lg\\:block')
      const userMenuButton = desktopHeader.locator('button').filter({ hasText: TEST_ADMIN.email })
      await userMenuButton.click()

      // ドロップダウンメニューが表示されることを確認（desktopHeader内で）
      await expect(desktopHeader.locator('text=パスワード変更')).toBeVisible()
      await expect(desktopHeader.locator('text=ログアウト')).toBeVisible()
    })

    // E2E-HEADER-002: ログアウト成功
    test('E2E-HEADER-002: ログアウト成功', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      // ユーザーメニューを開く
      const desktopHeader = page.locator('header.hidden.lg\\:block')
      const userMenuButton = desktopHeader.locator('button').filter({ hasText: TEST_ADMIN.email })
      await userMenuButton.click()

      // ログアウトボタンをクリック
      await desktopHeader.locator('text=ログアウト').click()

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    })

    // E2E-HEADER-003: ドロップダウンを閉じる（外側クリック）
    test('E2E-HEADER-003: ドロップダウンを閉じる（外側クリック）', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      // ユーザーメニューを開く
      const desktopHeader = page.locator('header.hidden.lg\\:block')
      const userMenuButton = desktopHeader.locator('button').filter({ hasText: TEST_ADMIN.email })
      await userMenuButton.click()

      // ドロップダウンが表示されていることを確認
      await expect(desktopHeader.locator('text=パスワード変更')).toBeVisible()

      // メニューの外側（メインコンテンツ）をクリック
      await page.locator('main').click()

      // ドロップダウンが閉じることを確認
      await expect(desktopHeader.locator('text=パスワード変更')).not.toBeVisible()
    })
  })

  test.describe('パスワード変更ダイアログ', () => {
    // ヘルパー関数: ダイアログを開く
    const openChangePasswordDialog = async (page: any) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      const desktopHeader = page.locator('header.hidden.lg\\:block')
      const userMenuButton = desktopHeader.locator('button').filter({ hasText: TEST_ADMIN.email })
      await userMenuButton.click()
      await desktopHeader.locator('text=パスワード変更').click()
      await expect(page.locator('role=dialog')).toBeVisible()
    }

    // E2E-HEADER-004: パスワード変更ダイアログ表示
    test('E2E-HEADER-004: パスワード変更ダイアログ表示', async ({ page }) => {
      await openChangePasswordDialog(page)

      // ダイアログの要素を確認（ラベルを確認）
      const dialog = page.locator('role=dialog')
      await expect(dialog.getByText('パスワード変更')).toBeVisible()
      await expect(dialog.locator('input[type="password"]')).toHaveCount(3)
      await expect(dialog.getByRole('button', { name: 'パスワードを変更' })).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'キャンセル' })).toBeVisible()
    })

    // E2E-HEADER-005: パスワード変更成功（正常系）
    // 注意: このテストは実際にパスワードを変更するため、スキップしています。
    // 手動テストで確認してください。
    test.skip('E2E-HEADER-005: パスワード変更成功（正常系）', async ({ page }) => {
      // 実装するとテストユーザーのパスワードが変更されてしまうため、
      // 必要な場合は一時ユーザーを作成してテストしてください。
    })

    // E2E-HEADER-006: キャンセルボタンで閉じる
    test('E2E-HEADER-006: キャンセルボタンで閉じる', async ({ page }) => {
      await openChangePasswordDialog(page)

      // キャンセルボタンをクリック
      await page.click('button:has-text("キャンセル")')

      // ダイアログが閉じることを確認
      await expect(page.locator('role=dialog')).not.toBeVisible()
    })

    // E2E-HEADER-007: 現在のパスワード未入力エラー
    test('E2E-HEADER-007: 現在のパスワード未入力エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 現在のパスワードを空のまま送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=現在のパスワードを入力してください')).toBeVisible()
    })

    // E2E-HEADER-008: 新しいパスワード未入力エラー
    test('E2E-HEADER-008: 新しいパスワード未入力エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 現在のパスワードのみ入力
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('currentpassword')

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=新しいパスワードを入力してください')).toBeVisible()
    })

    // E2E-HEADER-009: 新しいパスワード8文字未満エラー
    test('E2E-HEADER-009: 新しいパスワード8文字未満エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 入力
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('current123')
      await passwordInputs.nth(1).fill('short1')  // 8文字未満
      await passwordInputs.nth(2).fill('short1')

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認（Alert内）
      await expect(page.locator('[role="alert"]').filter({ hasText: '8文字以上' })).toBeVisible()
    })

    // E2E-HEADER-010: 新しいパスワード英数字以外エラー
    test('E2E-HEADER-010: 新しいパスワード英数字以外エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 入力（記号を含む）
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('current123')
      await passwordInputs.nth(1).fill('password123!')  // 記号を含む
      await passwordInputs.nth(2).fill('password123!')

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認（Alert内）
      await expect(page.locator('[role="alert"]').filter({ hasText: '英数字のみ' })).toBeVisible()
    })

    // E2E-HEADER-011: 新しいパスワード英字・数字両方必須エラー
    test('E2E-HEADER-011: 新しいパスワード英字・数字両方必須エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 入力（数字のみ）
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('current123')
      await passwordInputs.nth(1).fill('12345678')  // 数字のみ
      await passwordInputs.nth(2).fill('12345678')

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=英字と数字の両方')).toBeVisible()
    })

    // E2E-HEADER-012: 新しいパスワード確認未入力エラー
    test('E2E-HEADER-012: 新しいパスワード確認未入力エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 入力（確認は未入力）
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('current123')
      await passwordInputs.nth(1).fill('newpassword123')
      // 確認は未入力

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=一致しません')).toBeVisible()
    })

    // E2E-HEADER-013: 新しいパスワード確認不一致エラー
    test('E2E-HEADER-013: 新しいパスワード確認不一致エラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 入力（確認が不一致）
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('current123')
      await passwordInputs.nth(1).fill('newpassword123')
      await passwordInputs.nth(2).fill('differentpassword456')

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=一致しません')).toBeVisible()
    })

    // E2E-HEADER-014: 現在のパスワードと同じエラー
    test('E2E-HEADER-014: 現在のパスワードと同じエラー', async ({ page }) => {
      await openChangePasswordDialog(page)

      // 入力（新しいパスワードが現在と同じ）
      const dialog = page.locator('role=dialog')
      const passwordInputs = dialog.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('samepassword123')
      await passwordInputs.nth(1).fill('samepassword123')
      await passwordInputs.nth(2).fill('samepassword123')

      // 送信
      await page.click('button:has-text("パスワードを変更")')

      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=現在のパスワードと異なる')).toBeVisible()
    })
  })

  test.describe('モバイル表示', () => {
    // モバイル版ユーザーメニューのテスト
    test('モバイル版: ドロップダウンメニュー表示', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // モバイル版ではメールアドレスの@前部分のみ表示
      // モバイル用ヘッダー（lg:hiddenのヘッダー）
      const mobileHeader = page.locator('header.lg\\:hidden')
      const emailPrefix = TEST_ADMIN.email.split('@')[0]
      const userMenuButton = mobileHeader.locator('button').filter({ hasText: emailPrefix })
      await userMenuButton.click()

      // ドロップダウンメニューが表示されることを確認
      await expect(mobileHeader.locator('text=パスワード変更')).toBeVisible()
      await expect(mobileHeader.locator('text=ログアウト')).toBeVisible()
    })
  })
})
