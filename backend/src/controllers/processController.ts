import { Request, Response } from 'express'
import archiver from 'archiver'
import {
  sendSuccess,
  sendBadRequest,
  sendInternalError,
  sendNotFound,
} from '../utils/response'
import {
  detectPdfFiles,
  uploadSinglePdf,
  validateExcelFilename,
  executeProcess,
} from '../services/processService'
import { uploadTemplate, getCompanyById } from '../services/companiesService'
import { supabase } from '../lib/supabase'
import type { PdfType, PdfSlot } from '../types/index'

/**
 * PDF処理コントローラー（スライス5: 検出、スライス6: 実行）
 *
 * 6つのエンドポイント:
 * 1. POST /api/process/detect - 複数PDFファイル判別
 * 2. POST /api/process/upload-single - 個別スロットへのPDFアップロード
 * 3. POST /api/process/upload-excel - Excelテンプレートアップロード
 * 4. POST /api/process/execute - PDF処理実行
 * 5. GET /api/process/download/:processId/:fileType - 個別ファイルダウンロード
 * 6. GET /api/process/download-zip/:processId - ZIP一括ダウンロード
 */

/**
 * POST /api/process/detect
 * 複数PDFファイルをアップロードし、取引先とPDF種別を判別
 */
export async function detectPdfController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // multerで処理されたファイルを取得
    const files = req.files as Express.Multer.File[] | undefined

    if (!files || files.length === 0) {
      sendBadRequest(res, 'ファイルがアップロードされていません')
      return
    }

    // ファイル形式チェック（PDF以外は拒否）
    const invalidFiles = files.filter(
      (file) => file.mimetype !== 'application/pdf'
    )
    if (invalidFiles.length > 0) {
      sendBadRequest(
        res,
        `PDFファイルのみアップロード可能です: ${invalidFiles
          .map((f) => f.originalname)
          .join(', ')}`
      )
      return
    }

    // ファイルサイズチェック（10MB超過は拒否）
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      sendBadRequest(
        res,
        `ファイルサイズは10MB以下にしてください: ${oversizedFiles
          .map((f) => f.originalname)
          .join(', ')}`
      )
      return
    }

    // 既存スロット状態を取得（JSON文字列をパース）
    let existingSlots: PdfSlot[] | undefined
    if (req.body.existingSlots) {
      try {
        existingSlots = JSON.parse(req.body.existingSlots)
      } catch (error) {
        sendBadRequest(res, 'existingSlotsの形式が不正です')
        return
      }
    }

    // ファイル情報をBufferに変換
    const fileData = files.map((file) => ({
      filename: file.originalname,
      buffer: file.buffer,
    }))

    // 取引先・種別判別
    const result = await detectPdfFiles(fileData, existingSlots)

    sendSuccess(res, result)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'COMPANY_MISMATCH') {
        sendBadRequest(res, '異なる取引先のファイルが混在しています')
        return
      }

      if (error.message === 'UNDETECTABLE_COMPANY') {
        sendBadRequest(
          res,
          '取引先を判別できませんでした。ファイル名を確認してください。'
        )
        return
      }

      if (error.message === 'INVALID_FILE') {
        sendBadRequest(res, 'PDFの種別を判別できないファイルがあります')
        return
      }
    }

    console.error('PDF判別処理エラー:', error)
    sendInternalError(res, error as Error, 'PDF判別処理に失敗しました')
  }
}

/**
 * POST /api/process/upload-single
 * 個別スロットへのPDFアップロード
 */
