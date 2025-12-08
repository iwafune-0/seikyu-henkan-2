/**
 * 認証・認可基盤 統合テスト
 *
 * スライス2: JWTミドルウェア、管理者権限チェック、profilesテーブル操作
 *
 * 実データ主義: モックは使用せず、実際のSupabase環境でテストを実施
 */

const {
  createTestUser,
  deleteTestUserByEmail,
  loginTestUser,
  checkDatabaseConnection,
} = require('../../utils/db-test-helper')
const {
  getProfileByUserId,
  isUserDeleted,
  getUserRole,
  getUserEmail,
} = require('../../../src/services/profileService')

describe('認証・認可基盤 統合テスト', () => {
  // テスト用ユーザー情報（ユニークIDで分離）
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  const testUsers = {
    admin: {
      email: `test-admin-${uniqueId}@test.com`,
      password: 'TestPassword123!',
      role: 'admin',
    },
    user: {
      email: `test-user-${uniqueId}@test.com`,
      password: 'TestPassword123!',
      role: 'user',
    },
  }

  let adminUserId
  let normalUserId
  let adminToken
  let userToken

  // ========================================
  // テストセットアップ
  // ========================================

  beforeAll(async () => {
    console.log('\n===== 認証・認可基盤テスト開始 =====\n')

    // データベース接続確認
    const connected = await checkDatabaseConnection()
    if (!connected) {
      throw new Error('データベース接続に失敗しました')
    }

    // 既存のテストユーザーをクリーンアップ（念のため）
    await deleteTestUserByEmail(testUsers.admin.email)
    await deleteTestUserByEmail(testUsers.user.email)

    console.log('テストユーザー作成中...')

    // 管理者ユーザー作成
    const adminUser = await createTestUser(testUsers.admin)
    adminUserId = adminUser.id
    console.log(`✅ 管理者ユーザー作成: ${testUsers.admin.email}`)

    // 一般ユーザー作成
    const normalUser = await createTestUser(testUsers.user)
    normalUserId = normalUser.id
    console.log(`✅ 一般ユーザー作成: ${testUsers.user.email}`)

    // トークン取得
    adminToken = await loginTestUser(
      testUsers.admin.email,
      testUsers.admin.password
    )
    userToken = await loginTestUser(
      testUsers.user.email,
      testUsers.user.password
    )

    console.log('✅ トークン取得完了\n')
  })

  afterAll(async () => {
    console.log('\nテストデータクリーンアップ中...')

    // テスト用ユーザー削除
    await deleteTestUserByEmail(testUsers.admin.email)
    await deleteTestUserByEmail(testUsers.user.email)

    console.log('✅ クリーンアップ完了\n')
    console.log('===== 認証・認可基盤テスト終了 =====\n')
  })

  // ========================================
  // profilesテーブル操作ヘルパーのテスト
  // ========================================

  describe('profilesテーブル操作ヘルパー', () => {
    test('getProfileByUserId: 管理者ユーザー情報を正常に取得できる', async () => {
      const profile = await getProfileByUserId(adminUserId)

      expect(profile).not.toBeNull()
      expect(profile.id).toBe(adminUserId)
      expect(profile.email).toBe(testUsers.admin.email)
      expect(profile.role).toBe('admin')
      expect(profile.is_deleted).toBe(false)
    })

    test('getProfileByUserId: 一般ユーザー情報を正常に取得できる', async () => {
      const profile = await getProfileByUserId(normalUserId)

      expect(profile).not.toBeNull()
      expect(profile.id).toBe(normalUserId)
      expect(profile.email).toBe(testUsers.user.email)
      expect(profile.role).toBe('user')
      expect(profile.is_deleted).toBe(false)
    })

    test('getProfileByUserId: 存在しないユーザーIDの場合はnullを返す', async () => {
      const profile = await getProfileByUserId('00000000-0000-0000-0000-000000000000')

      expect(profile).toBeNull()
    })

    test('isUserDeleted: 削除されていないユーザーの場合はfalseを返す', async () => {
      const deleted = await isUserDeleted(adminUserId)

      expect(deleted).toBe(false)
    })

    test('getUserRole: 管理者ロールを正常に取得できる', async () => {
      const role = await getUserRole(adminUserId)

      expect(role).toBe('admin')
    })

    test('getUserRole: 一般ユーザーロールを正常に取得できる', async () => {
      const role = await getUserRole(normalUserId)

      expect(role).toBe('user')
    })

    test('getUserEmail: メールアドレスを正常に取得できる', async () => {
      const email = await getUserEmail(adminUserId)

      expect(email).toBe(testUsers.admin.email)
    })

    test('getUserEmail: 存在しないユーザーIDの場合はnullを返す', async () => {
      const email = await getUserEmail('00000000-0000-0000-0000-000000000000')

      expect(email).toBeNull()
    })
  })

  // ========================================
  // JWTトークン検証のテスト（実際のAPIリクエストで検証）
  // ========================================

  describe('JWTトークン検証', () => {
    test('管理者トークンが正常に取得できている', () => {
      expect(adminToken).toBeTruthy()
      expect(typeof adminToken).toBe('string')
      expect(adminToken.length).toBeGreaterThan(0)
    })

    test('一般ユーザートークンが正常に取得できている', () => {
      expect(userToken).toBeTruthy()
      expect(typeof userToken).toBe('string')
      expect(userToken.length).toBeGreaterThan(0)
    })

    // 注: JWTミドルウェアの実際の動作は、APIエンドポイントが作成された後にテストされます
    // このテストでは、トークンが正常に取得できることのみを確認します
  })

  // ========================================
  // エラーレスポンス統一ヘルパーのテスト
  // ========================================

  describe('エラーレスポンス統一ヘルパー', () => {
    const {
      sendSuccess,
      sendBadRequest,
      sendUnauthorized,
      sendForbidden,
      sendNotFound,
      sendInternalError,
    } = require('../../../src/utils/response')

    test('sendSuccess: 成功レスポンスを正しく生成できる', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      sendSuccess(mockRes, { id: 1, name: 'test' }, '成功しました', 200)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '成功しました',
        data: { id: 1, name: 'test' },
      })
    })

    test('sendBadRequest: 400エラーレスポンスを正しく生成できる', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      sendBadRequest(mockRes, 'リクエストが不正です')

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad Request',
        message: 'リクエストが不正です',
      })
    })

    test('sendUnauthorized: 401エラーレスポンスを正しく生成できる', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      sendUnauthorized(mockRes, '認証が必要です')

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: '認証が必要です',
      })
    })

    test('sendForbidden: 403エラーレスポンスを正しく生成できる', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      sendForbidden(mockRes, '権限がありません')

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: '権限がありません',
      })
    })

    test('sendNotFound: 404エラーレスポンスを正しく生成できる', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      sendNotFound(mockRes, 'リソースが見つかりません')

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not Found',
        message: 'リソースが見つかりません',
      })
    })

    test('sendInternalError: 500エラーレスポンスを正しく生成できる', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      const error = new Error('Internal error occurred')
      sendInternalError(mockRes, error)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
          message: 'Internal error occurred',
        })
      )
    })
  })
})
