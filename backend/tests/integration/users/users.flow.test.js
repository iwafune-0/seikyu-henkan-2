/**
 * ユーザー管理API統合テスト（スライス3-A）
 *
 * 実装されたエンドポイント:
 * - GET /api/users（ユーザー一覧取得）
 * - POST /api/users/invite（ユーザー招待）
 * - PATCH /api/users/:id/role（ロール変更）
 * - DELETE /api/users/:id（論理削除）
 *
 * テスト方針:
 * - 実際のSupabase環境を使用（モックなし）
 * - テストデータはユニークID（タイムスタンプ+ランダム文字列）で管理
 * - 各テストケースは独立して実行可能
 * - テスト完了後にクリーンアップを実施
 */

const axios = require('axios')
const {
  supabase,
  checkDatabaseConnection,
  createTestUser,
  deleteTestUser,
  deleteTestUserByEmail,
  loginTestUser,
} = require('../../utils/db-test-helper')

// テスト対象のAPIベースURL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'

// テスト用ユーザー情報を保持
let testAdminUser = null
let testNormalUser = null
let adminToken = null

/**
 * ユニークなメールアドレスを生成
 */
function generateUniqueEmail(prefix = 'test') {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(7)
  return `${prefix}-${timestamp}-${randomStr}@test.example.com`
}

/**
 * テストスイート開始前の準備
 */
beforeAll(async () => {
  console.log('========================================')
  console.log('ユーザー管理API統合テスト開始')
  console.log('========================================')

  // データベース接続確認
  const isConnected = await checkDatabaseConnection()
  if (!isConnected) {
    throw new Error('データベース接続に失敗しました')
  }

  // テスト用管理者ユーザーを作成
  const adminEmail = generateUniqueEmail('admin')
  const adminPassword = 'TestAdmin123!'

  testAdminUser = await createTestUser({
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  })

  // 管理者トークンを取得
  adminToken = await loginTestUser(adminEmail, adminPassword)

  console.log(`✅ テスト用管理者ユーザー作成完了: ${testAdminUser.email}`)

  // テスト用一般ユーザーを作成
  const normalEmail = generateUniqueEmail('user')
  const normalPassword = 'TestUser123!'

  testNormalUser = await createTestUser({
    email: normalEmail,
    password: normalPassword,
    role: 'user',
  })

  console.log(`✅ テスト用一般ユーザー作成完了: ${testNormalUser.email}`)
  console.log('========================================\n')
})

/**
 * テストスイート完了後のクリーンアップ
 */
afterAll(async () => {
  console.log('\n========================================')
  console.log('テスト環境クリーンアップ')
  console.log('========================================')

  // テスト用ユーザーを削除
  if (testAdminUser) {
    await deleteTestUser(testAdminUser.id)
    console.log(`✅ テスト用管理者削除完了: ${testAdminUser.email}`)
  }

  if (testNormalUser) {
    await deleteTestUser(testNormalUser.id)
    console.log(`✅ テスト用一般ユーザー削除完了: ${testNormalUser.email}`)
  }

  console.log('========================================')
})