export async function uploadSinglePdfController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // multerで処理されたファイルを取得
    const file = req.file

    if (!file) {
      sendBadRequest(res, 'ファイルがアップロードされていません')
      return
    }

    // ファイル形式チェック（PDF以外は拒否）
    if (file.mimetype !== 'application/pdf') {
      sendBadRequest(res, 'PDFファイルのみアップロード可能です')
      return
    }

    // ファイルサイズチェック（10MB超過は拒否）
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      sendBadRequest(res, 'ファイルサイズは10MB以下にしてください')
      return
    }

    // リクエストボディから targetType と existingSlots を取得
    const { targetType, existingSlots: existingSlotsJson } = req.body

    if (!targetType) {
      sendBadRequest(res, 'targetTypeが指定されていません')
      return
    }

    if (!existingSlotsJson) {
      sendBadRequest(res, 'existingSlotsが指定されていません')
      return
    }

    // existingSlotsをパース
    let existingSlots: PdfSlot[]
    try {
      existingSlots = JSON.parse(existingSlotsJson)
    } catch (error) {
      sendBadRequest(res, 'existingSlotsの形式が不正です')
      return
    }

    // ファイル情報
    const fileData = {
      filename: file.originalname,
      buffer: file.buffer,
    }

    // 個別アップロード処理
    const result = await uploadSinglePdf(
      fileData,
      targetType as PdfType,
      existingSlots
    )

    sendSuccess(res, result)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TYPE_MISMATCH') {
        sendBadRequest(
          res,
          'ファイル名から判別されたPDF種別と指定されたスロットが一致しません'
        )
        return
      }

      if (error.message === 'COMPANY_MISMATCH') {
        sendBadRequest(
          res,
          '既存のファイルと異なる取引先のファイルがアップロードされました'
        )
        return
      }

      if (error.message === 'UNDETECTABLE_COMPANY') {
        sendBadRequest(
          res,
          '取引先を判別できませんでした。ファイル名を確認してください。'
        )
        return
      }
    }

    console.error('個別PDFアップロードエラー:', error)
    sendInternalError(
      res,
      error as Error,
      '個別PDFアップロードに失敗しました'
    )
  }
}

/**
 * POST /api/process/upload-excel
 * 初回処理時のExcelテンプレートアップロード
 */
export async function uploadExcelController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // multerで処理されたファイルを取得
    const file = req.file

    if (!file) {
      sendBadRequest(res, 'ファイルがアップロードされていません')
      return
    }

    // ファイル形式チェック（Excel以外は拒否）
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ]

    if (!validMimeTypes.includes(file.mimetype)) {
      sendBadRequest(res, 'Excelファイル（.xlsx、.xls）のみアップロード可能です')
      return
    }

    // ファイルサイズチェック（10MB超過は拒否）
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      sendBadRequest(res, 'ファイルサイズは10MB以下にしてください')
      return
    }

    // リクエストボディから companyId を取得
    const { companyId } = req.body

    if (!companyId) {
      sendBadRequest(res, 'companyIdが指定されていません')
      return
    }

    // ファイル名に取引先名が含まれているか検証
    const isValid = await validateExcelFilename(file.originalname, companyId)

    if (!isValid) {
      sendBadRequest(
        res,
        'ファイル名に取引先名（ネクストビッツ または オフ・ビート・ワークス）が含まれていません'
      )
      return
    }

    // 認証済みユーザーのIDを取得
    const userId = req.user?.id

    if (!userId) {
      sendBadRequest(res, 'ユーザー認証情報が取得できません')
      return
    }

    // Excelテンプレートをアップロード
    await uploadTemplate(companyId, file.buffer, file.originalname, userId)

    sendSuccess(
      res,
      {
        success: true,
        message: `テンプレート「${file.originalname}」をアップロードしました`,
      },
      `テンプレート「${file.originalname}」をアップロードしました`
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'COMPANY_NOT_FOUND') {
        sendBadRequest(res, '指定された取引先が見つかりません')
        return
      }
    }

    console.error('Excelテンプレートアップロードエラー:', error)
    sendInternalError(
      res,
      error as Error,
      'Excelテンプレートアップロードに失敗しました'
    )
  }
}

/**
 * POST /api/process/execute
 * PDF処理実行（PDF解析→Excel編集→PDF生成→DB保存）
 */
