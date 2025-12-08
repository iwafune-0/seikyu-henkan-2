/**
 * PDF処理API統合テスト（スライス5: 検出）
 *
 * テスト対象:
 * - POST /api/process/detect - 複数PDFファイル判別
 * - POST /api/process/upload-single - 個別スロットへのPDFアップロード
 * - POST /api/process/upload-excel - Excelテンプレートアップロード
 */

const request = require('supertest')
const {
  createTestUser,
  deleteTestUser,
  loginTestUser,
  supabase,
} = require('../../utils/db-test-helper')

const API_BASE_URL = `http://localhost:${process.env.PORT || 3001}`

describe('PDF処理API統合テスト（スライス5: 検出）', () => {
  let adminToken = null
  let adminUserId = null
  let testCompanyId = null

  // テスト用PDFダミーデータ（実際のPDFではないがmulterは受け付ける）
  const createPdfBuffer = (filename) => {
    return Buffer.from(`%PDF-1.4\nTest PDF: ${filename}`)
  }

  // テスト用Excelダミーデータ
  const createExcelBuffer = (filename) => {
    return Buffer.from(`Excel dummy data: ${filename}`)
  }

  beforeAll(async () => {
    // 管理者ユーザー作成
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const adminEmail = `test-admin-process-${uniqueId}@test.com`
    const adminPassword = 'TestPass123'

    const admin = await createTestUser({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    })

    adminUserId = admin.id
    adminToken = await loginTestUser(adminEmail, adminPassword)

    // テスト用取引先を取得（既存のネクストビッツ）
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'ネクストビッツ')
      .single()

    if (companies) {
      testCompanyId = companies.id
    } else {
      throw new Error('テスト用取引先が見つかりません')
    }
  })

  afterAll(async () => {
    // テストユーザー削除
    if (adminUserId) {
      await deleteTestUser(adminUserId)
    }
  })

  describe('POST /api/process/detect', () => {
    it('正常系: ネクストビッツのPDFファイル4つを正しく判別できる', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/detect')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', createPdfBuffer('TRR-25-011_お見積書.pdf'), 'TRR-25-011_お見積書.pdf')
        .attach('files', createPdfBuffer('TRR-25-011_請求書.pdf'), 'TRR-25-011_請求書.pdf')
        .attach('files', createPdfBuffer('TRR-25-011_注文請書.pdf'), 'TRR-25-011_注文請書.pdf')
        .attach('files', createPdfBuffer('TRR-25-011_納品書.pdf'), 'TRR-25-011_納品書.pdf')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('company')
      expect(response.body.data.company.name).toBe('ネクストビッツ')
      expect(response.body.data).toHaveProperty('pdfSlots')
      expect(response.body.data.pdfSlots).toHaveLength(4)
      expect(response.body.data).toHaveProperty('preCheck')
      expect(response.body.data.preCheck.passed).toBe(true)
      expect(response.body.data).toHaveProperty('needsExcel')
    })

    it('正常系: オフ・ビート・ワークスのPDFファイル4つを正しく判別できる', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/detect')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', createPdfBuffer('1951030見積-offbeat-to-terra-202511.pdf'), '1951030見積-offbeat-to-terra-202511.pdf')
        .attach('files', createPdfBuffer('2951030-請求_offbeat-to-terra-202511.pdf'), '2951030-請求_offbeat-to-terra-202511.pdf')
        .attach('files', createPdfBuffer('請書-offbeat-to-terra-202511.pdf'), '請書-offbeat-to-terra-202511.pdf')
        .attach('files', createPdfBuffer('3951030-納品-offbeat-to-terra-202511.pdf'), '3951030-納品-offbeat-to-terra-202511.pdf')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.company.name).toBe('オフ・ビート・ワークス')
      expect(response.body.data.pdfSlots).toHaveLength(4)
      expect(response.body.data.preCheck.passed).toBe(true)
    })

    it('異常系: ファイルなしでアップロード', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/detect')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('ファイルがアップロードされていません')
    })

    it('異常系: 取引先混在（ネクストビッツとオフ・ビート・ワークス）', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/detect')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', createPdfBuffer('TRR-25-011_お見積書.pdf'), 'TRR-25-011_お見積書.pdf')
        .attach('files', createPdfBuffer('1951030見積-offbeat-to-terra-202511.pdf'), '1951030見積-offbeat-to-terra-202511.pdf')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('異なる取引先のファイルが混在しています')
    })

    it('異常系: 取引先判別不可のファイル', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/detect')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', createPdfBuffer('unknown-見積書.pdf'), 'unknown-見積書.pdf')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('取引先を判別できませんでした')
    })

    it('異常系: 認証トークンなし', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/detect')
        .attach('files', createPdfBuffer('TRR-25-011_お見積書.pdf'), 'TRR-25-011_お見積書.pdf')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/process/upload-single', () => {
    it('正常系: 個別スロットへのPDFアップロード', async () => {
      const existingSlots = [
        {
          type: 'estimate',
          file: null,
          status: 'empty',
        },
        {
          type: 'invoice',
          file: null,
          status: 'empty',
        },
        {
          type: 'order_confirmation',
          file: null,
          status: 'empty',
        },
        {
          type: 'delivery',
          file: null,
          status: 'empty',
        },
      ]

      const response = await request(API_BASE_URL)
        .post('/api/process/upload-single')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('targetType', 'estimate')
        .field('existingSlots', JSON.stringify(existingSlots))
        .attach('file', createPdfBuffer('TRR-25-011_お見積書.pdf'), 'TRR-25-011_お見積書.pdf')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('company')
      expect(response.body.data.company.name).toBe('ネクストビッツ')
      expect(response.body.data.pdfSlots[0].status).toBe('uploaded')
    })

    it('異常系: 種別不一致（見積書を請求書スロットにアップロード）', async () => {
      const existingSlots = [
        {
          type: 'estimate',
          file: null,
          status: 'empty',
        },
        {
          type: 'invoice',
          file: null,
          status: 'empty',
        },
        {
          type: 'order_confirmation',
          file: null,
          status: 'empty',
        },
        {
          type: 'delivery',
          file: null,
          status: 'empty',
        },
      ]

      const response = await request(API_BASE_URL)
        .post('/api/process/upload-single')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('targetType', 'invoice')
        .field('existingSlots', JSON.stringify(existingSlots))
        .attach('file', createPdfBuffer('TRR-25-011_お見積書.pdf'), 'TRR-25-011_お見積書.pdf')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('PDF種別と指定されたスロットが一致しません')
    })

    it('異常系: ファイルなし', async () => {
      const existingSlots = [
        {
          type: 'estimate',
          file: null,
          status: 'empty',
        },
        {
          type: 'invoice',
          file: null,
          status: 'empty',
        },
        {
          type: 'order_confirmation',
          file: null,
          status: 'empty',
        },
        {
          type: 'delivery',
          file: null,
          status: 'empty',
        },
      ]

      const response = await request(API_BASE_URL)
        .post('/api/process/upload-single')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('targetType', 'estimate')
        .field('existingSlots', JSON.stringify(existingSlots))

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('ファイルがアップロードされていません')
    })
  })

  describe('POST /api/process/upload-excel', () => {
    it('正常系: Excelテンプレートアップロード（ネクストビッツ）', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/upload-excel')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('companyId', testCompanyId)
        .attach('file', createExcelBuffer('テラ【ネクストビッツ御中】テンプレート.xlsx'), 'テラ【ネクストビッツ御中】テンプレート.xlsx')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('テンプレート')
      expect(response.body.message).toContain('アップロードしました')
    })

    it('異常系: ファイル名に取引先名が含まれていない', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/upload-excel')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('companyId', testCompanyId)
        .attach('file', createExcelBuffer('テンプレート.xlsx'), 'テンプレート.xlsx')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('取引先名')
    })

    it('異常系: companyIdなし', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/upload-excel')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createExcelBuffer('テラ【ネクストビッツ御中】テンプレート.xlsx'), 'テラ【ネクストビッツ御中】テンプレート.xlsx')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('companyId')
    })

    it('異常系: ファイルなし', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/process/upload-excel')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('companyId', testCompanyId)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('ファイルがアップロードされていません')
    })
  })
})
