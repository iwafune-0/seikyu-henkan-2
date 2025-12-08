import express from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import {
  getCompaniesController,
  getCompanyByIdController,
  updateCompanyController,
  uploadTemplateController,
  downloadTemplateController,
} from '../controllers/companiesController'

const router = express.Router()

/**
 * multer設定（メモリストレージ）
 *
 * ファイルはメモリに一時保存し、BYTEA型でデータベースに保存する。
 * ファイル形式: .xlsx のみ
 * ファイルサイズ: 最大10MB
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // ファイル形式チェック（.xlsxのみ）
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true)
    } else {
      cb(new Error('Excelファイル（.xlsx）のみアップロード可能です'))
    }
  },
})

/**
 * 取引先一覧取得
 *
 * GET /api/companies
 * 権限: 管理者専用
 */
router.get('/', authenticateToken, requireAdmin, getCompaniesController)

/**
 * 取引先詳細取得
 *
 * GET /api/companies/:id
 * 権限: 管理者専用
 */
router.get('/:id', authenticateToken, requireAdmin, getCompanyByIdController)

/**
 * 取引先情報更新
 *
 * PUT /api/companies/:id
 * 権限: 管理者専用
 */
router.put('/:id', authenticateToken, requireAdmin, updateCompanyController)

/**
 * Excelテンプレートアップロード
 *
 * POST /api/companies/:id/template
 * 権限: 管理者専用
 */
router.post(
  '/:id/template',
  authenticateToken,
  requireAdmin,
  upload.single('file'),
  uploadTemplateController
)

/**
 * Excelテンプレートダウンロード
 *
 * GET /api/companies/:id/template
 * 権限: 管理者専用
 */
router.get('/:id/template', authenticateToken, requireAdmin, downloadTemplateController)

export default router