describe('ユーザー管理API統合テスト', () => {
  /**
   * GET /api/users - ユーザー一覧取得
   */
  describe('GET /api/users', () => {
    it('管理者はユーザー一覧を取得できる', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('users')
      expect(response.data.data).toHaveProperty('total')
      expect(Array.isArray(response.data.data.users)).toBe(true)

      // テスト用ユーザーが含まれていることを確認
      const users = response.data.data.users
      const foundAdmin = users.find((u) => u.email === testAdminUser.email)
      const foundUser = users.find((u) => u.email === testNormalUser.email)

      expect(foundAdmin).toBeTruthy()
      expect(foundUser).toBeTruthy()
    })

    it('認証トークンがない場合は401エラー', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/users`)
        fail('401エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
      }
    })
  })

  /**
   * POST /api/users/invite - ユーザー招待
   */
  describe('POST /api/users/invite', () => {
    let invitedUserEmail = null

    afterEach(async () => {
      // 招待したユーザーをクリーンアップ
      if (invitedUserEmail) {
        await deleteTestUserByEmail(invitedUserEmail)
        invitedUserEmail = null
      }
    })

    it('管理者は新しいユーザーを招待できる', async () => {
      invitedUserEmail = generateUniqueEmail('invited')

      const response = await axios.post(
        `${API_BASE_URL}/api/users/invite`,
        {
          email: invitedUserEmail,
          role: 'user',
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )

      expect(response.status).toBe(201)
      expect(response.data.success).toBe(true)
      expect(response.data.data.message).toContain('招待メールを送信しました')
    })

    it('既に登録されているメールアドレスへの招待はエラー', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/users/invite`,
          {
            email: testNormalUser.email, // 既存ユーザー
            role: 'user',
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        )
        fail('400エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.message).toContain('既に登録されています')
      }
    })

    it('メールアドレスが不正な場合は400エラー', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/users/invite`,
          {
            email: 'invalid-email', // 不正なメールアドレス
            role: 'user',
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        )
        fail('400エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
      }
    })
  })

  /**
   * PATCH /api/users/:id/role - ロール変更
   */
  describe('PATCH /api/users/:id/role', () => {
    it('管理者はユーザーのロールを変更できる', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/${testNormalUser.id}/role`,
        {
          role: 'admin',
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.user.role).toBe('admin')

      // ロールを元に戻す
      await axios.patch(
        `${API_BASE_URL}/api/users/${testNormalUser.id}/role`,
        {
          role: 'user',
        },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )
    })

    it('最終管理者の降格は拒否される', async () => {
      // 一時的に他の管理者を削除して最終管理者状態にする
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_deleted', false)
        .eq('role', 'admin')

      const otherAdmins = allUsers.filter((u) => u.id !== testAdminUser.id)

      // 他の管理者を一時的に論理削除
      for (const admin of otherAdmins) {
        await supabase
          .from('profiles')
          .update({ is_deleted: true })
          .eq('id', admin.id)
      }

      try {
        // 最終管理者の降格を試みる
        await axios.patch(
          `${API_BASE_URL}/api/users/${testAdminUser.id}/role`,
          {
            role: 'user',
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        )
        fail('400エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.message).toContain('最終管理者')
      } finally {
        // 他の管理者を復元
        for (const admin of otherAdmins) {
          await supabase
            .from('profiles')
            .update({ is_deleted: false })
            .eq('id', admin.id)
        }
      }
    })

    it('存在しないユーザーIDの場合は404エラー', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      try {
        await axios.patch(
          `${API_BASE_URL}/api/users/${fakeUserId}/role`,
          {
            role: 'admin',
          },
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        )
        fail('404エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.success).toBe(false)
      }
    })
  })

  /**
   * DELETE /api/users/:id - 論理削除
   */
  describe('DELETE /api/users/:id', () => {
    let deletableUser = null

    beforeEach(async () => {
      // 削除用のテストユーザーを作成
      const email = generateUniqueEmail('deletable')
      const password = 'TestDelete123!'

      deletableUser = await createTestUser({
        email,
        password,
        role: 'user',
      })
    })

    afterEach(async () => {
      // クリーンアップ
      if (deletableUser) {
        await deleteTestUser(deletableUser.id)
        deletableUser = null
      }
    })

    it('管理者はユーザーを論理削除できる', async () => {
      const response = await axios.delete(
        `${API_BASE_URL}/api/users/${deletableUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data.message).toContain('削除しました')

      // データベースで論理削除を確認
      const { data: deletedUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', deletableUser.id)
        .single()

      expect(deletedUser.is_deleted).toBe(true)
      expect(deletedUser.deleted_at).toBeTruthy()
    })

    it('最終管理者の削除は拒否される', async () => {
      // 一時的に他の管理者を削除して最終管理者状態にする
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_deleted', false)
        .eq('role', 'admin')

      const otherAdmins = allUsers.filter((u) => u.id !== testAdminUser.id)

      // 他の管理者を一時的に論理削除
      for (const admin of otherAdmins) {
        await supabase
          .from('profiles')
          .update({ is_deleted: true })
          .eq('id', admin.id)
      }

      try {
        // 最終管理者の削除を試みる
        await axios.delete(`${API_BASE_URL}/api/users/${testAdminUser.id}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })
        fail('400エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.message).toContain('最終管理者')
      } finally {
        // 他の管理者を復元
        for (const admin of otherAdmins) {
          await supabase
            .from('profiles')
            .update({ is_deleted: false })
            .eq('id', admin.id)
        }
      }
    })

    it('存在しないユーザーIDの場合は404エラー', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      try {
        await axios.delete(`${API_BASE_URL}/api/users/${fakeUserId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })
        fail('404エラーが発生すべき')
      } catch (error) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.success).toBe(false)
      }
    })
  })
})
