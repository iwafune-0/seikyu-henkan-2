/**
 * 取引先管理API統合テスト
 *
 * スライス3-B: 取引先管理API
 *
 * テスト対象エンドポイント:
 * - GET /api/companies - 取引先一覧取得
 * - GET /api/companies/:id - 取引先詳細取得
 * - PUT /api/companies/:id - 取引先情報更新
 * - POST /api/companies/:id/template - Excelテンプレートアップロード
 * - GET /api/companies/:id/template - Excelテンプレートダウンロード
 */

const request = require('supertest')
const path = require('path')
const fs = require('fs')
const {
  supabase,
  checkDatabaseConnection,
  createTestUser,
  deleteTestUser,
  loginTestUser,
} = require('../../utils/db-test-helper')

// テスト対象のExpressアプリケーション（server.tsの代わりにテスト用アプリを作成）
const express = require('express')
const cors = require('cors')
const companiesRoutes = require('../../../src/routes/companies').default

// テスト用Expressアプリ
const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/api/companies', companiesRoutes)

// テスト用データ
let adminUser = null
let adminToken = null
let normalUser = null
let normalToken = null
let testCompanyId = null

// ユニークなメールアドレス生成
const generateUniqueEmail = (prefix) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}-${timestamp}-${random}@test.com`
}

// テスト用Excelファイルのパス
const testExcelPath = path.join(__dirname, '../../fixtures/test_template.xlsx')

describe('取引先管理API統合テスト', () => {
  // ========================================
  // テストセットアップ
  // ========================================

  beforeAll(async () => {
    console.log('=== テストセットアップ開始 ===')

    // データベース接続確認
    const isConnected = await checkDatabaseConnection()
    expect(isConnected).toBe(true)

    // 管理者ユーザー作成
    const adminEmail = generateUniqueEmail('admin')
    adminUser = await createTestUser({
      email: adminEmail,
      password: 'Admin@1234',
      role: 'admin',
    })
    adminToken = await loginTestUser(adminEmail, 'Admin@1234')

    // 一般ユーザー作成
    const normalEmail = generateUniqueEmail('user')
    normalUser = await createTestUser({
      email: normalEmail,
      password: 'User@1234',
      role: 'user',
    })
    normalToken = await loginTestUser(normalEmail, 'User@1234')

    // テスト用取引先作成
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: 'テスト取引先',
        display_name: 'テスト取引先株式会社 御中',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('テスト用取引先作成エラー:', error)
      throw error
    }

    testCompanyId = data.id

    console.log('=== テストセットアップ完了 ===')
  }, 30000)

  afterAll(async () => {
    console.log('=== テストクリーンアップ開始 ===')

    // テスト用取引先削除
    if (testCompanyId) {
      await supabase.from('companies').delete().eq('id', testCompanyId)
    }

    // テストユーザー削除
    if (adminUser) {
      await deleteTestUser(adminUser.id)
    }

    if (normalUser) {
      await deleteTestUser(normalUser.id)
    }

    console.log('=== テストクリーンアップ完了 ===')
  }, 30000)

  // ========================================
  // GET /api/companies - 取引先一覧取得
  // ========================================

  describe('GET /api/companies', () => {
    test('管理者が取引先一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.companies).toBeDefined()
      expect(Array.isArray(response.body.data.companies)).toBe(true)
      expect(response.body.data.total).toBeGreaterThanOrEqual(1)

      // テスト用取引先が含まれているか確認
      const testCompany = response.body.data.companies.find(
        (c) => c.id === testCompanyId
      )
      expect(testCompany).toBeDefined()
      expect(testCompany.name).toBe('テスト取引先')
    })

    test('一般ユーザーは取引先一覧を取得できない（403エラー）', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${normalToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Forbidden')
    })

    test('認証なしではアクセスできない（401エラー）', async () => {
      const response = await request(app).get('/api/companies')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Unauthorized')
    })
  })

  // ========================================
  // GET /api/companies/:id - 取引先詳細取得
  // ========================================

  describe('GET /api/companies/:id', () => {
    test('管理者が取引先詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testCompanyId)
      expect(response.body.data.name).toBe('テスト取引先')
      expect(response.body.data.display_name).toBe('テスト取引先株式会社 御中')
      expect(response.body.data.is_active).toBe(true)
    })

    test('存在しない取引先IDでは404エラー', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .get(`/api/companies/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Not Found')
    })

    test('一般ユーザーは取引先詳細を取得できない（403エラー）', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${normalToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })

  // ========================================
  // PUT /api/companies/:id - 取引先情報更新
  // ========================================

  describe('PUT /api/companies/:id', () => {
    test('管理者が取引先情報を更新できる', async () => {
      const updateData = {
        name: 'テスト取引先（更新後）',
        display_name: 'テスト取引先株式会社（更新後） 御中',
        is_active: false,
      }

      const response = await request(app)
        .put(`/api/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.company.name).toBe(updateData.name)
      expect(response.body.data.company.display_name).toBe(updateData.display_name)
      expect(response.body.data.company.is_active).toBe(false)
    })

    test('空の名前では400エラー', async () => {
      const updateData = {
        name: '',
      }

      const response = await request(app)
        .put(`/api/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    test('一般ユーザーは取引先情報を更新できない（403エラー）', async () => {
      const updateData = {
        name: '不正な更新',
      }

      const response = await request(app)
        .put(`/api/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${normalToken}`)
        .send(updateData)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })

  // ========================================
  // POST /api/companies/:id/template - Excelテンプレートアップロード
  // ========================================

  describe('POST /api/companies/:id/template', () => {
    test('管理者がExcelテンプレートをアップロードできる', async () => {
      // テスト用Excelファイルが存在しない場合は作成
      if (!fs.existsSync(testExcelPath)) {
        const fixturesDir = path.dirname(testExcelPath)
        if (!fs.existsSync(fixturesDir)) {
          fs.mkdirSync(fixturesDir, { recursive: true })
        }

        // ダミーのExcelファイルを作成（最小限のZIP構造）
        const Buffer = require('buffer').Buffer
        const dummyExcel = Buffer.from(
          'UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAsAAABfcmVscy8ucmVsc61RS0sDMRC9C/6HkHst',
          'base64'
        )
        fs.writeFileSync(testExcelPath, dummyExcel)
      }

      const response = await request(app)
        .post(`/api/companies/${testCompanyId}/template`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testExcelPath)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.filename).toBeDefined()
      expect(response.body.data.updated_at).toBeDefined()
    }, 10000)

    test('ファイルなしでは400エラー', async () => {
      const response = await request(app)
        .post(`/api/companies/${testCompanyId}/template`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    test('一般ユーザーはテンプレートをアップロードできない（403エラー）', async () => {
      const response = await request(app)
        .post(`/api/companies/${testCompanyId}/template`)
        .set('Authorization', `Bearer ${normalToken}`)
        .attach('file', testExcelPath)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })

  // ========================================
  // GET /api/companies/:id/template - Excelテンプレートダウンロード
  // ========================================

  describe('GET /api/companies/:id/template', () => {
    test('管理者がExcelテンプレートをダウンロードできる', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompanyId}/template`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['content-disposition']).toMatch(/attachment/)
      expect(response.body).toBeDefined()
    })

    test('テンプレートが存在しない取引先では404エラー', async () => {
      // テンプレートなしの新規取引先を作成
      const { data: newCompany } = await supabase
        .from('companies')
        .insert({
          name: 'テンプレートなし取引先',
          display_name: 'テンプレートなし取引先株式会社 御中',
          is_active: true,
        })
        .select()
        .single()

      const response = await request(app)
        .get(`/api/companies/${newCompany.id}/template`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)

      // クリーンアップ
      await supabase.from('companies').delete().eq('id', newCompany.id)
    })

    test('一般ユーザーはテンプレートをダウンロードできない（403エラー）', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompanyId}/template`)
        .set('Authorization', `Bearer ${normalToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })
})
