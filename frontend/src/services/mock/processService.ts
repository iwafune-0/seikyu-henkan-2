import type { Company } from '@/types'

/**
 * P-002: PDF処理実行ページ用モックサービス
 * Phase 7でバックエンドAPIに置き換え
 */

// PDF種別（4種類必須）
export type PdfType = 'estimate' | 'invoice' | 'order_confirmation' | 'delivery'

// 全PDF種別リスト
export const ALL_PDF_TYPES: PdfType[] = ['estimate', 'invoice', 'order_confirmation', 'delivery']

// PDF種別ごとのファイル状態
export interface PdfSlot {
  type: PdfType
  file: File | null
  status: 'empty' | 'uploaded' | 'error'
  errorMessage?: string
}

// 事前チェック結果
export interface PreCheckResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  missingTypes: PdfType[] // 不足しているPDF種別
}

// 処理状態
export type ProcessState =
  | 'initial' // 初期状態（PDFドロップゾーン）
  | 'uploading' // アップロード中
  | 'detecting' // 取引先判別中
  | 'detected' // 判別完了・事前チェック完了
  | 'incomplete' // 不足ファイルあり
  | 'excel_required' // Excelアップロード要求（初回のみ）
  | 'ready' // 処理実行可能
  | 'processing' // 処理中
  | 'completed' // 処理完了
  | 'error' // エラー

// 処理結果
export interface ProcessResult {
  excelFilename: string
  orderPdfFilename: string
  inspectionPdfFilename: string
  companyName: string // ZIP用
  yearMonth: string // ZIP用
}

// 取引先判別結果
export interface DetectionResult {
  company: Company | null
  pdfSlots: PdfSlot[]
  preCheck: PreCheckResult
  needsExcel: boolean // 初回の場合true
}

/**
 * モック取引先データ（companiesServiceと同じ）
 */
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'ネクストビッツ',
    display_name: '株式会社ネクストビッツ',
    is_active: true,
    last_processed_at: undefined, // 初回処理なし
    template_excel: undefined,
    template_filename: undefined,
    template_updated_at: undefined,
    template_updated_by: undefined,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'オフ・ビート・ワークス',
    display_name: '株式会社オフ・ビート・ワークス',
    is_active: true,
    last_processed_at: undefined, // 初回処理なし
    template_excel: undefined,
    template_filename: undefined,
    template_updated_at: undefined,
    template_updated_by: undefined,
    created_at: '2025-01-01T00:00:00Z',
  },
]

/**
 * PDFの種別を判別（モック）
 * 実際はPDFの内容を解析して判別
 */
export function detectPdfType(filename: string): PdfType | null {
  const lowerName = filename.toLowerCase()

  // 注文請書: 「請書」で判定（「請求」より先にチェック）
  // ※「請書」は「注文請書」の略称として使われることが多い
  if (lowerName.includes('請書') || lowerName.includes('order')) {
    return 'order_confirmation'
  }
  // 請求書: 「請求」で判定
  if (lowerName.includes('請求') || lowerName.includes('invoice')) {
    return 'invoice'
  }
  // 見積書
  if (lowerName.includes('見積') || lowerName.includes('estimate')) {
    return 'estimate'
  }
  // 納品書
  if (lowerName.includes('納品') || lowerName.includes('delivery')) {
    return 'delivery'
  }
  // 判別できない場合はnull
  return null
}

/**
 * ファイル名から取引先を判別（命名規則ベース）
 *
 * 【ネクストビッツ様】
 * - パターン: TRR-YY-MMM_XXX.pdf
 * - 判別条件: "TRR-" で始まる
 *
 * 【オフ・ビート・ワークス様】
 * - パターン: NNNNNNN-XXX-offbeat-to-terra-YYYYMM.pdf
 * - 判別条件: "offbeat-to-terra" を含む
 *
 * @export テスト・デバッグ用にエクスポート
 */
