import { supabase } from '../lib/supabase'
import { getAllCompanies } from './companiesService'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import type {
  Company,
  PdfType,
  PdfSlot,
  PreCheckResult,
  DetectionResult,
  ProcessResult,
} from '../types/index'

/**
 * PDF処理サービス（スライス5: 検出、スライス6: 実行）
 *
 * PDFファイル名から取引先とPDF種別を判別し、事前チェックを実行する。
 * PDF解析→Excel編集→PDF生成の一連の処理を実行し、結果をDBに保存する。
 */

// PDF種別ごとの日本語表示名
const PDF_TYPE_LABELS: Record<PdfType, string> = {
  estimate: '見積書',
  invoice: '請求書',
  order_confirmation: '注文請書',
  delivery: '納品書',
}

/**
 * ファイル名からPDF種別を判別
 *
 * 判別ルール（要件定義書より）:
 * - ファイル名に「見積」を含む → 見積書
 * - ファイル名に「請書」を含む → 注文請書（「請求」より優先判定）
 * - ファイル名に「請求」を含む → 請求書
 * - ファイル名に「納品」を含む → 納品書
 *
 * @param filename - ファイル名
 * @returns PDF種別（判別不可の場合はnull）
 */
export function detectPdfType(filename: string): PdfType | null {
  const lowerName = filename.toLowerCase()

  // 注文請書: 「請書」で判定（「請求」より先にチェック）
  if (lowerName.includes('請書') || lowerName.includes('order')) {
    return 'order_confirmation'
  }

  // 見積書: 「見積」で判定
  if (lowerName.includes('見積') || lowerName.includes('estimate')) {
    return 'estimate'
  }

  // 請求書: 「請求」で判定
  if (lowerName.includes('請求') || lowerName.includes('invoice')) {
    return 'invoice'
  }

  // 納品書: 「納品」で判定
  if (lowerName.includes('納品') || lowerName.includes('delivery')) {
    return 'delivery'
  }

  return null
}

/**
 * ファイル名から取引先を判別
 *
 * 判別ルール（要件定義書より）:
 * - ネクストビッツ様: ファイル名が `TRR-` で始まる
 * - オフ・ビート・ワークス様: ファイル名に `offbeat-to-terra` を含む
 *
 * @param filename - ファイル名
 * @returns 取引先情報（判別不可の場合はnull）
 */
export async function detectCompanyFromFilename(
  filename: string
): Promise<Company | null> {
  const companies = await getAllCompanies()

  // ネクストビッツ様: TRR- で始まる
  if (filename.startsWith('TRR-')) {
    return (
      companies.find((c) => c.name === 'ネクストビッツ' && c.is_active) || null
    )
  }

  // オフ・ビート・ワークス様: offbeat-to-terra を含む
  if (filename.includes('offbeat-to-terra')) {
    return (
      companies.find(
        (c) => c.name === 'オフ・ビート・ワークス' && c.is_active
      ) || null
    )
  }

  return null
}

/**
 * 複数ファイルから取引先を判別（混在チェック付き）
 *
 * @param files - アップロードされたファイルの配列
 * @returns 判別された取引先（混在またはdetect不可の場合はnull）
 * @throws 取引先混在エラー
 */
export async function detectCompanyFromFiles(
  files: { filename: string; buffer: Buffer }[]
): Promise<Company | null> {
  const companies = new Set<string>()

  for (const file of files) {
    const company = await detectCompanyFromFilename(file.filename)
    if (company) {
      companies.add(company.id)
    }
  }

  // 取引先混在チェック
  if (companies.size > 1) {
    throw new Error('COMPANY_MISMATCH')
  }

  // 取引先が1つだけの場合はその取引先を返す
  if (companies.size === 1) {
    const companyId = Array.from(companies)[0]
    const allCompanies = await getAllCompanies()
    return allCompanies.find((c) => c.id === companyId) || null
  }

  // 判別不可
  return null
}

/**
 * 初回処理かどうかを判定（DBに前回Excelが存在するかチェック）
 *
 * @param companyId - 取引先ID
 * @returns 初回処理の場合true、2回目以降はfalse
 */