export async function executeProcessController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { companyId, pdfSlots: pdfSlotsJson } = req.body

    if (!companyId) {
      sendBadRequest(res, 'companyIdが指定されていません')
      return
    }

    if (!pdfSlotsJson) {
      sendBadRequest(res, 'pdfSlotsが指定されていません')
      return
    }

    // pdfSlotsをパース
    let pdfSlots: PdfSlot[]
    try {
      pdfSlots = JSON.parse(pdfSlotsJson)
    } catch (error) {
      sendBadRequest(res, 'pdfSlotsの形式が不正です')
      return
    }

    // ユーザーIDを取得
    const userId = req.user?.id
    if (!userId) {
      sendBadRequest(res, 'ユーザー認証情報が取得できません')
      return
    }

    // 取引先情報を取得
    const company = await getCompanyById(companyId)
    if (!company) {
      sendBadRequest(res, '指定された取引先が見つかりません')
      return
    }

    // テンプレートExcelを取得
    if (!company.template_excel) {
      sendBadRequest(
        res,
        'テンプレートExcelが登録されていません。先にアップロードしてください。'
      )
      return
    }

    // 処理実行
    const result = await executeProcess(
      userId,
      companyId,
      company.name,
      pdfSlots,
      Buffer.from(company.template_excel, 'base64')
    )

    sendSuccess(res, result, '処理が完了しました')
  } catch (error) {
    console.error('PDF処理実行エラー:', error)
    sendInternalError(res, error as Error, 'PDF処理に失敗しました')
  }
}

/**
 * GET /api/process/download/:processId/:fileType
 * 個別ファイルダウンロード
 */
export async function downloadProcessFileController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { processId, fileType } = req.params

    if (!processId || !fileType) {
      sendBadRequest(res, 'processIdまたはfileTypeが指定されていません')
      return
    }

    // processed_filesテーブルから取得
    const { data, error } = await supabase
      .from('processed_files')
      .select('*')
      .eq('id', processId)
      .single()

    if (error || !data) {
      sendNotFound(res, '処理結果が見つかりません')
      return
    }

    // ファイル種別に応じてファイルを返す
    let fileBuffer: Buffer | null = null
    let filename = ''

    if (fileType === 'excel') {
      fileBuffer = data.excel_file ? Buffer.from(data.excel_file, 'base64') : null
      filename = data.excel_filename || 'output.xlsx'
    } else if (fileType === 'order_pdf') {
      fileBuffer = data.order_pdf ? Buffer.from(data.order_pdf, 'base64') : null
      filename = data.order_pdf_filename || 'order.pdf'
    } else if (fileType === 'inspection_pdf') {
      fileBuffer = data.inspection_pdf
        ? Buffer.from(data.inspection_pdf, 'base64')
        : null
      filename = data.inspection_pdf_filename || 'inspection.pdf'
    } else {
      sendBadRequest(
        res,
        '不正なfileTypeです（excel, order_pdf, inspection_pdfのいずれか）'
      )
      return
    }

    if (!fileBuffer) {
      sendNotFound(res, 'ファイルが見つかりません')
      return
    }

    // ファイルを返す
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(fileBuffer)
  } catch (error) {
    console.error('ファイルダウンロードエラー:', error)
    sendInternalError(res, error as Error, 'ファイルダウンロードに失敗しました')
  }
}

/**
 * GET /api/process/download-zip/:processId
 * ZIP一括ダウンロード（Excel + 注文書PDF + 検収書PDF）
 */
export async function downloadProcessZipController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { processId } = req.params

    if (!processId) {
      sendBadRequest(res, 'processIdが指定されていません')
      return
    }

    // processed_filesテーブルから取得
    const { data, error } = await supabase
      .from('processed_files')
      .select('*')
      .eq('id', processId)
      .single()

    if (error || !data) {
      sendNotFound(res, '処理結果が見つかりません')
      return
    }

    // ZIP生成
    const archive = archiver('zip', { zlib: { level: 9 } })
    const zipFilename = `${data.company_name}_${
      data.process_date.replace(/-/g, '')
    }.zip`

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`)

    archive.pipe(res)

    // Excel追加
    if (data.excel_file && data.excel_filename) {
      archive.append(Buffer.from(data.excel_file, 'base64'), {
        name: data.excel_filename,
      })
    }

    // 注文書PDF追加
    if (data.order_pdf && data.order_pdf_filename) {
      archive.append(Buffer.from(data.order_pdf, 'base64'), {
        name: data.order_pdf_filename,
      })
    }

    // 検収書PDF追加
    if (data.inspection_pdf && data.inspection_pdf_filename) {
      archive.append(Buffer.from(data.inspection_pdf, 'base64'), {
        name: data.inspection_pdf_filename,
      })
    }

    await archive.finalize()
  } catch (error) {
    console.error('ZIP生成エラー:', error)
    sendInternalError(res, error as Error, 'ZIP生成に失敗しました')
  }
}