export function detectCompanyFromFilename(filename: string): 'nextbits' | 'offbeat' | null {
  // ネクストビッツ: "TRR-" で始まる
  if (filename.startsWith('TRR-')) {
    return 'nextbits'
  }
  // オフ・ビート・ワークス: "offbeat-to-terra" を含む
  if (filename.includes('offbeat-to-terra')) {
    return 'offbeat'
  }
  // 判別できない
  return null
}

/**
 * 取引先を判別（モック）
 * 実際はPDFの内容から取引先を特定
 */
function detectCompany(files: File[]): Company | null {
  if (files.length === 0) return null

  // 最初のファイルから取引先を判別
  const detectedCompany = detectCompanyFromFilename(files[0].name)

  if (detectedCompany === 'nextbits') {
    return mockCompanies[0]
  }
  if (detectedCompany === 'offbeat') {
    return mockCompanies[1]
  }

  // 判別できない場合はnull
  return null
}

/**
 * 空のPDFスロットを初期化
 */
export function createEmptySlots(): PdfSlot[] {
  return ALL_PDF_TYPES.map((type) => ({
    type,
    file: null,
    status: 'empty',
  }))
}

/**
 * ファイルをスロットに割り当て
 */
export function assignFilesToSlots(files: File[], existingSlots?: PdfSlot[]): PdfSlot[] {
  // 既存スロットがあればコピー、なければ新規作成
  const slots: PdfSlot[] = existingSlots
    ? existingSlots.map(s => ({ ...s }))
    : createEmptySlots()

  // 各ファイルを判別してスロットに割り当て
  for (const file of files) {
    const detectedType = detectPdfType(file.name)

    if (detectedType) {
      const slotIndex = slots.findIndex((s) => s.type === detectedType)
      if (slotIndex !== -1) {
        slots[slotIndex] = {
          type: detectedType,
          file,
          status: 'uploaded',
        }
      }
    }
  }

  return slots
}

/**
 * 事前チェック実行
 */
function runPreCheck(slots: PdfSlot[], company: Company | null): PreCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missingTypes: PdfType[] = []

  // 取引先混在チェック
  const uploadedFiles = slots
    .filter((s) => s.file !== null)
    .map((s) => s.file as File)

  if (uploadedFiles.length > 0) {
    const detectedCompanies = new Set<'nextbits' | 'offbeat' | null>()
    const undetectableFiles: string[] = []

    for (const file of uploadedFiles) {
      const detected = detectCompanyFromFilename(file.name)
      detectedCompanies.add(detected)

      if (detected === null) {
        undetectableFiles.push(file.name)
      }
    }

    // 判別できないファイルがある場合
    if (undetectableFiles.length > 0) {
      errors.push(`取引先を判別できないファイルがあります: ${undetectableFiles.join('、')}`)
    }

    // 異なる取引先のファイルが混在している場合
    // nullを除外した有効な取引先の数をカウント
    const validCompanies = Array.from(detectedCompanies).filter((c) => c !== null)
    if (validCompanies.length > 1) {
      errors.push('異なる取引先のファイルが混在しています')
    }
  }

  // 不足ファイルチェック
  for (const slot of slots) {
    if (slot.status === 'empty') {
      missingTypes.push(slot.type)
    }
  }

  if (missingTypes.length > 0) {
    const missingLabels = missingTypes.map(getPdfTypeLabel).join('、')
    errors.push(`以下のPDFが不足しています: ${missingLabels}`)
  }

  // アップロード済みファイルのチェック
  for (const slot of slots) {
    if (slot.file) {
      // ファイルサイズチェック（10MB以下）
      if (slot.file.size > 10 * 1024 * 1024) {
        errors.push(`${getPdfTypeLabel(slot.type)}: ファイルサイズが10MBを超えています`)
      }
      // PDF形式チェック
      if (!slot.file.type.includes('pdf') && !slot.file.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`${getPdfTypeLabel(slot.type)}: PDFファイルではありません`)
      }
    }
  }

  // 警告（モック）
  if (company?.name === 'オフ・ビート・ワークス') {
    warnings.push('この取引先は初回処理です。Excelテンプレートのアップロードが必要です。')
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    missingTypes,
  }
}