export async function isFirstProcessing(companyId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('companies')
    .select('template_excel')
    .eq('id', companyId)
    .single()

  if (error) {
    console.error('テンプレートExcel存在確認エラー:', error)
    return true // エラー時は初回扱い
  }

  return !data.template_excel
}

/**
 * 事前チェックを実行
 *
 * @param slots - PDFスロット配列
 * @returns 事前チェック結果
 */
export function performPreCheck(slots: PdfSlot[]): PreCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missingTypes: PdfType[] = []

  const allTypes: PdfType[] = [
    'estimate',
    'invoice',
    'order_confirmation',
    'delivery',
  ]

  // 不足しているPDF種別をチェック
  for (const type of allTypes) {
    const slot = slots.find((s) => s.type === type)
    if (!slot || slot.status !== 'uploaded') {
      missingTypes.push(type)
    }
  }

  // 不足ファイルのエラーメッセージ
  if (missingTypes.length > 0) {
    const missingLabels = missingTypes
      .map((type) => PDF_TYPE_LABELS[type])
      .join('、')
    errors.push(`不足しているファイル: ${missingLabels}`)
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    missingTypes,
  }
}

/**
 * 複数PDFファイルから取引先・種別を判別（POST /api/process/detect）
 *
 * @param files - アップロードされたファイルの配列
 * @param existingSlots - 既存のスロット状態（追加アップロード時）
 * @returns 判別結果
 */
export async function detectPdfFiles(
  files: { filename: string; buffer: Buffer }[],
  existingSlots?: PdfSlot[]
): Promise<DetectionResult> {
  // 取引先判別
  const company = await detectCompanyFromFiles(files)

  if (!company) {
    throw new Error('UNDETECTABLE_COMPANY')
  }

  // スロット初期化
  const allTypes: PdfType[] = [
    'estimate',
    'invoice',
    'order_confirmation',
    'delivery',
  ]
  const slots: PdfSlot[] = allTypes.map((type) => ({
    type,
    file: null,
    status: 'empty',
  }))

  // 既存スロットがあればマージ
  if (existingSlots) {
    for (const existingSlot of existingSlots) {
      const slot = slots.find((s) => s.type === existingSlot.type)
      if (slot && existingSlot.file) {
        slot.file = existingSlot.file
        slot.status = 'uploaded'
      }
    }
  }

  // 新規ファイルを各スロットに振り分け
  for (const file of files) {
    const type = detectPdfType(file.filename)

    if (!type) {
      throw new Error('INVALID_FILE')
    }

    const slot = slots.find((s) => s.type === type)
    if (!slot) {
      continue
    }

    slot.file = { filename: file.filename, buffer: file.buffer }
    slot.status = 'uploaded'
  }

  // 事前チェック実行
  const preCheck = performPreCheck(slots)

  // 初回処理かチェック
  const needsExcel = await isFirstProcessing(company.id)

  return {
    company,
    pdfSlots: slots,
    preCheck,
    needsExcel,
  }
}

/**
 * 個別スロットへのPDFアップロード（POST /api/process/upload-single）
 *
 * @param file - アップロードされたファイル
 * @param targetType - 対象スロット種別
 * @param existingSlots - 既存のスロット状態
 * @returns 判別結果
 */
export async function uploadSinglePdf(
  file: { filename: string; buffer: Buffer },
  targetType: PdfType,
  existingSlots: PdfSlot[]
): Promise<DetectionResult> {
  // ファイル名から種別を判別
  const detectedType = detectPdfType(file.filename)

  if (detectedType !== targetType) {
    throw new Error('TYPE_MISMATCH')
  }

  // 取引先判別（既存スロット + 新規ファイル）
  const allFiles = existingSlots
    .filter((s) => s.file)
    .map((s) => ({
      filename: s.file!.filename,
      buffer: s.file!.buffer,
    }))
  allFiles.push(file)

  const company = await detectCompanyFromFiles(allFiles)

  if (!company) {
    throw new Error('UNDETECTABLE_COMPANY')
  }

  // スロット更新
  const slots: PdfSlot[] = existingSlots.map((slot) => ({ ...slot }))
  const targetSlot = slots.find((s) => s.type === targetType)

  if (targetSlot) {
    targetSlot.file = { filename: file.filename, buffer: file.buffer }
    targetSlot.status = 'uploaded'
  }

  // 事前チェック実行
  const preCheck = performPreCheck(slots)

  // 初回処理かチェック
  const needsExcel = await isFirstProcessing(company.id)

  return {
    company,
    pdfSlots: slots,
    preCheck,
    needsExcel,
  }
}

