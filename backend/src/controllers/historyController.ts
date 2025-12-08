import { Request, Response } from 'express'
import archiver from 'archiver'
import {
  getAllHistory,
  getFileById,
  getFilesForZip,
} from '../services/historyService'
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendInternalError,
} from '../utils/response'
import { HistoryListResponse, HistoryFilters, DownloadFileType } from '../types/index'

/**
 * 処理履歴一覧取得コントローラー
 *
 * GET /api/history
 * 権限: 全ユーザー（認証必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function getHistoryController(req: Request, res: Response): Promise<void> {
  try {
    // クエリパラメータからフィルター条件を取得
    const filters: HistoryFilters = {
      company_id: req.query.company_id as string | undefined,
      user_id: req.query.user_id as string | undefined,
      status: req.query.status as 'success' | 'error' | '' | undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      sort_order: req.query.sort_order as 'desc' | 'asc' | undefined,
    }

    const history = await getAllHistory(filters)

    const response: HistoryListResponse = {
      history,
      total: history.length,
    }

    sendSuccess(res, response)
  } catch (error) {
    sendInternalError(res, error, '処理履歴の取得に失敗しました')
  }
}

/**
 * 個別ファイルダウンロードコントローラー
 *
 * GET /api/history/:id/download/:fileType
 * 権限: 全ユーザー（認証必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function downloadFileController(req: Request, res: Response): Promise<void> {
  try {
    const { id, fileType } = req.params

    // バリデーション
    if (!id) {
      sendBadRequest(res, '処理履歴IDが指定されていません')
      return
    }

    if (!fileType) {
      sendBadRequest(res, 'ファイルタイプが指定されていません')
      return
    }

    // ファイルタイプの妥当性チェック
    const validFileTypes: DownloadFileType[] = [
      'excel',
      'order_pdf',
      'inspection_pdf',
      'input_pdf_1',
      'input_pdf_2',
      'input_pdf_3',
      'input_pdf_4',
    ]

    if (!validFileTypes.includes(fileType as DownloadFileType)) {
      sendBadRequest(res, `無効なファイルタイプです: ${fileType}`)
      return
    }

    // ファイル取得
    const file = await getFileById(id, fileType as DownloadFileType)

    if (!file) {
      sendNotFound(res, 'ファイルが見つかりません')
      return
    }

    // Content-Typeの決定
    let contentType = 'application/octet-stream'

    if (fileType === 'excel') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (fileType.includes('pdf')) {
      contentType = 'application/pdf'
    }

    // バイナリデータとして返却
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`)
    res.send(file.buffer)
  } catch (error) {
    sendInternalError(res, error, 'ファイルのダウンロードに失敗しました')
  }
}

/**
 * ZIP一括ダウンロードコントローラー
 *
 * GET /api/history/:id/download-zip
 * 権限: 全ユーザー（認証必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function downloadZipController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    // バリデーション
    if (!id) {
      sendBadRequest(res, '処理履歴IDが指定されていません')
      return
    }

    // ファイル一覧取得
    const result = await getFilesForZip(id)

    if (!result) {
      sendNotFound(res, '処理履歴が見つかりません')
      return
    }

    // エラー発生時の処理はダウンロード不可
    if (result.status === 'error') {
      sendBadRequest(res, 'エラー発生時の処理はダウンロードできません')
      return
    }

    if (result.files.length === 0) {
      sendNotFound(res, 'ダウンロード可能なファイルがありません')
      return
    }

    // ZIPファイル名の生成（最初のファイル名から会社名と日付を抽出）
    const firstFilename = result.files[0].filename
    const zipFilename = firstFilename.replace(/\.(xlsx|pdf)$/, '.zip')

    // レスポンスヘッダー設定
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFilename)}"`)

    // archiverでZIP生成
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 最大圧縮
    })

    // エラーハンドリング
    archive.on('error', (err: Error) => {
      console.error('ZIP生成エラー:', err)
      throw err
    })

    // レスポンスストリームにパイプ
    archive.pipe(res)

    // ファイルをZIPに追加
    for (const file of result.files) {
      archive.append(file.buffer, { name: file.filename })
    }

    // ZIP生成完了
    await archive.finalize()
  } catch (error) {
    sendInternalError(res, error, 'ZIPファイルの生成に失敗しました')
  }
}