/**
 * PDFアップロード・取引先判別
 */
export async function detectAndPreCheck(
  files: File[],
  existingSlots?: PdfSlot[]
): Promise<DetectionResult> {
  // モック遅延（判別処理をシミュレート）
  await new Promise((resolve) => setTimeout(resolve, 800))

  // 取引先混在チェック（スロット割り当て前に実施）

  // 1. 新しいファイル同士の混在チェック
  if (files.length > 1) {
    const newFileCompanies = new Set<'nextbits' | 'offbeat'>()
    for (const file of files) {
      const company = detectCompanyFromFilename(file.name)
      if (company) {
        newFileCompanies.add(company)
      }
    }
    if (newFileCompanies.size > 1) {
      throw new Error(
        `異なる取引先のファイルが混在しています。\n` +
        `アップロードするファイルは同一の取引先のものにしてください。`
      )
    }
  }

  // 2. 新しいファイルと既存ファイルの混在チェック
  if (existingSlots && existingSlots.length > 0) {
    const existingFiles = existingSlots
      .filter((s) => s.file !== null)
      .map((s) => s.file as File)

    if (existingFiles.length > 0) {
      // 既存ファイルの取引先を取得
      const existingCompany = detectCompanyFromFilename(existingFiles[0].name)

      if (existingCompany) {
        // 新しいファイルの取引先をチェック
        for (const file of files) {
          const newCompany = detectCompanyFromFilename(file.name)
          if (newCompany && newCompany !== existingCompany) {
            throw new Error(
              `異なる取引先のファイルが混在しています。\n` +
              `既存ファイルの取引先: ${existingCompany === 'nextbits' ? '株式会社ネクストビッツ' : '株式会社オフ・ビート・ワークス'}\n` +
              `追加しようとしているファイルの取引先: ${newCompany === 'nextbits' ? '株式会社ネクストビッツ' : '株式会社オフ・ビート・ワークス'}`
            )
          }
        }
      }
    }
  }

  // ファイルをスロットに割り当て
  const pdfSlots = assignFilesToSlots(files, existingSlots)

  // アップロード済みファイルを収集
  const uploadedFiles = pdfSlots
    .filter((s) => s.file !== null)
    .map((s) => s.file as File)

  // 取引先判別
  const company = detectCompany(uploadedFiles)

  // 事前チェック
  const preCheck = runPreCheck(pdfSlots, company)

  // 初回処理判定（テンプレートExcelがない場合）
  const needsExcel = company ? !company.template_excel : false

  return {
    company,
    pdfSlots,
    preCheck,
    needsExcel,
  }
}

/**
 * 単一ファイルを特定スロットにアップロード
 * ファイル名から判別した種別と、ターゲットスロットが一致する必要がある
 */