/**
 * Excelテンプレートファイル名から取引先を検証
 *
 * @param filename - Excelファイル名
 * @param companyId - 取引先ID
 * @returns 検証結果（true: 一致、false: 不一致）
 */
export async function validateExcelFilename(
  filename: string,
  companyId: string
): Promise<boolean> {
  const companies = await getAllCompanies()
  const company = companies.find((c) => c.id === companyId)

  if (!company) {
    throw new Error('COMPANY_NOT_FOUND')
  }

  // ファイル名に取引先名が含まれているかチェック
  const lowerFilename = filename.toLowerCase()

  if (company.name === 'ネクストビッツ') {
    return (
      lowerFilename.includes('ネクストビッツ'.toLowerCase()) ||
      lowerFilename.includes('nextbits')
    )
  }

  if (company.name === 'オフ・ビート・ワークス') {
    return (
      lowerFilename.includes('オフ・ビート・ワークス'.toLowerCase()) ||
      lowerFilename.includes('オフビート'.toLowerCase()) ||
      lowerFilename.includes('offbeat')
    )
  }

  return false
}

/**
 * Pythonスクリプトを実行する汎用ヘルパー
 *
 * @param scriptName - Pythonスクリプト名（pdf_parser.py等）
 * @param args - コマンドライン引数
 * @returns Pythonスクリプトの標準出力（JSON形式）
 */
