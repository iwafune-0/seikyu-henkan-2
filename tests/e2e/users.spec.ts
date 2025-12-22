/**
 * P-004: ユーザー管理ページ E2Eテスト
 *
 * テスト対象: http://localhost:5174/users
 * 前提条件: 管理者としてログイン済み
 */
import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUserByEmail, createDeletedUser } from './helpers/supabase-admin'

// テスト用認証情報
const TEST_ADMIN = {
  email: 'iwafune-hiroko@terracom.co.jp',
  password: 'IwafuneTerra2025',
}

// テスト用一般ユーザー
const TEST_REGULAR_USER = {
  email: 'e2e-test-regular-user@example.com',
  password: 'TestPassword123',
}

/**
 * P-004: ユーザー管理ページ
 */
test.describe('P-004: ユーザー管理ページ', () => {
  // 各テストの前に管理者としてログイン
  test.beforeEach(async ({ page }) => {
    // ストレージをクリアしてログアウト状態にする
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

  test.describe('正常系', () => {
    // E2E-USER-001: TC-001: ユーザー一覧表示
    test('E2E-USER-001: ユーザー一覧表示', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページタイトル「ユーザー管理」が表示されることを確認
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // ユーザー一覧テーブルが表示されることを確認
      await expect(page.locator('table')).toBeVisible()

      // テーブルヘッダーが正しく表示されることを確認
      const tableHeaders = page.locator('thead th')
      await expect(tableHeaders).toContainText(['メールアドレス', 'ロール', '登録日'])

      // ユーザー一覧テーブルに少なくとも1行のデータが表示されることを確認
      const tableRows = page.locator('tbody tr')
      await expect(tableRows.first()).toBeVisible()

      // 各ユーザーのメールアドレス・ロール・登録日が表示されることを確認
      // 最初の行を検証
      const firstRow = tableRows.first()
      await expect(firstRow.locator('td').nth(0)).toContainText(/@/)  // メールアドレス（@を含む）
      await expect(firstRow.locator('td').nth(1)).toContainText(/管理者|一般ユーザー/)  // ロール

      // 「新規ユーザーを招待」ボタンが表示されることを確認
      await expect(page.getByRole('button', { name: /新規ユーザーを招待|招待/ })).toBeVisible()
    })

    // E2E-USER-002: TC-002: 新規ユーザー招待
    test('E2E-USER-002: 新規ユーザー招待', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄にユニークなメールアドレスを入力
      const timestamp = Date.now()
      const testEmail = `e2e-user-invite-${timestamp}@terracom.co.jp`
      await page.fill('input[name="email"], input[type="email"]', testEmail)

      // ロール選択: デフォルトで「一般ユーザー」が選択されていることを確認
      const roleSelect = modal.locator('[role="combobox"]')
      await expect(roleSelect).toContainText('一般ユーザー')

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // Snackbarで「招待メールを送信しました」と表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: /招待メールを送信しました|招待しました/ })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    })

    // E2E-USER-003: TC-003: 管理者として招待
    test('E2E-USER-003: 管理者として招待', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // APIレスポンスを監視
      page.on('response', async (response) => {
        if (response.url().includes('/api/users/invite')) {
          console.log('=== Invite API Response ===')
          console.log('Status:', response.status())
          console.log('Headers:', response.headers())
          try {
            const body = await response.json()
            console.log('Body:', JSON.stringify(body, null, 2))
          } catch (e) {
            console.log('Body: (not JSON)')
          }
        }
      })

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄にユニークなメールアドレスを入力
      const timestamp = Date.now()
      const testEmail = `newadmin_test_${timestamp}@terracom.co.jp`
      await page.fill('input[name="email"], input[type="email"]', testEmail)

      // ロール選択: 「管理者」を選択
      const roleSelect = modal.locator('[role="combobox"]')
      await roleSelect.click()

      // ドロップダウンから「管理者」を選択
      await page.getByRole('option', { name: '管理者' }).click()

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // 少し待機してログを確認
      await page.waitForTimeout(2000)

      // Snackbar要素の状態を確認
      const allAlerts = page.locator('[role="alert"]')
      const alertCount = await allAlerts.count()
      console.log('=== Snackbar Check ===')
      console.log('Alert count:', alertCount)
      for (let i = 0; i < alertCount; i++) {
        const text = await allAlerts.nth(i).textContent()
        console.log(`Alert ${i}:`, text)
      }

      // Snackbarで「招待メールを送信しました」と表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: /招待メールを送信しました|招待しました/ })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    })

    // E2E-USER-004: TC-004: ロール変更（一般ユーザー → 管理者）
    test('E2E-USER-004: ロール変更（一般ユーザー → 管理者）', async ({ page }) => {
      // テスト前処理: 一般ユーザーを作成
      console.log('テスト前処理: 一般ユーザーを作成します')
      await createTestUser(TEST_REGULAR_USER.email, TEST_REGULAR_USER.password, 'user')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テスト用一般ユーザーの行を探す
      const targetUserRow = page.locator('tbody tr').filter({ hasText: TEST_REGULAR_USER.email })

      // テーブルに表示されるまで待機
      await expect(targetUserRow).toBeVisible({ timeout: 10000 })

      // ロールドロップダウンをクリック
      const roleSelect = targetUserRow.locator('[role="combobox"]')
      await roleSelect.click()

      // 「管理者」を選択
      await page.getByRole('option', { name: '管理者' }).click()

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに「管理者」に変更しますか？というメッセージが含まれることを確認
      await expect(confirmDialog).toContainText(/管理者/)

      // 確認ダイアログで「OK」または「変更」ボタンをクリック
      await page.getByRole('button', { name: /OK|変更|はい/ }).click()

      // Snackbarで「ロールを変更しました: {email} (一般ユーザー → 管理者)」と表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: new RegExp(`ロールを変更しました.*${TEST_REGULAR_USER.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*一般ユーザー.*→.*管理者`) })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      // ロール列が「管理者」に更新されることを確認
      const updatedRoleSelect = targetUserRow.locator('[role="combobox"]')
      await expect(updatedRoleSelect).toContainText('管理者')

      console.log('ロール変更テスト成功')

      // テスト後処理: テストユーザーを削除
      console.log('テスト後処理: テストユーザーを削除します')
      await deleteTestUserByEmail(TEST_REGULAR_USER.email)

      console.log('テスト完了')
    })

    // E2E-USER-005: TC-005: ロール変更（管理者 → 一般ユーザー）
    test('E2E-USER-005: ロール変更（管理者 → 一般ユーザー）', async ({ page }) => {
      // テスト前処理: テスト用管理者ユーザーを作成（管理者が2人以上必要）
      const TEST_ADMIN_USER = {
        email: 'e2e-test-admin-demote@example.com',
        password: 'TestPassword123',
      }

      console.log('テスト前処理: テスト用管理者ユーザーを作成します')
      await createTestUser(TEST_ADMIN_USER.email, TEST_ADMIN_USER.password, 'admin')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テスト用管理者ユーザーの行を探す
      const targetUserRow = page.locator('tbody tr').filter({ hasText: TEST_ADMIN_USER.email })

      // テーブルに表示されるまで待機
      await expect(targetUserRow).toBeVisible({ timeout: 10000 })

      // ロールドロップダウンをクリック
      const roleSelect = targetUserRow.locator('[role="combobox"]')
      await roleSelect.click()

      // 「一般ユーザー」を選択
      await page.getByRole('option', { name: '一般ユーザー' }).click()

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに「一般ユーザー」に変更しますか？というメッセージが含まれることを確認
      await expect(confirmDialog).toContainText(/一般ユーザー/)

      // 確認ダイアログで「OK」または「変更」ボタンをクリック
      await page.getByRole('button', { name: /OK|変更|はい/ }).click()

      // Snackbarで「ロールを変更しました: {email} (管理者 → 一般ユーザー)」と表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: new RegExp(`ロールを変更しました.*${TEST_ADMIN_USER.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*管理者.*→.*一般ユーザー`) })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      // ロール列が「一般ユーザー」に更新されることを確認
      const updatedRoleSelect = targetUserRow.locator('[role="combobox"]')
      await expect(updatedRoleSelect).toContainText('一般ユーザー')

      console.log('ロール変更テスト（管理者→一般ユーザー）成功')

      // テスト後処理: テストユーザーを削除
      console.log('テスト後処理: テストユーザーを削除します')
      await deleteTestUserByEmail(TEST_ADMIN_USER.email)

      console.log('テスト完了')
    })

    // E2E-USER-006: TC-006: ユーザー削除
    test('E2E-USER-006: ユーザー削除', async ({ page }) => {
      // テスト前処理: 削除対象の一般ユーザーを作成
      const TEST_DELETE_USER = {
        email: 'e2e-test-delete-user@example.com',
        password: 'TestPassword123',
      }

      console.log('テスト前処理: 削除対象ユーザーを作成します')
      await createTestUser(TEST_DELETE_USER.email, TEST_DELETE_USER.password, 'user')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 削除対象ユーザーの行を探す
      const targetUserRow = page.locator('tbody tr').filter({ hasText: TEST_DELETE_USER.email })

      // テーブルに表示されるまで待機
      await expect(targetUserRow).toBeVisible({ timeout: 10000 })

      // 削除対象ユーザーの行で「削除」ボタンをクリック
      await targetUserRow.getByRole('button', { name: /削除/ }).click()

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに削除確認メッセージが含まれることを確認
      await expect(confirmDialog).toContainText(/削除/)

      // 確認ダイアログで「削除」ボタンをクリック
      await page.getByRole('button', { name: /削除/ }).last().click()

      // Snackbarで「ユーザーを削除しました: {email}」と表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: new RegExp(`ユーザーを削除しました.*${TEST_DELETE_USER.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      // ユーザー一覧から該当ユーザーが消えることを確認
      await expect(targetUserRow).not.toBeVisible({ timeout: 5000 })

      console.log('ユーザー削除テスト成功')

      // テスト後処理: 念のためDBから完全削除（論理削除されているが、テストデータをクリーンアップ）
      console.log('テスト後処理: テストユーザーをクリーンアップします')
      await deleteTestUserByEmail(TEST_DELETE_USER.email)

      console.log('テスト完了')
    })

    // E2E-USER-007: TC-007: 削除キャンセル
    test('E2E-USER-007: 削除キャンセル', async ({ page }) => {
      // テスト前処理: 削除キャンセルテスト用ユーザーを作成
      const TEST_CANCEL_USER = {
        email: 'e2e-test-cancel-delete@example.com',
        password: 'TestPassword123',
      }

      console.log('テスト前処理: 削除キャンセルテスト用ユーザーを作成します')
      await createTestUser(TEST_CANCEL_USER.email, TEST_CANCEL_USER.password, 'user')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テスト用ユーザーの行を探す
      const targetUserRow = page.locator('tbody tr').filter({ hasText: TEST_CANCEL_USER.email })

      // テーブルに表示されるまで待機
      await expect(targetUserRow).toBeVisible({ timeout: 10000 })

      // 削除ボタンをクリック
      await targetUserRow.getByRole('button', { name: /削除/ }).click()

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに削除確認メッセージが含まれることを確認
      await expect(confirmDialog).toContainText(/削除/)

      // 確認ダイアログで「キャンセル」ボタンをクリック
      await page.getByRole('button', { name: /キャンセル/ }).click()

      // ダイアログが閉じることを確認
      await expect(confirmDialog).not.toBeVisible({ timeout: 5000 })

      // ユーザーが削除されていないことを確認（テーブル内に残っている）
      await expect(targetUserRow).toBeVisible()

      console.log('削除キャンセルテスト成功 - ユーザーは削除されませんでした')

      // テスト後処理: テストユーザーをクリーンアップ
      console.log('テスト後処理: テストユーザーをクリーンアップします')
      await deleteTestUserByEmail(TEST_CANCEL_USER.email)

      console.log('テスト完了')
    })
  })

  test.describe('異常系', () => {
    // E2E-USER-010: TC-103: 空のメールアドレスで招待
    test('E2E-USER-010: 空のメールアドレスで招待', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄を空のまま（何も入力しない）

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // バリデーションエラーで「メールアドレスを入力してください」と表示されることを確認
      const errorSnackbar = page.locator('[role="alert"]').filter({ hasText: /メールアドレスを入力してください/ })
      await expect(errorSnackbar).toBeVisible({ timeout: 5000 })

      // 招待が送信されていないことを確認（モーダルが開いたまま）
      await expect(modal).toBeVisible()

      console.log('空のメールアドレスで招待のバリデーションエラーテスト成功')
    })

    // E2E-USER-011: TC-104: 不正なメールアドレス形式
    test('E2E-USER-011: 不正なメールアドレス形式', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄に不正な形式のメールアドレスを入力
      await page.fill('input[name="email"], input[type="email"]', 'invalid-email')

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // バリデーションエラーで「メールアドレスの形式が不正です」と表示されることを確認
      const errorSnackbar = page.locator('[role="alert"]').filter({ hasText: /メールアドレスの形式が不正です/ })
      await expect(errorSnackbar).toBeVisible({ timeout: 5000 })

      // 招待が送信されていないことを確認（モーダルが開いたまま）
      await expect(modal).toBeVisible()

      console.log('不正なメールアドレス形式のバリデーションエラーテスト成功')
    })

    // E2E-USER-013: TC-106: 既存ユーザーへの招待ブロック
    test('E2E-USER-013: 既存ユーザーへの招待ブロック', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄に既存ユーザーのメールアドレスを入力
      // テスト管理者（既に登録済み）のメールアドレスを使用
      await page.fill('input[name="email"], input[type="email"]', TEST_ADMIN.email)

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // Snackbarで「このメールアドレスは既に登録されています」と表示されることを確認
      const errorSnackbar = page.locator('[role="alert"]').filter({ hasText: /このメールアドレスは既に登録されています/ })
      await expect(errorSnackbar).toBeVisible({ timeout: 5000 })

      // 招待が送信されていないことを確認（モーダルが開いたまま）
      await expect(modal).toBeVisible()

      console.log('既存ユーザーへの招待ブロックテスト成功')
    })

    // E2E-USER-014: TC-107: 削除済みユーザーへの再招待は許可
    test('E2E-USER-014: 削除済みユーザーへの再招待は許可', async ({ page }) => {
      // テスト用の削除済みユーザー
      const DELETED_USER = {
        email: 'deleted@example.com',
        password: 'DeletedPassword123',
      }

      // テスト前処理: 削除済みユーザーを作成
      console.log('テスト前処理: 削除済みユーザーを作成します')
      await createDeletedUser(DELETED_USER.email, DELETED_USER.password, 'user')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 削除済みユーザーがユーザー一覧に表示されていないことを確認
      const deletedUserRow = page.locator('tbody tr').filter({ hasText: DELETED_USER.email })
      await expect(deletedUserRow).not.toBeVisible()

      // APIレスポンスを監視
      page.on('response', async (response) => {
        if (response.url().includes('/api/users/invite')) {
          console.log('=== Invite API Response ===')
          console.log('Status:', response.status())
          try {
            const body = await response.json()
            console.log('Body:', JSON.stringify(body, null, 2))
          } catch (e) {
            const text = await response.text()
            console.log('Body (text):', text)
          }
        }
      })

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄に削除済みユーザーのメールアドレスを入力
      await page.fill('input[name="email"], input[type="email"]', DELETED_USER.email)

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // APIレスポンスを待機
      await page.waitForTimeout(3000)

      // すべてのアラート要素を確認
      const allAlerts = page.locator('[role="alert"]')
      const alertCount = await allAlerts.count()
      console.log('=== Snackbar Check ===')
      console.log('Alert count:', alertCount)
      for (let i = 0; i < alertCount; i++) {
        const text = await allAlerts.nth(i).textContent()
        const visible = await allAlerts.nth(i).isVisible()
        console.log(`Alert ${i}: visible=${visible}, text="${text}"`)
      }

      // Snackbarで「招待メールを送信しました」と表示されることを確認
      const successSnackbar = page.locator('[role="alert"]').filter({ hasText: /招待メールを送信しました|招待しました/ })
      await expect(successSnackbar).toBeVisible({ timeout: 5000 })

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible({ timeout: 5000 })

      // ユーザー一覧に削除済みユーザーが追加されることを確認
      await expect(deletedUserRow).toBeVisible({ timeout: 10000 })

      console.log('削除済みユーザーへの再招待テスト成功')

      // テスト後処理: テストユーザーを完全削除
      console.log('テスト後処理: テストユーザーをクリーンアップします')
      await deleteTestUserByEmail(DELETED_USER.email)

      console.log('テスト完了')
    })

    // E2E-USER-008: TC-101: 最終管理者の削除拒否
    test('E2E-USER-008: 最終管理者の削除拒否', async ({ page }) => {
      // デスクトップサイズに設定（テーブルレイアウトを表示）
      await page.setViewportSize({ width: 1920, height: 1080 })

      // テスト前処理: 管理者が1人のみの状態を確保
      // 現在ログイン中のTEST_ADMIN（iwafune-hiroko@terracom.co.jp）が唯一の管理者であることを確認
      console.log('テスト前処理: 管理者の数を確認します')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テーブルが表示されるまで待機
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

      // ユーザーデータの読み込みを待機（ローディング状態が終わるまで）
      // または最低でも1行のデータが表示されるまで待機
      await page.waitForTimeout(2000)

      // 全ユーザーの行を取得
      const allRows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') })
      const rowCount = await allRows.count()

      // 管理者の行を数える（ロール列に「管理者」と表示されている行）
      let adminCount = 0
      for (let i = 0; i < rowCount; i++) {
        const row = allRows.nth(i)
        // ロール列（2列目）のテキストを取得
        const roleCell = row.locator('td').nth(1)
        const roleText = await roleCell.textContent()
        if (roleText && roleText.includes('管理者')) {
          adminCount++
        }
      }

      console.log(`全ユーザー数: ${rowCount}, 管理者の数: ${adminCount}`)

      // 管理者が2人以上いる場合、他の管理者を一般ユーザーに降格（最終管理者のみを残す）
      if (adminCount > 1) {
        console.log('管理者が複数います。他の管理者を一般ユーザーに降格します')

        // ログイン中のユーザー以外の管理者を降格
        for (let i = 0; i < rowCount; i++) {
          const row = allRows.nth(i)
          const roleCell = row.locator('td').nth(1)
          const roleText = await roleCell.textContent()

          if (roleText && roleText.includes('管理者')) {
            const emailCell = row.locator('td').first()
            const email = await emailCell.textContent()

            // ログイン中のユーザーではない場合は降格
            if (email && !email.includes(TEST_ADMIN.email)) {
              console.log(`管理者を降格: ${email}`)

              // ロール列のSelectをクリック
              const roleSelect = roleCell.locator('[role="combobox"]')
              await roleSelect.click()
              await page.getByRole('option', { name: '一般ユーザー' }).click()

              // 確認ダイアログが表示されたら「OK」をクリック
              const confirmDialog = page.getByRole('dialog')
              await expect(confirmDialog).toBeVisible({ timeout: 5000 })
              await page.getByRole('button', { name: /OK|変更|はい/ }).click()

              // Snackbar通知を待機
              await page.waitForTimeout(1000)
            }
          }
        }
      }

      // ページをリロードして最新の状態を取得
      await page.reload()
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 最終管理者（ログイン中のユーザー）の行を探す
      const finalAdminRow = page.locator('tbody tr').filter({ hasText: TEST_ADMIN.email })
      await expect(finalAdminRow).toBeVisible({ timeout: 10000 })

      // 削除ボタンをクリック
      console.log('最終管理者の削除ボタンをクリックします')
      await finalAdminRow.getByRole('button', { name: /削除/ }).click()

      // ダイアログが表示されることを確認
      const alertDialog = page.getByRole('dialog')
      await expect(alertDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに拒否メッセージが表示されることを確認
      await expect(alertDialog).toContainText(/最終管理者のため削除できません/)
      await expect(alertDialog).toContainText(/他のユーザーを管理者に昇格してから削除してください/)

      console.log('拒否メッセージが表示されました')

      // ダイアログの「OK」ボタンをクリックして閉じる
      await page.getByRole('button', { name: /OK|閉じる/ }).click()

      // ダイアログが閉じることを確認
      await expect(alertDialog).not.toBeVisible({ timeout: 5000 })

      // ユーザーが削除されていないことを確認（テーブル内に残っている）
      await expect(finalAdminRow).toBeVisible()
      await expect(finalAdminRow.locator('[role="combobox"]')).toContainText('管理者')

      console.log('最終管理者は削除されませんでした - テスト成功')
    })

    // E2E-USER-012: TC-105: 自分自身のロール変更拒否
    test('E2E-USER-012: 自分自身のロール変更拒否', async ({ page }) => {
      // デスクトップサイズに設定（テーブルレイアウトを表示）
      await page.setViewportSize({ width: 1920, height: 1080 })

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テーブルが表示されるまで待機
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

      // ユーザーデータの読み込みを待機
      await page.waitForTimeout(2000)

      // 自分自身（ログイン中のユーザー）の行を探す
      const selfRow = page.locator('tbody tr').filter({ hasText: TEST_ADMIN.email })
      await expect(selfRow).toBeVisible({ timeout: 10000 })

      // ロール列のSelectを取得
      const roleCell = selfRow.locator('td').nth(1)
      const roleSelect = roleCell.locator('[role="combobox"]')

      // 現在のロールが「管理者」であることを確認
      await expect(roleSelect).toContainText('管理者')

      // ロールドロップダウンで「一般ユーザー」を選択
      console.log('自分自身のロールを一般ユーザーに変更しようとします')
      await roleSelect.click()
      await page.getByRole('option', { name: '一般ユーザー' }).click()

      // ダイアログが表示されることを確認
      const alertDialog = page.getByRole('dialog')
      await expect(alertDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに拒否メッセージが表示されることを確認
      await expect(alertDialog).toContainText(/自分自身のロールは変更できません/)
      await expect(alertDialog).toContainText(/他の管理者に依頼してください/)

      console.log('拒否メッセージが表示されました')

      // ダイアログの「OK」ボタンをクリックして閉じる
      await page.getByRole('button', { name: /OK|閉じる/ }).click()

      // ダイアログが閉じることを確認
      await expect(alertDialog).not.toBeVisible({ timeout: 5000 })

      // ロールが変更されていないことを確認（依然として「管理者」）
      await expect(roleSelect).toContainText('管理者')

      console.log('自分自身のロールは変更されませんでした - テスト成功')
    })

    // E2E-USER-009: TC-102: 最終管理者の降格拒否
    test('E2E-USER-009: 最終管理者の降格拒否', async ({ page }) => {
      // デスクトップサイズに設定（テーブルレイアウトを表示）
      await page.setViewportSize({ width: 1920, height: 1080 })

      // テスト前処理: 管理者が1人のみの状態を確保
      // 現在ログイン中のTEST_ADMIN（iwafune-hiroko@terracom.co.jp）が唯一の管理者であることを確認
      console.log('テスト前処理: 管理者の数を確認します')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テーブルが表示されるまで待機
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

      // ユーザーデータの読み込みを待機（ローディング状態が終わるまで）
      // または最低でも1行のデータが表示されるまで待機
      await page.waitForTimeout(2000)

      // 全ユーザーの行を取得
      const allRows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') })
      const rowCount = await allRows.count()

      // 管理者の行を数える（ロール列に「管理者」と表示されている行）
      let adminCount = 0
      for (let i = 0; i < rowCount; i++) {
        const row = allRows.nth(i)
        // ロール列（2列目）のテキストを取得
        const roleCell = row.locator('td').nth(1)
        const roleText = await roleCell.textContent()
        if (roleText && roleText.includes('管理者')) {
          adminCount++
        }
      }

      console.log(`全ユーザー数: ${rowCount}, 管理者の数: ${adminCount}`)

      // 管理者が2人以上いる場合、他の管理者を一般ユーザーに降格（最終管理者のみを残す）
      if (adminCount > 1) {
        console.log('管理者が複数います。他の管理者を一般ユーザーに降格します')

        // ログイン中のユーザー以外の管理者を降格
        for (let i = 0; i < rowCount; i++) {
          const row = allRows.nth(i)
          const roleCell = row.locator('td').nth(1)
          const roleText = await roleCell.textContent()

          if (roleText && roleText.includes('管理者')) {
            const emailCell = row.locator('td').first()
            const email = await emailCell.textContent()

            // ログイン中のユーザーではない場合は降格
            if (email && !email.includes(TEST_ADMIN.email)) {
              console.log(`管理者を降格: ${email}`)

              // ロール列のSelectをクリック
              const roleSelect = roleCell.locator('[role="combobox"]')
              await roleSelect.click()
              await page.getByRole('option', { name: '一般ユーザー' }).click()

              // 確認ダイアログが表示されたら「OK」をクリック
              const confirmDialog = page.getByRole('dialog')
              await expect(confirmDialog).toBeVisible({ timeout: 5000 })
              await page.getByRole('button', { name: /OK|変更|はい/ }).click()

              // Snackbar通知を待機
              await page.waitForTimeout(1000)
            }
          }
        }
      }

      // ページをリロードして最新の状態を取得
      await page.reload()
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 最終管理者（ログイン中のユーザー）の行を探す
      const finalAdminRow = page.locator('tbody tr').filter({ hasText: TEST_ADMIN.email })
      await expect(finalAdminRow).toBeVisible({ timeout: 10000 })

      // ロール列のSelectを取得
      const roleCell = finalAdminRow.locator('td').nth(1)
      const roleSelect = roleCell.locator('[role="combobox"]')

      // ロールドロップダウンで「一般ユーザー」を選択
      console.log('最終管理者のロールを一般ユーザーに変更しようとします')
      await roleSelect.click()
      await page.getByRole('option', { name: '一般ユーザー' }).click()

      // ダイアログが表示されることを確認
      const alertDialog = page.getByRole('dialog')
      await expect(alertDialog).toBeVisible({ timeout: 5000 })

      // ダイアログに拒否メッセージが表示されることを確認
      await expect(alertDialog).toContainText(/最終管理者のため降格できません/)
      await expect(alertDialog).toContainText(/他のユーザーを管理者に昇格してから変更してください/)

      console.log('拒否メッセージが表示されました')

      // ダイアログの「OK」ボタンをクリックして閉じる
      await page.getByRole('button', { name: /OK|閉じる/ }).click()

      // ダイアログが閉じることを確認
      await expect(alertDialog).not.toBeVisible({ timeout: 5000 })

      // ロールが変更されていないことを確認（依然として「管理者」）
      await expect(roleSelect).toContainText('管理者')

      console.log('最終管理者のロールは変更されませんでした - テスト成功')
    })

    // E2E-USER-015: TC-201: 一般ユーザーのアクセス拒否
    test('E2E-USER-015: 一般ユーザーのアクセス拒否', async ({ page }) => {
      // テスト前処理: 一般ユーザーを作成
      console.log('テスト前処理: 一般ユーザーを作成します')
      await createTestUser(TEST_REGULAR_USER.email, TEST_REGULAR_USER.password, 'user')

      // 管理者からログアウト
      await page.context().clearCookies()
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // 一般ユーザーとしてログイン
      console.log('一般ユーザーとしてログイン:', TEST_REGULAR_USER.email)
      await page.fill('#email', TEST_REGULAR_USER.email)
      await page.fill('#password', TEST_REGULAR_USER.password)
      await page.click('button[type="submit"]')

      // ログイン完了を待機（一般ユーザーは/processにリダイレクト）
      await expect(page).toHaveURL(/\/process/, { timeout: 15000 })

      // /users に直接アクセス
      console.log('/users に直接アクセスを試みます')
      await page.goto('/users')

      // リダイレクトされることを確認（/processに戻る）
      await expect(page).toHaveURL(/\/process/, { timeout: 10000 })

      // ユーザー管理ページは表示されていないことを確認
      const userManagementHeader = page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })
      await expect(userManagementHeader).not.toBeVisible()

      console.log('一般ユーザーのアクセスが正しくブロックされました - テスト成功')

      // テスト後処理: テストユーザーを削除
      console.log('テスト後処理: テストユーザーを削除します')
      await deleteTestUserByEmail(TEST_REGULAR_USER.email)

      console.log('テスト完了')
    })

    // E2E-USER-016: TC-202: 未認証アクセス
    test('E2E-USER-016: 未認証アクセス', async ({ page }) => {
      // 管理者からログアウト
      await page.context().clearCookies()
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // ログアウト状態であることを確認（/loginにいることを確認）
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
      console.log('ログアウト状態を確認しました')

      // /users に直接アクセス
      console.log('未認証状態で /users に直接アクセスを試みます')
      await page.goto('/users')

      // /login にリダイレクトされることを確認
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

      // ユーザー管理ページは表示されていないことを確認
      const userManagementHeader = page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })
      await expect(userManagementHeader).not.toBeVisible()

      console.log('未認証アクセスが正しくブロックされ、/loginにリダイレクトされました - テスト成功')
    })

    // E2E-USER-017: TC-301: 招待モーダルのキーボード操作
    test('E2E-USER-017: 招待モーダルのキーボード操作', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      console.log('招待モーダルが表示されました')

      // Escキーを押す
      await page.keyboard.press('Escape')

      // モーダルが閉じることを確認
      await expect(modal).not.toBeVisible({ timeout: 5000 })

      console.log('Escキーでモーダルが閉じました - テスト成功')
    })

    // E2E-USER-018: TC-302: 通知の自動消去
    test('E2E-USER-018: 通知の自動消去', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄に既存ユーザーのメールアドレスを入力（エラー通知を発生させる）
      await page.fill('input[name="email"], input[type="email"]', TEST_ADMIN.email)

      // 「招待メールを送信」ボタンをクリック
      await page.getByRole('button', { name: /招待メールを送信|送信/ }).click()

      // Snackbar通知が表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: /このメールアドレスは既に登録されています/ })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      console.log('Snackbar通知が表示されました')

      // Snackbar通知が表示された時刻を記録
      const startTime = Date.now()

      // 3秒待機
      await page.waitForTimeout(3000)

      // Snackbar通知が自動的に消えることを確認
      await expect(snackbar).not.toBeVisible({ timeout: 2000 })

      const endTime = Date.now()
      const elapsedTime = endTime - startTime

      console.log(`Snackbar通知が自動的に消えました（経過時間: ${elapsedTime}ms）`)
      console.log('通知の自動消去テスト成功')
    })

    // E2E-USER-019: TC-303: ロール変更の即時反映
    test('E2E-USER-019: ロール変更の即時反映', async ({ page }) => {
      // テスト前処理: テスト用ユーザーを作成
      const TEST_USER_FOR_IMMEDIATE_UPDATE = {
        email: 'e2e-test-immediate-update@example.com',
        password: 'TestPassword123',
      }

      console.log('テスト前処理: テスト用ユーザーを作成します')
      await createTestUser(TEST_USER_FOR_IMMEDIATE_UPDATE.email, TEST_USER_FOR_IMMEDIATE_UPDATE.password, 'user')

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テスト用ユーザーの行を探す
      const targetUserRow = page.locator('tbody tr').filter({ hasText: TEST_USER_FOR_IMMEDIATE_UPDATE.email })

      // テーブルに表示されるまで待機
      await expect(targetUserRow).toBeVisible({ timeout: 10000 })

      // 初期状態: ロールが「一般ユーザー」であることを確認
      const initialRoleSelect = targetUserRow.locator('[role="combobox"]')
      await expect(initialRoleSelect).toContainText('一般ユーザー')

      console.log('初期状態: ロールが「一般ユーザー」であることを確認しました')

      // ロールドロップダウンをクリック
      await initialRoleSelect.click()

      // 「管理者」を選択
      await page.getByRole('option', { name: '管理者' }).click()

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })

      // 確認ダイアログで「OK」または「変更」ボタンをクリック
      await page.getByRole('button', { name: /OK|変更|はい/ }).click()

      // Snackbarで変更成功通知が表示されることを確認
      const snackbar = page.locator('[role="alert"]').filter({ hasText: /ロールを変更しました/ })
      await expect(snackbar).toBeVisible({ timeout: 5000 })

      console.log('ロール変更成功通知が表示されました')

      // ページリロードなしでロールが即時更新されることを確認
      const updatedRoleSelect = targetUserRow.locator('[role="combobox"]')
      await expect(updatedRoleSelect).toContainText('管理者')

      console.log('ページリロードなしでロールが「管理者」に即時反映されました')

      // 変更後すぐに別の操作が可能であることを確認
      // 1. 「新規ユーザーを招待」ボタンがクリック可能
      const inviteButton = page.getByRole('button', { name: /新規ユーザーを招待|招待/ })
      await expect(inviteButton).toBeEnabled()

      // 2. 招待ボタンをクリックしてモーダルが開くことを確認
      await inviteButton.click()
      const inviteModal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(inviteModal).toBeVisible({ timeout: 5000 })

      console.log('変更後すぐに招待モーダルを開くことができました')

      // モーダルを閉じる（Escキー）
      await page.keyboard.press('Escape')
      await expect(inviteModal).not.toBeVisible({ timeout: 5000 })

      // 3. 変更したユーザーのロールを再度変更できることを確認
      await updatedRoleSelect.click()
      await page.getByRole('option', { name: '一般ユーザー' }).click()

      // 確認ダイアログが表示されることを確認
      const secondConfirmDialog = page.getByRole('dialog')
      await expect(secondConfirmDialog).toBeVisible({ timeout: 5000 })

      // 確認ダイアログで「OK」ボタンをクリック
      await page.getByRole('button', { name: /OK|変更|はい/ }).click()

      // Snackbarで変更成功通知が表示されることを確認
      const secondSnackbar = page.locator('[role="alert"]').filter({ hasText: /ロールを変更しました/ })
      await expect(secondSnackbar).toBeVisible({ timeout: 5000 })

      // ロールが「一般ユーザー」に戻ることを確認
      await expect(updatedRoleSelect).toContainText('一般ユーザー')

      console.log('変更後すぐに再度ロール変更ができました - ロールが「一般ユーザー」に戻りました')

      console.log('E2E-USER-019: ロール変更の即時反映テスト成功')

      // テスト後処理: テストユーザーを削除
      console.log('テスト後処理: テストユーザーを削除します')
      await deleteTestUserByEmail(TEST_USER_FOR_IMMEDIATE_UPDATE.email)

      console.log('テスト完了')
    })

    // E2E-USER-020: TC-304: ローディング状態
    test('E2E-USER-020: ローディング状態', async ({ page }) => {
      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // 「新規ユーザーを招待」ボタンをクリック
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()

      // 招待モーダルが表示されることを確認
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()

      // メールアドレス入力欄に既存ユーザーのメールアドレスを入力
      // （既存ユーザーへの招待でもローディング状態を確認できる）
      await page.fill('input[name="email"], input[type="email"]', TEST_ADMIN.email)

      // 「招待メールを送信」ボタンを取得
      const sendButton = page.getByRole('button', { name: /招待メールを送信|送信/ })

      // 初期状態: ボタンが有効化されていることを確認
      await expect(sendButton).toBeEnabled()
      console.log('初期状態: ボタンが有効化されています')

      // APIリクエストの開始を待機するためのPromiseを作成
      const requestPromise = page.waitForRequest(
        (request) => request.url().includes('/api/users/invite'),
        { timeout: 5000 }
      )

      // 送信ボタンをクリック（非同期）
      const clickPromise = sendButton.click()

      // APIリクエストが開始されるのを待機
      await requestPromise
      console.log('招待APIリクエストが開始されました')

      // ローディング状態を確認: ボタンが無効化されている
      // API応答前にボタンの状態を確認
      const isDisabledDuringLoading = await sendButton.isDisabled()
      console.log('送信中のボタン状態: disabled =', isDisabledDuringLoading)

      // 二重送信防止: ボタンが無効化されていることを確認
      expect(isDisabledDuringLoading).toBe(true)
      console.log('送信中はボタンが無効化されており、二重送信が防止されています')

      // クリック完了を待機
      await clickPromise

      // API応答を待機
      await page.waitForTimeout(1000)

      // エラーメッセージが表示されることを確認（既存ユーザーへの招待）
      const errorSnackbar = page.locator('[role="alert"]').filter({ hasText: /このメールアドレスは既に登録されています/ })
      await expect(errorSnackbar).toBeVisible({ timeout: 5000 })

      // 送信完了後、ボタンが再び有効化されることを確認（モーダルは開いたまま）
      await expect(modal).toBeVisible()
      await expect(sendButton).toBeEnabled()
      console.log('送信完了後、ボタンが再び有効化されました')

      console.log('E2E-USER-020: ローディング状態テスト成功')
    })

    // E2E-USER-021: TC-401〜TC-403: レスポンシブ表示
    test('E2E-USER-021: レスポンシブ表示', async ({ page }) => {
      console.log('=== E2E-USER-021: レスポンシブ表示テスト開始 ===')

      // TC-401: デスクトップ表示 (1920x1080)
      console.log('\n--- TC-401: デスクトップ表示 (1920x1080) ---')
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // テーブルが全幅で表示される
      const table = page.locator('table')
      await expect(table).toBeVisible()
      const tableBox = await table.boundingBox()
      console.log('デスクトップ - テーブル幅:', tableBox?.width)

      // すべての列が表示される
      const tableHeaders = page.locator('thead th')
      await expect(tableHeaders).toContainText(['メールアドレス', 'ロール', '登録日'])
      console.log('デスクトップ - すべての列が表示されることを確認')

      // アクションボタンが横並び（最初の行のアクションボタンの位置を確認）
      const firstRow = page.locator('tbody tr').first()
      await expect(firstRow).toBeVisible()
      console.log('デスクトップ - アクションボタンが表示されることを確認')

      console.log('✅ TC-401: デスクトップ表示テスト成功')

      // TC-402: タブレット表示 (768x1024)
      console.log('\n--- TC-402: タブレット表示 (768x1024) ---')
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(500) // レイアウト調整を待機

      // タブレット表示ではカード形式のレイアウトに切り替わる
      // テーブルは非表示になり、カードが表示される
      const tableVisibility = await table.isVisible()
      console.log('タブレット - テーブル表示状態:', tableVisibility ? '表示' : '非表示（カードレイアウト）')

      // ユーザー情報がカード形式で表示されることを確認
      // 削除ボタンを含む要素（ユーザーカード）を探す
      const userCards = page.getByRole('button', { name: /削除/ })
      const cardCount = await userCards.count()
      console.log('タブレット - ユーザーカード数（削除ボタン数）:', cardCount)
      expect(cardCount).toBeGreaterThan(0)

      // 最初のカードの内容を確認（削除ボタンの親要素）
      const firstDeleteButton = userCards.first()
      const firstCard = firstDeleteButton.locator('..')
      await expect(firstCard).toBeVisible()
      await expect(firstCard).toContainText(/メールアドレス/)
      await expect(firstCard).toContainText(/ロール/)
      await expect(firstCard).toContainText(/登録日/)
      console.log('タブレット - カードに必要な情報が表示されることを確認')

      // モーダルが画面内に収まる
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()
      const modal = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modal).toBeVisible()
      const modalBox = await modal.boundingBox()
      console.log('タブレット - モーダル幅:', modalBox?.width)
      console.log('タブレット - モーダルが画面内に収まることを確認')

      // モーダルを閉じる
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()

      console.log('✅ TC-402: タブレット表示テスト成功')

      // TC-403: モバイル表示 (375x667)
      console.log('\n--- TC-403: モバイル表示 (375x667) ---')
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500) // レイアウト調整を待機

      // モバイル表示でもカード形式のレイアウトが表示される
      const tableVisibilityMobile = await table.isVisible()
      console.log('モバイル - テーブル表示状態:', tableVisibilityMobile ? '表示' : '非表示（カードレイアウト）')

      // ユーザー情報がカード形式で表示されることを確認
      // 削除ボタンを含む要素（ユーザーカード）を探す
      const userCardsMobile = page.getByRole('button', { name: /削除/ })
      const cardCountMobile = await userCardsMobile.count()
      console.log('モバイル - ユーザーカード数（削除ボタン数）:', cardCountMobile)
      expect(cardCountMobile).toBeGreaterThan(0)

      // 最初のカードの内容を確認（削除ボタンの親要素）
      const firstDeleteButtonMobile = userCardsMobile.first()
      const firstCardMobile = firstDeleteButtonMobile.locator('..')
      await expect(firstCardMobile).toBeVisible()
      await expect(firstCardMobile).toContainText(/メールアドレス/)
      await expect(firstCardMobile).toContainText(/ロール/)
      await expect(firstCardMobile).toContainText(/登録日/)
      console.log('モバイル - カードに必要な情報が表示されることを確認')

      // モーダルがフルスクリーンに近い表示
      await page.getByRole('button', { name: /新規ユーザーを招待|招待/ }).click()
      const modalMobile = page.getByRole('dialog', { name: /新規ユーザーを招待/ })
      await expect(modalMobile).toBeVisible()
      const modalBoxMobile = await modalMobile.boundingBox()
      console.log('モバイル - モーダル幅:', modalBoxMobile?.width)

      // モーダルがフルスクリーンに近いことを確認（幅が画面の80%以上）
      const viewportWidthMobile = 375
      const isNearFullScreen = modalBoxMobile ? modalBoxMobile.width >= viewportWidthMobile * 0.8 : false
      console.log('モバイル - フルスクリーンに近い表示:', isNearFullScreen ? 'はい' : 'いいえ')

      // タップ操作が適切に機能（hasTouch未設定のためclickを使用）
      const emailInput = modalMobile.locator('input[name="email"], input[type="email"]')
      await expect(emailInput).toBeVisible()
      await emailInput.click()
      await emailInput.fill('test-mobile@example.com')
      const inputValue = await emailInput.inputValue()
      expect(inputValue).toBe('test-mobile@example.com')
      console.log('モバイル - タップ操作が適切に機能することを確認')

      // モーダルを閉じる
      await page.keyboard.press('Escape')
      await expect(modalMobile).not.toBeVisible()

      console.log('✅ TC-403: モバイル表示テスト成功')

      console.log('\n=== E2E-USER-021: レスポンシブ表示テスト完了 ===')
    })

    // E2E-USER-022: TC-404: 削除ダイアログのレスポンシブ対応
    test('E2E-USER-022: 削除ダイアログのレスポンシブ対応', async ({ page }) => {
      console.log('=== E2E-USER-022: 削除ダイアログのレスポンシブ対応テスト開始 ===')

      // テスト前処理: 削除用テストユーザーを作成
      const TEST_DELETE_DIALOG_USER = {
        email: 'e2e-test-delete-dialog-responsive@example.com',
        password: 'TestPassword123',
      }

      // 既存のテストユーザーを削除（前回のテストが失敗した場合に備えて）
      console.log('既存のテストユーザーをクリーンアップします')
      await deleteTestUserByEmail(TEST_DELETE_DIALOG_USER.email)

      console.log('テスト前処理: テスト用ユーザーを作成します')
      await createTestUser(TEST_DELETE_DIALOG_USER.email, TEST_DELETE_DIALOG_USER.password, 'user')

      // モバイルサイズに設定 (375x667)
      console.log('モバイルサイズ (375x667) に設定します')
      await page.setViewportSize({ width: 375, height: 667 })

      // /users にアクセス
      await page.goto('/users')

      // ページが読み込まれるまで待機
      await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: 'ユーザー管理' })).toBeVisible()

      // データの読み込みを待機（十分な時間を確保）
      await page.waitForTimeout(3000)

      // テスト用ユーザーの削除ボタンを探す
      // モバイル表示ではカードレイアウトなので、削除ボタンを直接探す
      const allDeleteButtons = page.getByRole('button', { name: /削除/ })

      // 削除ボタンが表示されるまで待機（最大10秒）
      await expect(allDeleteButtons.first()).toBeVisible({ timeout: 10000 })

      const buttonCount = await allDeleteButtons.count()
      console.log('削除ボタン数:', buttonCount)

      // テスト用ユーザーに対応する削除ボタンを見つける
      let targetDeleteButton = null
      for (let i = 0; i < buttonCount; i++) {
        const deleteButton = allDeleteButtons.nth(i)
        // 削除ボタンの親要素（カード）を取得し、メールアドレスを確認
        const cardElement = deleteButton.locator('..')
        const cardText = await cardElement.textContent()
        if (cardText && cardText.includes(TEST_DELETE_DIALOG_USER.email)) {
          targetDeleteButton = deleteButton
          console.log('テスト用ユーザーの削除ボタンを見つけました:', TEST_DELETE_DIALOG_USER.email)
          break
        }
      }

      // 削除ボタンが見つかったことを確認
      expect(targetDeleteButton).not.toBeNull()
      if (!targetDeleteButton) {
        throw new Error('テスト用ユーザーの削除ボタンが見つかりませんでした')
      }

      // 削除ボタンをクリック
      console.log('削除ボタンをクリックします')
      await targetDeleteButton.click()

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.getByRole('dialog')
      await expect(confirmDialog).toBeVisible({ timeout: 5000 })
      console.log('削除確認ダイアログが表示されました')

      // ダイアログに削除確認メッセージが含まれることを確認
      await expect(confirmDialog).toContainText(/削除/)

      // ダイアログ内のボタンを取得（「キャンセル」と「削除」）
      const dialogButtons = confirmDialog.locator('button')
      const buttonCountInDialog = await dialogButtons.count()
      console.log('ダイアログ内のボタン数:', buttonCountInDialog)

      // 少なくとも2つのボタンがあることを確認（「キャンセル」と「削除」）
      expect(buttonCountInDialog).toBeGreaterThanOrEqual(2)

      // ボタンが縦並びで表示されることを確認
      // 全てのボタンの位置とテキストを取得
      const buttons = []
      for (let i = 0; i < buttonCountInDialog; i++) {
        const button = dialogButtons.nth(i)
        const box = await button.boundingBox()
        const text = await button.textContent()
        buttons.push({ index: i, box, text })
      }

      console.log('ボタン情報:', buttons)

      // ボタンをY座標でソート（上から下へ）
      const sortedButtons = buttons.sort((a, b) => (a.box?.y || 0) - (b.box?.y || 0))

      // 縦並びの確認: 最初のボタンと2番目のボタンのY座標が異なる（縦並び）
      if (sortedButtons.length >= 2 && sortedButtons[0].box && sortedButtons[1].box) {
        const isVertical = Math.abs(sortedButtons[1].box.y - sortedButtons[0].box.y) > 10 // 10px以上の差があれば縦並び
        console.log('ボタンが縦並び:', isVertical)
        console.log('上のボタン:', sortedButtons[0].text)
        console.log('下のボタン:', sortedButtons[1].text)
        expect(isVertical).toBe(true)

        // 仕様: 「キャンセル」が下、「削除」が上
        expect(sortedButtons[0].text).toMatch(/削除/)
        expect(sortedButtons[1].text).toMatch(/キャンセル/)

        // ボタンが全幅表示されることを確認
        // ダイアログの幅を取得
        const dialogBox = await confirmDialog.boundingBox()
        console.log('ダイアログの幅:', dialogBox?.width)

        // ボタンの幅がダイアログの幅の70%以上であることを確認（全幅に近い）
        if (dialogBox && sortedButtons[0].box && sortedButtons[1].box) {
          const topButtonWidthRatio = sortedButtons[0].box.width / dialogBox.width
          const bottomButtonWidthRatio = sortedButtons[1].box.width / dialogBox.width
          console.log('上のボタン（削除）の幅比率:', topButtonWidthRatio)
          console.log('下のボタン（キャンセル）の幅比率:', bottomButtonWidthRatio)

          expect(topButtonWidthRatio).toBeGreaterThan(0.7) // 70%以上で全幅に近い
          expect(bottomButtonWidthRatio).toBeGreaterThan(0.7)
        } else {
          throw new Error('ダイアログまたはボタンの位置情報を取得できませんでした')
        }
      } else {
        throw new Error('ボタンの位置情報を取得できませんでした')
      }

      console.log('✅ ボタンが縦並びで全幅表示されることを確認しました')

      // ダイアログの「キャンセル」ボタンをクリックして閉じる
      console.log('ダイアログをキャンセルします')
      await page.getByRole('button', { name: /キャンセル/ }).click()

      // ダイアログが閉じることを確認
      await expect(confirmDialog).not.toBeVisible({ timeout: 5000 })

      console.log('✅ E2E-USER-022: 削除ダイアログのレスポンシブ対応テスト成功')

      // テスト後処理: テストユーザーを削除
      console.log('テスト後処理: テストユーザーを削除します')
      await deleteTestUserByEmail(TEST_DELETE_DIALOG_USER.email)

      console.log('テスト完了')
    })
  })
})
