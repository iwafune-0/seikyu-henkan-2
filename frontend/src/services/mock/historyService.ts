import type {
  ProcessedFile,
  HistoryFilters,
  HistoryListResponse,
  DownloadFileType,
} from '@/types'

/**
 * モック処理履歴データ
 * Phase 7でSupabase APIに置き換え
 *
 * user_id/user_emailはusersServiceのモックユーザーと一致させる:
 * - mock-admin-id: admin@example.com
 * - mock-admin2-id: admin2@example.com
 * - mock-user-id: user@example.com
 */
let mockHistory: ProcessedFile[] = [
  {
    id: '1',
    user_id: 'mock-admin-id',
    user_email: 'admin@example.com',
    company_id: '1',
    company_name: 'ネクストビッツ',
    process_date: '2025-10-15',
    excel_file: 'mock_excel_base64',
    excel_filename: 'テラ【株式会社ネクストビッツ御中】注文検収書_2510.xlsx',
    order_pdf: 'mock_order_pdf_base64',
    order_pdf_filename: '注文書_2510.pdf',
    inspection_pdf: 'mock_inspection_pdf_base64',
    inspection_pdf_filename: '検収書_2510.pdf',
    input_pdf_1: 'mock_input_pdf_1_base64',
    input_pdf_1_filename: 'TRR-25-010_お見積書.pdf',
    input_pdf_2: 'mock_input_pdf_2_base64',
    input_pdf_2_filename: 'TRR-25-010_請求書.pdf',
    input_pdf_3: 'mock_input_pdf_3_base64',
    input_pdf_3_filename: 'TRR-25-010_注文請書.pdf',
    input_pdf_4: 'mock_input_pdf_4_base64',
    input_pdf_4_filename: 'TRR-25-010_納品書.pdf',
    processing_time: 12.5,
    status: 'success',
    created_at: '2025-10-15T14:30:00Z',
  },
  {
    id: '2',
    user_id: 'mock-admin-id',
    user_email: 'admin@example.com',
    company_id: '2',
    company_name: 'オフ・ビート・ワークス',
    process_date: '2025-10-14',
    excel_file: 'mock_excel_base64',
    excel_filename: 'テラ【株式会社オフ・ビート・ワークス御中】注文検収書_2510.xlsx',
    order_pdf: 'mock_order_pdf_base64',
    order_pdf_filename: '注文書_2510.pdf',
    inspection_pdf: 'mock_inspection_pdf_base64',
    inspection_pdf_filename: '検収書_2510.pdf',
    input_pdf_1: 'mock_input_pdf_1_base64',
    input_pdf_1_filename: '1951020-見積-offbeat-to-terra-202510.pdf',
    input_pdf_2: 'mock_input_pdf_2_base64',
    input_pdf_2_filename: '2951020-請求_offbeat-to-terra-202510.pdf',
    input_pdf_3: 'mock_input_pdf_3_base64',
    input_pdf_3_filename: '請書_offbeat-to-terra-202510.pdf',
    input_pdf_4: 'mock_input_pdf_4_base64',
    input_pdf_4_filename: '3951020-納品-offbeat-to-terra-202510.pdf',
    processing_time: 10.2,
    status: 'success',
    created_at: '2025-10-14T10:15:00Z',
  },
  {
    id: '3',
    user_id: 'mock-user-id',
    user_email: 'user@example.com',
    company_id: '1',
    company_name: 'ネクストビッツ',
    process_date: '2025-10-13',
    processing_time: 8.7,
    status: 'error',
    error_message: 'PDFのフォーマットが正しくありません',
    error_code: 'INVALID_PDF_FORMAT',
    error_detail: 'PDF解析中にエラーが発生しました。特定のフィールドが見つかりません。',
    error_stacktrace: `Error: PDF解析エラー
    at parsePDF (pdf_parser.py:125)
    at processFile (pdf_processor.py:67)
    at main (main.py:45)`,
    created_at: '2025-10-13T16:45:00Z',
  },
  {
    id: '4',
    user_id: 'mock-admin2-id',
    user_email: 'admin2@example.com',
    company_id: '2',
    company_name: 'オフ・ビート・ワークス',
    process_date: '2025-10-12',
    excel_file: 'mock_excel_base64',
    excel_filename: 'テラ【株式会社オフ・ビート・ワークス御中】注文検収書_2510.xlsx',
    order_pdf: 'mock_order_pdf_base64',
    order_pdf_filename: '注文書_2510.pdf',
    inspection_pdf: 'mock_inspection_pdf_base64',
    inspection_pdf_filename: '検収書_2510.pdf',
    input_pdf_1: 'mock_input_pdf_1_base64',
    input_pdf_1_filename: '1951019-見積-offbeat-to-terra-202510.pdf',
    input_pdf_2: 'mock_input_pdf_2_base64',
    input_pdf_2_filename: '2951019-請求_offbeat-to-terra-202510.pdf',
    input_pdf_3: 'mock_input_pdf_3_base64',
    input_pdf_3_filename: '請書_offbeat-to-terra-202510.pdf',
    input_pdf_4: 'mock_input_pdf_4_base64',
    input_pdf_4_filename: '3951019-納品-offbeat-to-terra-202510.pdf',
    processing_time: 9.3,
    status: 'success',
    created_at: '2025-10-12T11:20:00Z',
  },
  {
    id: '5',
    user_id: 'mock-user-id',
    user_email: 'user@example.com',
    company_id: '1',
    company_name: 'ネクストビッツ',
    process_date: '2025-10-10',
    excel_file: 'mock_excel_base64',
    excel_filename: 'テラ【株式会社ネクストビッツ御中】注文検収書_2510.xlsx',
    order_pdf: 'mock_order_pdf_base64',
    order_pdf_filename: '注文書_2510.pdf',
    inspection_pdf: 'mock_inspection_pdf_base64',
    inspection_pdf_filename: '検収書_2510.pdf',
    input_pdf_1: 'mock_input_pdf_1_base64',
    input_pdf_1_filename: 'TRR-25-010_お見積書.pdf',
    input_pdf_2: 'mock_input_pdf_2_base64',
    input_pdf_2_filename: 'TRR-25-010_請求書.pdf',
    input_pdf_3: 'mock_input_pdf_3_base64',
    input_pdf_3_filename: 'TRR-25-010_注文請書.pdf',
    input_pdf_4: 'mock_input_pdf_4_base64',
    input_pdf_4_filename: 'TRR-25-010_納品書.pdf',
    processing_time: 11.4,
    status: 'success',
    created_at: '2025-10-10T13:50:00Z',
  },
]

