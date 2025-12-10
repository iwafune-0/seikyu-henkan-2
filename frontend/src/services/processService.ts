/**
 * P-002: PDF処理実行サービス
 *
 * バックエンドAPI (/api/process) と通信
 * Phase 8でモックから実APIに切り替え
 */

import { apiPostFormData, apiDownloadBlob, triggerDownload } from '@/lib/api'
import { API_PATHS, type Company, type ProcessResult } from '@/types'

// types/index.tsからProcessResultをre-export
export type { ProcessResult } from '@/types'

// ========================================
// 型定義（フロントエンド専用）
// ========================================

// PDF種別（4種類必須）
export type PdfType = 'estimate' | 'invoice' | 'order_confirmation' | 'delivery'

// 全PDF種別リスト
export const ALL_PDF_TYPES: PdfType[] = ['estimate', 'invoice', 'order_confirmation', 'delivery']

// PDF種別ごとのファイル状態（フロントエンド用）
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
  missingTypes: PdfType[]
}

// 処理状態
export type ProcessState =
  | 'initial'
  | 'uploading'
  | 'detecting'
  | 'detected'
  | 'incomplete'
  | 'excel_required'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'error'

// 取引先判別結果
export interface DetectionResult {
  company: Company | null
  pdfSlots: PdfSlot[]
  preCheck: PreCheckResult
  needsExcel: boolean
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * PDFの種別を判別（ファイル名から）
 */
export function detectPdfType(filename: string): PdfType | null {
  const lowerName = filename.toLowerCase()

  // 注文請書: 「請書」で判定（「請求」より先にチェック）
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
  return null
}

/**
 * ファイル名から取引先を判別
 */
export function detectCompanyFromFilename(filename: string): 'nextbits' | 'offbeat' | null {
  if (filename.startsWith('TRR-')) {
    return 'nextbits'
  }
  if (filename.includes('offbeat-to-terra')) {
    return 'offbeat'
  }
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
 * ファイルをスロットに割り当て（ローカル処理）
 */
export function assignFilesToSlots(files: File[], existingSlots?: PdfSlot[]): PdfSlot[] {
  const slots: PdfSlot[] = existingSlots
    ? existingSlots.map((s) => ({ ...s }))
    : createEmptySlots()

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
 * 特定スロットのファイルを削除
 */
export function removeFromSlot(targetType: PdfType, existingSlots: PdfSlot[]): PdfSlot[] {
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
 * PDF種別の判別キーワード
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

// ========================================
// APIサービス関数
// ========================================

/**
 * バックエンドAPIレスポンスのPdfSlot型
 */
interface BackendPdfSlot {
  type: PdfType
  file: { filename: string; buffer: string } | null
  status: 'empty' | 'uploaded' | 'error'
  errorMessage?: string
}

/**
 * バックエンドのDetectionResult型
 */
interface BackendDetectionResult {
  company: Company | null
  pdfSlots: BackendPdfSlot[]
  preCheck: PreCheckResult
  needsExcel: boolean
}

/**
 * バックエンドのPdfSlotをフロントエンド用に変換
 * バックエンドから返されるスロットにはファイルデータがないため、
 * 元のファイルを保持する
 */
function convertToFrontendSlots(backendSlots: BackendPdfSlot[], originalFiles: File[]): PdfSlot[] {
  return backendSlots.map((backendSlot) => {
    // 元のファイルを見つける
    const originalFile = originalFiles.find((file) => {
      const type = detectPdfType(file.name)
      return type === backendSlot.type
    })

    return {
      type: backendSlot.type,
      file: backendSlot.status === 'uploaded' ? (originalFile || null) : null,
      status: backendSlot.status,
      errorMessage: backendSlot.errorMessage,
    }
  })
}

/**
 * PDFアップロード・取引先判別
 * POST /api/process/detect
 */
export async function detectAndPreCheck(
  files: File[],
  existingSlots?: PdfSlot[]
): Promise<DetectionResult> {
  const formData = new FormData()

  // ファイルを追加
  for (const file of files) {
    formData.append('files', file)
  }

  // 既存スロット情報を追加（JSON文字列として）
  if (existingSlots) {
    // ファイルオブジェクトは送信できないため、メタデータのみ送信
    const slotsMetadata = existingSlots.map((slot) => ({
      type: slot.type,
      filename: slot.file?.name || null,
      status: slot.status,
    }))
    formData.append('existingSlots', JSON.stringify(slotsMetadata))
  }

  const response = await apiPostFormData<BackendDetectionResult>(API_PATHS.PROCESS.DETECT, formData)

  // 全てのファイル（既存 + 新規）を収集
  const allFiles = [
    ...files,
    ...(existingSlots?.filter((s) => s.file).map((s) => s.file as File) || []),
  ]

  return {
    company: response.company,
    pdfSlots: convertToFrontendSlots(response.pdfSlots, allFiles),
    preCheck: response.preCheck,
    needsExcel: response.needsExcel,
  }
}

/**
 * 単一ファイルを特定スロットにアップロード
 * POST /api/process/upload-single
 */
export async function uploadSinglePdf(
  file: File,
  targetType: PdfType,
  existingSlots: PdfSlot[]
): Promise<DetectionResult> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('targetType', targetType)

  // 既存スロット情報を追加
  const slotsMetadata = existingSlots.map((slot) => ({
    type: slot.type,
    filename: slot.file?.name || null,
    status: slot.status,
  }))
  formData.append('existingSlots', JSON.stringify(slotsMetadata))

  const response = await apiPostFormData<BackendDetectionResult>(
    API_PATHS.PROCESS.UPLOAD_SINGLE,
    formData
  )

  // 全てのファイル（既存 + 新規）を収集
  const allFiles = [
    file,
    ...existingSlots.filter((s) => s.file && s.type !== targetType).map((s) => s.file as File),
  ]

  return {
    company: response.company,
    pdfSlots: convertToFrontendSlots(response.pdfSlots, allFiles),
    preCheck: response.preCheck,
    needsExcel: response.needsExcel,
  }
}

/**
 * Excelテンプレートアップロード（初回処理用）
 * POST /api/process/upload-excel
 */
export async function uploadExcelTemplate(
  companyId: string,
  file: File
): Promise<{ success: boolean; message: string }> {
  const formData = new FormData()

  formData.append('file', file)
  formData.append('companyId', companyId)

  return apiPostFormData<{ success: boolean; message: string }>(
    API_PATHS.PROCESS.UPLOAD_EXCEL,
    formData
  )
}

/**
 * PDF処理実行
 * POST /api/process/execute
 */
export async function executeProcess(
  slots: PdfSlot[],
  companyId: string,
  onProgress: (progress: number, message: string) => void
): Promise<ProcessResult> {
  // FormDataでPDFファイルを送信
  const formData = new FormData()

  formData.append('companyId', companyId)

  // 各スロットのPDFファイルを追加
  for (const slot of slots) {
    if (slot.file) {
      formData.append(`pdf_${slot.type}`, slot.file)
    }
  }

  // 進捗更新（APIはプログレスを返さないため、クライアント側でシミュレート）
  onProgress(10, 'PDFを解析中...')

  const progressSteps = [
    { progress: 25, message: '見積書からデータを抽出中...' },
    { progress: 40, message: '請求書からデータを抽出中...' },
    { progress: 55, message: '注文請書からデータを抽出中...' },
    { progress: 70, message: '納品書からデータを抽出中...' },
    { progress: 80, message: 'Excelを編集中...' },
    { progress: 90, message: 'PDFを生成中...' },
  ]

  // 進捗を段階的に更新するPromise
  const progressPromise = (async () => {
    for (const step of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onProgress(step.progress, step.message)
    }
  })()

  // API呼び出し
  const apiPromise = apiPostFormData<ProcessResult>(API_PATHS.PROCESS.EXECUTE, formData)

  // 両方を並行実行
  const [result] = await Promise.all([apiPromise, progressPromise])

  onProgress(100, '処理完了')

  return result
}

/**
 * 処理結果ファイルをダウンロード
 * GET /api/process/download/:processId/:fileType
 */
export async function downloadResultFile(
  processId: string,
  fileType: 'excel' | 'order_pdf' | 'inspection_pdf'
): Promise<void> {
  const { blob, filename } = await apiDownloadBlob(
    API_PATHS.PROCESS.DOWNLOAD(processId, fileType)
  )
  triggerDownload(blob, filename)
}

/**
 * 処理結果をZIPでダウンロード
 * GET /api/process/download-zip/:processId
 */
export async function downloadResultZip(processId: string): Promise<void> {
  const { blob, filename } = await apiDownloadBlob(API_PATHS.PROCESS.DOWNLOAD_ZIP(processId))
  triggerDownload(blob, filename)
}