export async function uploadSinglePdf(
  file: File,
  targetType: PdfType,
  existingSlots: PdfSlot[]
): Promise<DetectionResult> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 500))

  // ファイル名から種別を判別
  const detectedType = detectPdfType(file.name)

  // 判別できない、または種別が一致しない場合はエラー
  if (detectedType === null) {
    throw new Error(
      `ファイル名から種別を判別できません。\n` +
      `「${getPdfTypeLabel(targetType)}」には、ファイル名に「${getKeywordForType(targetType)}」を含むPDFを選択してください。`
    )
  }

  if (detectedType !== targetType) {
    throw new Error(
      `このファイルは「${getPdfTypeLabel(detectedType)}」として判別されました。\n` +
      `「${getPdfTypeLabel(targetType)}」のスロットには追加できません。`
    )
  }

  // 取引先混在チェック（追加前）
  const newFileCompany = detectCompanyFromFilename(file.name)
  if (newFileCompany === null) {
    throw new Error(
      `取引先を判別できないファイルです。\n` +
      `ファイル名は以下のいずれかの形式にしてください:\n` +
      `- ネクストビッツ様: TRR-YY-MMM_XXX.pdf\n` +
      `- オフ・ビート・ワークス様: XXX-offbeat-to-terra-YYYYMM.pdf`
    )
  }

  // 既存のファイルと取引先が一致するかチェック
  const existingFiles = existingSlots
    .filter((s) => s.file !== null && s.type !== targetType) // 上書き対象以外
    .map((s) => s.file as File)

  if (existingFiles.length > 0) {
    const existingCompany = detectCompanyFromFilename(existingFiles[0].name)
    if (existingCompany && existingCompany !== newFileCompany) {
      throw new Error(
        `異なる取引先のファイルが混在しています。\n` +
        `既存ファイルの取引先: ${existingCompany === 'nextbits' ? '株式会社ネクストビッツ' : '株式会社オフ・ビート・ワークス'}\n` +
        `追加しようとしているファイルの取引先: ${newFileCompany === 'nextbits' ? '株式会社ネクストビッツ' : '株式会社オフ・ビート・ワークス'}`
      )
    }
  }

  // スロットをコピーして更新
  const newSlots = existingSlots.map((slot) => {
    if (slot.type === targetType) {
      return {
        type: targetType,
        file,
        status: 'uploaded' as const,
      }
    }
    return { ...slot }
  })

  // アップロード済みファイルを収集
  const uploadedFiles = newSlots
    .filter((s) => s.file !== null)
    .map((s) => s.file as File)

  // 取引先判別
  const company = detectCompany(uploadedFiles)

  // 事前チェック
  const preCheck = runPreCheck(newSlots, company)

  // 初回処理判定
  const needsExcel = company ? !company.template_excel : false

  return {
    company,
    pdfSlots: newSlots,
    preCheck,
    needsExcel,
  }
}

/**
 * 特定スロットのファイルを削除
 */
export function removeFromSlot(
  targetType: PdfType,
  existingSlots: PdfSlot[]
): PdfSlot[] {
  return existingSlots.map((slot) => {
    if (slot.type === targetType) {
      return {
        type: targetType,
        file: null,
        status: 'empty' as const,
      }
    }
    return { ...slot }
  })
}

/**
 * Excelファイル名から取引先を判別
 * ファイル名に取引先名（ネクストビッツ/オフ・ビート・ワークス）が含まれているか確認
 */
function detectCompanyFromExcelFilename(filename: string): 'nextbits' | 'offbeat' | null {
  // ネクストビッツ: ファイル名に「ネクストビッツ」を含む
  if (filename.includes('ネクストビッツ')) {
    return 'nextbits'
  }
  // オフ・ビート・ワークス: ファイル名に「オフ・ビート・ワークス」を含む
  if (filename.includes('オフ・ビート・ワークス')) {
    return 'offbeat'
  }

  return null
}

/**
 * Excelテンプレートアップロード（初回処理用）
 */
export async function uploadExcelTemplate(
  companyId: string,
  file: File
): Promise<{ success: boolean; message: string }> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 800))

  // ファイル形式チェック
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    throw new Error('Excelファイル（.xlsx, .xls）のみアップロード可能です')
  }

  // 取引先を取得
  const company = mockCompanies.find((c) => c.id === companyId)
  if (!company) {
    throw new Error('取引先が見つかりません')
  }

  // ファイル名から取引先を判別
  const detectedCompany = detectCompanyFromExcelFilename(file.name)

  // 期待する取引先を判定
  const expectedCompany = company.name === 'ネクストビッツ' ? 'nextbits' : 'offbeat'
  const expectedCompanyName = company.display_name

  // 取引先が判別できない場合
  if (detectedCompany === null) {
    const keywordHint = company.name === 'ネクストビッツ' ? 'ネクストビッツ' : 'オフ・ビート・ワークス'
    throw new Error(
      `ファイル名に取引先名が含まれていません。\n` +
      `「${expectedCompanyName}」のExcelファイルをアップロードしてください。\n` +
      `（ファイル名に「${keywordHint}」を含める必要があります）`
    )
  }

  // 取引先が一致しない場合
  if (detectedCompany !== expectedCompany) {
    const uploadedCompanyName = detectedCompany === 'nextbits' ? '株式会社ネクストビッツ' : '株式会社オフ・ビート・ワークス'
    throw new Error(
      `選択したファイルは「${uploadedCompanyName}」のファイルです。\n` +
      `「${expectedCompanyName}」のExcelファイルをアップロードしてください。`
    )
  }

  // モック: 取引先のテンプレートを更新
  company.template_excel = file.name
  company.template_filename = file.name
  company.template_updated_at = new Date().toISOString()

  return {
    success: true,
    message: `テンプレート「${file.name}」をアップロードしました`,
  }
}

