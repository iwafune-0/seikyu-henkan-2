/**
 * P-003: 処理履歴・ダウンロードサービス
 *
 * バックエンドAPI (/api/history) と通信
 * Phase 8でモックから実APIに切り替え
 */

import { apiGet, apiDownloadBlob, triggerDownload } from '@/lib/api'
import {
  API_PATHS,
  type HistoryFilters,
  type HistoryListResponse,
  type DownloadFileType,
} from '@/types'

/**
 * 処理履歴一覧を取得（フィルター対応）
 * GET /api/history
 *
 * クエリパラメータ:
 * - company_id: 取引先ID（任意）
 * - user_id: ユーザーID（任意）
 * - status: 処理ステータス（success/error）（任意）
 * - date_from: 処理日（開始）YYYY-MM-DD（任意）
 * - date_to: 処理日（終了）YYYY-MM-DD（任意）
 * - sort_order: 並び順（desc/asc、デフォルト: desc）（任意）
 */
export async function fetchHistory(filters?: HistoryFilters): Promise<HistoryListResponse> {
  // クエリパラメータを構築
  const params = new URLSearchParams()

  if (filters) {
    if (filters.company_id) params.append('company_id', filters.company_id)
    if (filters.user_id) params.append('user_id', filters.user_id)
    if (filters.status) params.append('status', filters.status)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.sort_order) params.append('sort_order', filters.sort_order)
  }

  const queryString = params.toString()
  const endpoint = queryString
    ? `${API_PATHS.HISTORY.LIST}?${queryString}`
    : API_PATHS.HISTORY.LIST

  return apiGet<HistoryListResponse>(endpoint)
}

/**
 * 個別ファイルをダウンロード
 * GET /api/history/:id/download/:fileType
 *
 * fileType: 'excel' | 'order_pdf' | 'inspection_pdf' | 'input_pdf_1' | 'input_pdf_2' | 'input_pdf_3' | 'input_pdf_4'
 */
export async function downloadFile(
  historyId: string,
  fileType: DownloadFileType
): Promise<void> {
  const { blob, filename } = await apiDownloadBlob(
    API_PATHS.HISTORY.DOWNLOAD_FILE(historyId, fileType)
  )
  triggerDownload(blob, filename)
}

/**
 * ZIP一括ダウンロード
 * GET /api/history/:id/download-zip
 *
 * 生成ファイル（Excel、注文書PDF、検収書PDF）をZIPにまとめてダウンロード
 * エラー発生時の処理はダウンロード不可
 */
export async function downloadZip(historyId: string): Promise<void> {
  const { blob, filename } = await apiDownloadBlob(
    API_PATHS.HISTORY.DOWNLOAD_ZIP(historyId)
  )
  triggerDownload(blob, filename)
}
