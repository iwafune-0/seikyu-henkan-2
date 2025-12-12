import { Request, Response } from 'express'
import archiver from 'archiver'
import {
  sendSuccess,
  sendBadRequest,
  sendInternalError,
  sendNotFound,
  decodeByteaToBuffer,
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
    // multerはファイル名をLatin-1としてデコードするため、UTF-8に再変換
    const fileData = files.map((file) => ({
      filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      buffer: file.buffer,
    }))

    // デバッグログ: アップロードされたファイル名を出力
    console.log('=== アップロードされたファイル ===')
    fileData.forEach((f, i) => {
      console.log(`[${i + 1}] ${f.filename}`)
    })

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
    // multerはファイル名をLatin-1としてデコードするため、UTF-8に再変換
    const fileData = {
      filename: Buffer.from(file.originalname, 'latin1').toString('utf8'),
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

    // multerはファイル名をLatin-1としてデコードするため、UTF-8に再変換
    const filename = Buffer.from(file.originalname, 'latin1').toString('utf8')

    // ファイル名に取引先名が含まれているか検証
    const isValid = await validateExcelFilename(filename, companyId)

    if (!isValid) {
      sendBadRequest(
        res,
        '選択中の取引先と異なるExcelファイルがアップロードされました'
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
    await uploadTemplate(companyId, file.buffer, filename, userId)

    sendSuccess(
      res,
      {
        success: true,
        message: `テンプレート「${filename}」をアップロードしました`,
      },
      `テンプレート「${filename}」をアップロードしました`
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
    const { companyId } = req.body

    if (!companyId) {
      sendBadRequest(res, 'companyIdが指定されていません')
      return
    }

    // multerで処理されたファイルを取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

    if (!files) {
      sendBadRequest(res, 'PDFファイルがアップロードされていません')
      return
    }

    // 各PDFファイルを取得
    const estimateFile = files['pdf_estimate']?.[0]
    const invoiceFile = files['pdf_invoice']?.[0]
    const orderConfirmationFile = files['pdf_order_confirmation']?.[0]
    const deliveryFile = files['pdf_delivery']?.[0]

    // 必須ファイルのチェック
    if (!estimateFile || !invoiceFile || !orderConfirmationFile || !deliveryFile) {
      const missingFiles: string[] = []
      if (!estimateFile) missingFiles.push('見積書')
      if (!invoiceFile) missingFiles.push('請求書')
      if (!orderConfirmationFile) missingFiles.push('注文請書')
      if (!deliveryFile) missingFiles.push('納品書')
      sendBadRequest(res, `以下のPDFファイルが不足しています: ${missingFiles.join(', ')}`)
      return
    }

    // PdfSlot形式に変換（multerはファイル名をLatin-1としてデコードするため、UTF-8に再変換）
    const pdfSlots: PdfSlot[] = [
      {
        type: 'estimate',
        file: {
          filename: Buffer.from(estimateFile.originalname, 'latin1').toString('utf8'),
          buffer: estimateFile.buffer,
        },
        status: 'uploaded',
      },
      {
        type: 'invoice',
        file: {
          filename: Buffer.from(invoiceFile.originalname, 'latin1').toString('utf8'),
          buffer: invoiceFile.buffer,
        },
        status: 'uploaded',
      },
      {
        type: 'order_confirmation',
        file: {
          filename: Buffer.from(orderConfirmationFile.originalname, 'latin1').toString('utf8'),
          buffer: orderConfirmationFile.buffer,
        },
        status: 'uploaded',
      },
      {
        type: 'delivery',
        file: {
          filename: Buffer.from(deliveryFile.originalname, 'latin1').toString('utf8'),
          buffer: deliveryFile.buffer,
        },
        status: 'uploaded',
      },
    ]

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

    // テンプレートExcelをデコード（SupabaseのBYTEA型はHex形式で返される）
    const templateBuffer = decodeByteaToBuffer(company.template_excel)

    // 処理実行
    const result = await executeProcess(
      userId,
      companyId,
      company.name,
      pdfSlots,
      templateBuffer
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
    // SupabaseのBYTEA型はHex形式（\x...）で返されるのでdecodeByteaToBufferを使用
    let fileBuffer: Buffer | null = null
    let filename = ''

    if (fileType === 'excel') {
      fileBuffer = data.excel_file ? decodeByteaToBuffer(data.excel_file) : null
      filename = data.excel_filename || 'output.xlsx'
    } else if (fileType === 'order_pdf') {
      fileBuffer = data.order_pdf ? decodeByteaToBuffer(data.order_pdf) : null
      filename = data.order_pdf_filename || 'order.pdf'
    } else if (fileType === 'inspection_pdf') {
      fileBuffer = data.inspection_pdf
        ? decodeByteaToBuffer(data.inspection_pdf)
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
    // RFC 5987に準拠したファイル名エンコーディング（日本語ファイル名対応）
    const encodedFilename = encodeURIComponent(filename).replace(/'/g, '%27')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFilename}`
    )
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

    // processed_filesテーブルから取得（companiesテーブルをJOINして取引先名も取得）
    const { data, error } = await supabase
      .from('processed_files')
      .select('*, companies(name)')
      .eq('id', processId)
      .single()

    if (error || !data) {
      sendNotFound(res, '処理結果が見つかりません')
      return
    }

    // ZIP生成
    const archive = archiver('zip', { zlib: { level: 9 } })
    // ZIPファイル名: {取引先名}_{YYMM}.zip
    // 年月はexcel_filenameから抽出（例: テラ【...】注文検収書_2507.xlsx → 2507）
    const companyName = (data.companies as { name: string } | null)?.name || '不明'
    const yearMonthMatch = data.excel_filename?.match(/_(\d{4})\.xlsx$/)
    const yearMonth = yearMonthMatch ? yearMonthMatch[1] : 'unknown'
    const zipFilename = `${companyName}_${yearMonth}.zip`

    // RFC 5987に準拠したファイル名エンコーディング（日本語ファイル名対応）
    const encodedZipFilename = encodeURIComponent(zipFilename).replace(/'/g, '%27')
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedZipFilename}`
    )

    archive.pipe(res)

    // Excel追加（SupabaseのBYTEA型はHex形式で返されるのでdecodeByteaToBufferを使用）
    if (data.excel_file && data.excel_filename) {
      const excelBuffer = decodeByteaToBuffer(data.excel_file)
      // デバッグログ: Excelファイルの状態を確認
      const hasCreationId = excelBuffer.toString('utf8').includes('a16:creationId')
      console.log(`[ZIP Download] processId: ${processId}, Excel: ${data.excel_filename}, size: ${excelBuffer.length} bytes, a16:creationId: ${hasCreationId}, created_at: ${data.created_at}`)
      archive.append(excelBuffer, {
        name: data.excel_filename,
      })
    }

    // 注文書PDF追加
    if (data.order_pdf && data.order_pdf_filename) {
      archive.append(decodeByteaToBuffer(data.order_pdf), {
        name: data.order_pdf_filename,
      })
    }

    // 検収書PDF追加
    if (data.inspection_pdf && data.inspection_pdf_filename) {
      archive.append(decodeByteaToBuffer(data.inspection_pdf), {
        name: data.inspection_pdf_filename,
      })
    }

    await archive.finalize()
  } catch (error) {
    console.error('ZIP生成エラー:', error)
    sendInternalError(res, error as Error, 'ZIP生成に失敗しました')
  }
}