/**
 * PDF処理実行
 */
export async function executeProcess(
  _slots: PdfSlot[],
  companyId: string,
  onProgress: (progress: number, message: string) => void
): Promise<ProcessResult> {
  // モック処理（プログレス更新）
  const steps = [
    { progress: 10, message: 'PDFを解析中...', delay: 500 },
    { progress: 25, message: '見積書からデータを抽出中...', delay: 600 },
    { progress: 40, message: '請求書からデータを抽出中...', delay: 500 },
    { progress: 55, message: '注文請書からデータを抽出中...', delay: 400 },
    { progress: 70, message: '納品書からデータを抽出中...', delay: 500 },
    { progress: 80, message: 'Excelを編集中...', delay: 800 },
    { progress: 90, message: 'PDFを生成中...', delay: 700 },
    { progress: 100, message: '処理完了', delay: 300 },
  ]

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, step.delay))
    onProgress(step.progress, step.message)
  }

  // 取引先情報を取得
  const company = mockCompanies.find((c) => c.id === companyId)

  // 年月フォーマット（YYMM形式）
  const now = new Date()
  const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`

  // ファイル名生成
  // Excel: テラ【株式会社〇〇御中】注文検収書_YYMM.xlsx
  // 注文書PDF: 注文書_YYMM.pdf
  // 検収書PDF: 検収書_YYMM.pdf
  const displayName = company?.display_name || '取引先'

  return {
    excelFilename: `テラ【${displayName}御中】注文検収書_${yearMonth}.xlsx`,
    orderPdfFilename: `注文書_${yearMonth}.pdf`,
    inspectionPdfFilename: `検収書_${yearMonth}.pdf`,
    companyName: company?.name || '取引先',
    yearMonth,
  }
}

/**
 * 処理結果ファイルをダウンロード（モック）
 */
export async function downloadResultFile(
  filename: string,
  type: 'excel' | 'order_pdf' | 'inspection_pdf'
): Promise<void> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 300))

  console.log(`[Mock] Downloading ${type}: ${filename}`)

  // モック: 簡単なテキストファイルを生成してダウンロード
  const blob = new Blob([`モックファイル: ${filename}`], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 処理結果をZIPでダウンロード（モック）
 * ZIP名: 〇〇_YYMM.zip（例: オフ・ビート・ワークス_2512.zip）
 */
export async function downloadResultZip(result: ProcessResult): Promise<void> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 500))

  const zipFilename = `${result.companyName}_${result.yearMonth}.zip`

  console.log(`[Mock] Downloading ZIP: ${zipFilename}`)

  // モック: 簡単なテキストファイルを生成してダウンロード
  const blob = new Blob([`モックZIPファイル: ${zipFilename}`], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipFilename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * PDF種別の日本語表示
 */
export function getPdfTypeLabel(type: PdfType): string {
  switch (type) {
    case 'estimate':
      return '見積書'
    case 'invoice':
      return '請求書'
    case 'order_confirmation':
      return '注文請書'
    case 'delivery':
      return '納品書'
  }
}

/**
 * PDF種別の判別キーワード（エラーメッセージ用）
 */
export function getKeywordForType(type: PdfType): string {
  switch (type) {
    case 'estimate':
      return '見積'
    case 'invoice':
      return '請求'
    case 'order_confirmation':
      return '請書'
    case 'delivery':
      return '納品'
  }
}

/**
 * 全スロットが埋まっているか確認
 */
export function isAllSlotsReady(slots: PdfSlot[]): boolean {
  return slots.every((slot) => slot.status === 'uploaded')
}