async function runPythonScript(
  scriptName: string,
  args: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../python', scriptName)
    const pythonProcess = spawn('python3', [scriptPath, ...args])

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Pythonスクリプトエラー: ${stderr}`))
      } else {
        resolve(stdout.trim())
      }
    })

    pythonProcess.on('error', (error: Error) => {
      reject(new Error(`Pythonプロセス起動エラー: ${error.message}`))
    })
  })
}

/**
 * 処理結果をDBに保存
 *
 * @param userId - ユーザーID
 * @param companyId - 取引先ID
 * @param processDate - 処理日（YYYY-MM-DD形式）
 * @param pdfSlots - PDFスロット（入力PDF 4種）
 * @param excelFile - 編集済みExcelファイル（Buffer）
 * @param excelFilename - Excelファイル名
 * @param orderPdf - 注文書PDF（Buffer）
 * @param orderPdfFilename - 注文書PDFファイル名
 * @param inspectionPdf - 検収書PDF（Buffer）
 * @param inspectionPdfFilename - 検収書PDFファイル名
 * @param processingTime - 処理時間（秒）
 * @param status - 処理ステータス（success/error）
 * @param errorMessage - エラーメッセージ（エラー時のみ）
 * @param errorCode - エラーコード（エラー時のみ）
 * @param errorDetail - エラー詳細（エラー時のみ）
 * @param errorStacktrace - スタックトレース（エラー時のみ）
 * @returns 保存されたレコードのID
 */
async function saveProcessedFiles(
  userId: string,
  companyId: string,
  processDate: string,
  pdfSlots: PdfSlot[],
  excelFile: Buffer,
  excelFilename: string,
  orderPdf: Buffer,
  orderPdfFilename: string,
  inspectionPdf: Buffer,
  inspectionPdfFilename: string,
  processingTime: number,
  status: 'success' | 'error',
  errorMessage?: string,
  errorCode?: string,
  errorDetail?: string,
  errorStacktrace?: string
): Promise<string> {
  // PdfSlotから入力PDFを抽出
  const estimateSlot = pdfSlots.find((s) => s.type === 'estimate')
  const invoiceSlot = pdfSlots.find((s) => s.type === 'invoice')
  const orderConfirmationSlot = pdfSlots.find(
    (s) => s.type === 'order_confirmation'
  )
  const deliverySlot = pdfSlots.find((s) => s.type === 'delivery')

  const { data, error } = await supabase
    .from('processed_files')
    .insert({
      user_id: userId,
      company_id: companyId,
      process_date: processDate,
      // 入力PDF（BYTEA型）
      input_pdf_1: estimateSlot?.file?.buffer,
      input_pdf_1_filename: estimateSlot?.file?.filename,
      input_pdf_2: invoiceSlot?.file?.buffer,
      input_pdf_2_filename: invoiceSlot?.file?.filename,
      input_pdf_3: orderConfirmationSlot?.file?.buffer,
      input_pdf_3_filename: orderConfirmationSlot?.file?.filename,
      input_pdf_4: deliverySlot?.file?.buffer,
      input_pdf_4_filename: deliverySlot?.file?.filename,
      // 出力ファイル（BYTEA型）
      excel_file: excelFile,
      excel_filename: excelFilename,
      order_pdf: orderPdf,
      order_pdf_filename: orderPdfFilename,
      inspection_pdf: inspectionPdf,
      inspection_pdf_filename: inspectionPdfFilename,
      // 処理情報
      processing_time: processingTime,
      status,
      error_message: errorMessage,
      error_code: errorCode,
      error_detail: errorDetail,
      error_stacktrace: errorStacktrace,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`DB保存エラー: ${error.message}`)
  }

  return data.id
}

/**
 * PDF処理実行メイン関数（POST /api/process/execute）
 *
 * @param userId - ユーザーID
 * @param companyId - 取引先ID
 * @param companyName - 取引先名
 * @param pdfSlots - PDFスロット（4種）
 * @param templateExcel - テンプレートExcel（Buffer）
 * @returns 処理結果
 */
export async function executeProcess(
  userId: string,
  companyId: string,
  companyName: string,
  pdfSlots: PdfSlot[],
  templateExcel: Buffer
): Promise<ProcessResult> {
  const startTime = Date.now()
  const tmpDir = '/tmp'
  const timestamp = Date.now()

  try {
    // 1. 一時ファイル保存
    const estimateSlot = pdfSlots.find((s) => s.type === 'estimate')
    const invoiceSlot = pdfSlots.find((s) => s.type === 'invoice')
    const orderConfirmationSlot = pdfSlots.find(
      (s) => s.type === 'order_confirmation'
    )
    const deliverySlot = pdfSlots.find((s) => s.type === 'delivery')

    if (
      !estimateSlot?.file ||
      !invoiceSlot?.file ||
      !orderConfirmationSlot?.file ||
      !deliverySlot?.file
    ) {
      throw new Error('必須PDFファイルが不足しています')
    }

    const estimatePath = path.join(tmpDir, `estimate_${timestamp}.pdf`)
    const invoicePath = path.join(tmpDir, `invoice_${timestamp}.pdf`)
    const orderConfirmationPath = path.join(
      tmpDir,
      `order_confirmation_${timestamp}.pdf`
    )
    const deliveryPath = path.join(tmpDir, `delivery_${timestamp}.pdf`)
    const templatePath = path.join(tmpDir, `template_${timestamp}.xlsx`)

    await fs.writeFile(estimatePath, estimateSlot.file.buffer)
    await fs.writeFile(invoicePath, invoiceSlot.file.buffer)
    await fs.writeFile(orderConfirmationPath, orderConfirmationSlot.file.buffer)
    await fs.writeFile(deliveryPath, deliverySlot.file.buffer)
    await fs.writeFile(templatePath, templateExcel)

    // 2. PDF解析（pdfplumber）
    const estimateDataJson = await runPythonScript('pdf_parser.py', [
      companyName,
      'estimate',
      estimatePath,
    ])
    const invoiceDataJson = await runPythonScript('pdf_parser.py', [
      companyName,
      'invoice',
      invoicePath,
    ])

    const estimateData = JSON.parse(estimateDataJson)
    const invoiceData = JSON.parse(invoiceDataJson)

    if (estimateData.error || invoiceData.error) {
      throw new Error(
        `PDF解析エラー: ${estimateData.error || invoiceData.error}`
      )
    }

    // オフ・ビート・ワークスの場合は注文請書からも発行日を抽出
    let orderConfirmationData = {}
    if (companyName === 'オフ・ビート・ワークス') {
      const orderConfirmationDataJson = await runPythonScript('pdf_parser.py', [
        companyName,
        'order_confirmation',
        orderConfirmationPath,
      ])
      orderConfirmationData = JSON.parse(orderConfirmationDataJson)
      if (orderConfirmationData && (orderConfirmationData as { error?: string }).error) {
        throw new Error(`PDF解析エラー: ${(orderConfirmationData as { error: string }).error}`)
      }
    }

    // 3. Excel編集（openpyxl）
    const outputExcelPath = path.join(tmpDir, `output_${timestamp}.xlsx`)
    const combinedData = {
      estimate: estimateData,
      invoice: invoiceData,
      order_confirmation: orderConfirmationData,
    }

    const excelResultJson = await runPythonScript('excel_editor.py', [
      companyName,
      templatePath,
      outputExcelPath,
      JSON.stringify(combinedData),
    ])

    const excelResult = JSON.parse(excelResultJson)

    if (excelResult.error) {
      throw new Error(`Excel編集エラー: ${excelResult.error}`)
    }

    // 4. PDF生成（LibreOffice）
    const outputPdfDir = tmpDir
    const pdfResultJson = await runPythonScript('pdf_generator.py', [
      outputExcelPath,
      outputPdfDir,
    ])

    const pdfResult = JSON.parse(pdfResultJson)

    if (pdfResult.error) {
      throw new Error(`PDF生成エラー: ${pdfResult.error}`)
    }

    // 5. 生成ファイルを読み込み
    const excelBuffer = await fs.readFile(outputExcelPath)
    const orderPdfBuffer = await fs.readFile(pdfResult.pdf_path)
    // 注文書PDFと検収書PDFは同じファイル（MVPでは1つのPDFを2つとして扱う）
    const inspectionPdfBuffer = orderPdfBuffer

    // 6. ファイル名生成（処理ルール確定版: 2025-12-08）
    // YYMM形式（年下2桁 + 月2桁）
    const now = new Date()
    const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`

    // 出力ファイル名フォーマット:
    // - Excel: テラ【株式会社{取引先名}御中】注文検収書_{YYMM}.xlsx
    // - 注文書PDF: 注文書_{YYMM}.pdf
    // - 検収書PDF: 検収書_{YYMM}.pdf
    const excelFilename = `テラ【株式会社${companyName}御中】注文検収書_${yearMonth}.xlsx`
    const orderPdfFilename = `注文書_${yearMonth}.pdf`
    const inspectionPdfFilename = `検収書_${yearMonth}.pdf`

    // 7. 処理時間計測
    const endTime = Date.now()
    const processingTime = Math.round((endTime - startTime) / 1000) // 秒

    // 8. DB保存
    const processId = await saveProcessedFiles(
      userId,
      companyId,
      now.toISOString().split('T')[0], // YYYY-MM-DD
      pdfSlots,
      excelBuffer,
      excelFilename,
      orderPdfBuffer,
      orderPdfFilename,
      inspectionPdfBuffer,
      inspectionPdfFilename,
      processingTime,
      'success'
    )

    // 9. 一時ファイル削除
    await Promise.all([
      fs.unlink(estimatePath),
      fs.unlink(invoicePath),
      fs.unlink(orderConfirmationPath),
      fs.unlink(deliveryPath),
      fs.unlink(templatePath),
      fs.unlink(outputExcelPath),
      fs.unlink(pdfResult.pdf_path),
    ]).catch((error) => {
      console.error('一時ファイル削除エラー:', error)
    })

    return {
      excelFilename,
      orderPdfFilename,
      inspectionPdfFilename,
      companyName,
      yearMonth,
      processId,
    }
  } catch (error) {
    // エラー時もDB保存
    const endTime = Date.now()
    const processingTime = Math.round((endTime - startTime) / 1000)

    await saveProcessedFiles(
      userId,
      companyId,
      new Date().toISOString().split('T')[0],
      pdfSlots,
      Buffer.from([]), // 空Buffer
      '',
      Buffer.from([]),
      '',
      Buffer.from([]),
      '',
      processingTime,
      'error',
      error instanceof Error ? error.message : '不明なエラー',
      'PROCESS_ERROR',
      error instanceof Error ? error.stack : undefined,
      error instanceof Error ? error.stack : undefined
    )

    throw error
  }
}
