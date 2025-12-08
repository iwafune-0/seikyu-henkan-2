import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getHistoryController,
  downloadFileController,
  downloadZipController,
} from '../controllers/historyController'

const router = Router()

/**
 * 処理履歴ルート
 *
 * 全エンドポイントで認証必須（authenticateToken）
 * 全ユーザーがアクセス可能（管理者専用ではない）
 */

/**
 * GET /api/history
 * 処理履歴一覧を取得（フィルター対応）
 *
 * クエリパラメータ:
 * - company_id: 取引先ID（任意）
 * - user_id: ユーザーID（任意）
 * - status: 処理ステータス（success/error）（任意）
 * - date_from: 処理日（開始）YYYY-MM-DD（任意）
 * - date_to: 処理日（終了）YYYY-MM-DD（任意）
 * - sort_order: 並び順（desc/asc、デフォルト: desc）（任意）
 */
router.get('/', authenticateToken, getHistoryController)

/**
 * GET /api/history/:id/download/:fileType
 * 個別ファイルをダウンロード
 *
 * パスパラメータ:
 * - id: 処理履歴ID
 * - fileType: ファイルタイプ（excel, order_pdf, inspection_pdf, input_pdf_1~4）
 */
router.get('/:id/download/:fileType', authenticateToken, downloadFileController)

/**
 * GET /api/history/:id/download-zip
 * ZIP一括ダウンロード
 *
 * パスパラメータ:
 * - id: 処理履歴ID
 *
 * 注意: エラー発生時の処理はダウンロード不可（400エラー）
 */
router.get('/:id/download-zip', authenticateToken, downloadZipController)

export default router