/**
 * 処理履歴一覧を取得（フィルター対応）
 */
export async function fetchHistory(filters?: HistoryFilters): Promise<HistoryListResponse> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 300))

  let filteredHistory = [...mockHistory]

  // フィルター適用
  if (filters) {
    if (filters.company_id) {
      filteredHistory = filteredHistory.filter((h) => h.company_id === filters.company_id)
    }
    if (filters.user_id) {
      filteredHistory = filteredHistory.filter((h) => h.user_id === filters.user_id)
    }
    if (filters.status) {
      filteredHistory = filteredHistory.filter((h) => h.status === filters.status)
    }
    if (filters.date_from) {
      filteredHistory = filteredHistory.filter((h) => h.process_date >= filters.date_from!)
    }
    if (filters.date_to) {
      filteredHistory = filteredHistory.filter((h) => h.process_date <= filters.date_to!)
    }
  }

  // 並び順
  const sortOrder = filters?.sort_order || 'desc'
  filteredHistory.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  return {
    history: filteredHistory,
    total: filteredHistory.length,
  }
}

/**
 * 個別ファイルをダウンロード
 */
export async function downloadFile(
  historyId: string,
  fileType: DownloadFileType
): Promise<void> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 300))

  const record = mockHistory.find((h) => h.id === historyId)
  if (!record) {
    throw new Error('処理履歴が見つかりません')
  }

  // ファイル名を取得
  let filename: string | undefined
  switch (fileType) {
    case 'excel':
      filename = record.excel_filename
      break
    case 'order_pdf':
      filename = record.order_pdf_filename
      break
    case 'inspection_pdf':
      filename = record.inspection_pdf_filename
      break
    case 'input_pdf_1':
      filename = record.input_pdf_1_filename
      break
    case 'input_pdf_2':
      filename = record.input_pdf_2_filename
      break
    case 'input_pdf_3':
      filename = record.input_pdf_3_filename
      break
    case 'input_pdf_4':
      filename = record.input_pdf_4_filename
      break
  }

  if (!filename) {
    throw new Error('ファイルが見つかりません')
  }

  // モック: ブラウザのダウンロードをトリガー
  console.log(`[Mock] Downloading file: ${filename}`)

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
 * ZIP一括ダウンロード
 */
export async function downloadZip(historyId: string): Promise<void> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 500))

  const record = mockHistory.find((h) => h.id === historyId)
  if (!record) {
    throw new Error('処理履歴が見つかりません')
  }

  if (record.status === 'error') {
    throw new Error('エラー発生時の処理はダウンロードできません')
  }

  // ZIPファイル名: {取引先名}_{YYMM}.zip
  const processDate = new Date(record.process_date)
  const yearMonth = `${String(processDate.getFullYear()).slice(-2)}${String(processDate.getMonth() + 1).padStart(2, '0')}`
  const zipFilename = `${record.company_name}_${yearMonth}.zip`

  // モック: ブラウザのダウンロードをトリガー
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
