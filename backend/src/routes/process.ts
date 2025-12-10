import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth'
import {
  detectPdfController,
  uploadSinglePdfController,
  uploadExcelController,
  executeProcessController,
  downloadProcessFileController,
  downloadProcessZipController,
} from '../controllers/processController'

const router = Router()

// multer設定（メモリストレージ使用）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

/**
 * POST /api/process/detect
 * 複数PDFファイルをアップロードし、取引先とPDF種別を判別
 *
 * 認証: 必須（全ユーザー）
 * ファイル: 複数可（multipart/form-data）
 * リクエストボディ: existingSlots（JSON文字列、オプション）
 */
router.post('/detect', authenticateToken, upload.array('files'), detectPdfController)

/**
 * POST /api/process/upload-single
 * 個別スロットへのPDFアップロード
 *
 * 認証: 必須（全ユーザー）
 * ファイル: 1つ（multipart/form-data）
 * リクエストボディ:
 *   - targetType: PdfType（見積書/請求書等）
 *   - existingSlots: JSON文字列（既存スロット状態）
 */
router.post(
  '/upload-single',
  authenticateToken,
  upload.single('file'),
  uploadSinglePdfController
)

/**
 * POST /api/process/upload-excel
 * 初回処理時のExcelテンプレートアップロード
 *
 * 認証: 必須（全ユーザー）
 * ファイル: 1つ（multipart/form-data）
 * リクエストボディ:
 *   - companyId: 取引先ID
 */
router.post(
  '/upload-excel',
  authenticateToken,
  upload.single('file'),
  uploadExcelController
)

/**
 * POST /api/process/execute
 * PDF処理実行（PDF解析→Excel編集→PDF生成→DB保存）
 *
 * 認証: 必須（全ユーザー）
 * ファイル: 4つのPDF（multipart/form-data）
 *   - pdf_estimate: 見積書PDF
 *   - pdf_invoice: 請求書PDF
 *   - pdf_order_confirmation: 注文請書PDF
 *   - pdf_delivery: 納品書PDF
 * リクエストボディ:
 *   - companyId: 取引先ID
 */
router.post(
  '/execute',
  authenticateToken,
  upload.fields([
    { name: 'pdf_estimate', maxCount: 1 },
    { name: 'pdf_invoice', maxCount: 1 },
    { name: 'pdf_order_confirmation', maxCount: 1 },
    { name: 'pdf_delivery', maxCount: 1 },
  ]),
  executeProcessController
)

/**
 * GET /api/process/download/:processId/:fileType
 * 個別ファイルダウンロード
 *
 * 認証: 必須（全ユーザー）
 * パラメータ:
 *   - processId: 処理ID
 *   - fileType: ファイル種別（excel/order_pdf/inspection_pdf）
 */
router.get(
  '/download/:processId/:fileType',
  authenticateToken,
  downloadProcessFileController
)

/**
 * GET /api/process/download-zip/:processId
 * ZIP一括ダウンロード（Excel + 注文書PDF + 検収書PDF）
 *
 * 認証: 必須（全ユーザー）
 * パラメータ:
 *   - processId: 処理ID
 */
router.get(
  '/download-zip/:processId',
  authenticateToken,
  downloadProcessZipController
)

export default router
