import { supabase } from '../lib/supabase'
import { ProcessedFile, HistoryFilters, DownloadFileType } from '../types/index'

/**
 * 処理履歴サービス
 *
 * processed_filesテーブルへのデータアクセスを提供する。
 * 全ユーザーが全データを閲覧可能（認証は必須）。
 */

/**
 * 処理履歴一覧を取得（フィルター対応）
 *
 * @param filters - フィルター条件（company_id, user_id, status, date_from, date_to, sort_order）
 * @returns 処理履歴の配列
 * @throws データベースエラー
 */
export async function getAllHistory(filters: HistoryFilters): Promise<ProcessedFile[]> {
  const {
    company_id,
    user_id,
    status,
    date_from,
    date_to,
    sort_order = 'desc',
  } = filters

  // クエリビルダーの作成（ファイルデータ（BYTEA）は除外してパフォーマンス向上）
  let query = supabase
    .from('processed_files')
    .select(`
      id,
      user_id,
      company_id,
      process_date,
      excel_filename,
      order_pdf_filename,
      inspection_pdf_filename,
      input_pdf_1_filename,
      input_pdf_2_filename,
      input_pdf_3_filename,
      input_pdf_4_filename,
      processing_time,
      status,
      error_message,
      error_code,
      error_detail,
      error_stacktrace,
      created_at,
      profiles:user_id(email),
      companies:company_id(name)
    `)

  // フィルター適用
  if (company_id) {
    query = query.eq('company_id', company_id)
  }

  if (user_id) {
    query = query.eq('user_id', user_id)
  }

  if (status && (status === 'success' || status === 'error')) {
    query = query.eq('status', status)
  }

  if (date_from) {
    query = query.gte('process_date', date_from)
  }

  if (date_to) {
    query = query.lte('process_date', date_to)
  }

  // ソート順
  query = query.order('created_at', { ascending: sort_order === 'asc' })

  const { data, error } = await query

  if (error) {
    console.error('処理履歴一覧取得エラー:', error)
    throw new Error('処理履歴の取得に失敗しました')
  }

  // データ整形（JOINした情報を展開）
  const history: ProcessedFile[] = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id as string,
    user_id: item.user_id as string,
    user_email: (item.profiles as { email: string })?.email || '',
    company_id: item.company_id as string,
    company_name: (item.companies as { name: string })?.name || '',
    process_date: item.process_date as string,
    excel_filename: item.excel_filename as string | undefined,
    order_pdf_filename: item.order_pdf_filename as string | undefined,
    inspection_pdf_filename: item.inspection_pdf_filename as string | undefined,
    input_pdf_1_filename: item.input_pdf_1_filename as string | undefined,
    input_pdf_2_filename: item.input_pdf_2_filename as string | undefined,
    input_pdf_3_filename: item.input_pdf_3_filename as string | undefined,
    input_pdf_4_filename: item.input_pdf_4_filename as string | undefined,
    processing_time: item.processing_time as number | undefined,
    status: item.status as 'success' | 'error',
    error_message: item.error_message as string | undefined,
    error_code: item.error_code as string | undefined,
    error_detail: item.error_detail as string | undefined,
    error_stacktrace: item.error_stacktrace as string | undefined,
    created_at: item.created_at as string,
  }))

  return history
}

/**
 * 個別ファイルを取得
 *
 * @param historyId - 処理履歴ID
 * @param fileType - ファイルタイプ（excel, order_pdf, inspection_pdf, input_pdf_1~4）
 * @returns ファイル情報（Buffer、ファイル名）、存在しない場合はnull
 * @throws データベースエラー
 */
export async function getFileById(
  historyId: string,
  fileType: DownloadFileType
): Promise<{ buffer: Buffer; filename: string } | null> {
  // ファイルタイプに応じたカラム名を決定
  const fileColumnMap: Record<DownloadFileType, { data: string; filename: string }> = {
    excel: { data: 'excel_file', filename: 'excel_filename' },
    order_pdf: { data: 'order_pdf', filename: 'order_pdf_filename' },
    inspection_pdf: { data: 'inspection_pdf', filename: 'inspection_pdf_filename' },
    input_pdf_1: { data: 'input_pdf_1', filename: 'input_pdf_1_filename' },
    input_pdf_2: { data: 'input_pdf_2', filename: 'input_pdf_2_filename' },
    input_pdf_3: { data: 'input_pdf_3', filename: 'input_pdf_3_filename' },
    input_pdf_4: { data: 'input_pdf_4', filename: 'input_pdf_4_filename' },
  }

  const columns = fileColumnMap[fileType]

  if (!columns) {
    throw new Error(`無効なファイルタイプです: ${fileType}`)
  }

  const { data, error } = await supabase
    .from('processed_files')
    .select(`${columns.data}, ${columns.filename}`)
    .eq('id', historyId)
    .single()

  if (error) {
    // 存在しない場合はnullを返す
    if (error.code === 'PGRST116') {
      return null
    }

    console.error('ファイル取得エラー:', error)
    throw new Error('ファイルの取得に失敗しました')
  }

  const fileData = (data as unknown as Record<string, unknown>)[columns.data] as Buffer | null | undefined
  const filename = (data as unknown as Record<string, unknown>)[columns.filename] as string | null | undefined

  // ファイルが存在しない場合
  if (!fileData || !filename) {
    return null
  }

  return {
    buffer: Buffer.from(fileData),
    filename,
  }
}

/**
 * ZIP一括ダウンロード用のファイル一覧を取得
 *
 * @param historyId - 処理履歴ID
 * @returns ファイル情報の配列、存在しない場合はnull
 * @throws データベースエラー
 */
export async function getFilesForZip(
  historyId: string
): Promise<{
  status: string
  companyName: string
  processDate: string
  files: Array<{ buffer: Buffer; filename: string }>
} | null> {
  const { data, error } = await supabase
    .from('processed_files')
    .select(`
      excel_file,
      excel_filename,
      order_pdf,
      order_pdf_filename,
      inspection_pdf,
      inspection_pdf_filename,
      status,
      process_date,
      companies:company_id(name)
    `)
    .eq('id', historyId)
    .single()

  if (error) {
    // 存在しない場合はnullを返す
    if (error.code === 'PGRST116') {
      return null
    }

    console.error('ZIPファイル取得エラー:', error)
    throw new Error('ファイルの取得に失敗しました')
  }

  // 取引先名と処理日を取得
  const companies = data.companies as unknown as { name: string } | null
  const companyName = companies?.name || ''
  const processDate = data.process_date as string

  // ステータスがerrorの場合はダウンロード不可
  if (data.status === 'error') {
    return { status: 'error', companyName, processDate, files: [] }
  }

  const files: Array<{ buffer: Buffer; filename: string }> = []

  // 各ファイルを配列に追加（出力ファイル3つのみ）
  const fileTypes: Array<{ data: keyof typeof data; filename: keyof typeof data }> = [
    { data: 'excel_file', filename: 'excel_filename' },
    { data: 'order_pdf', filename: 'order_pdf_filename' },
    { data: 'inspection_pdf', filename: 'inspection_pdf_filename' },
  ]

  for (const fileType of fileTypes) {
    const fileData = data[fileType.data] as Buffer | null | undefined
    const filename = data[fileType.filename] as string | null | undefined

    if (fileData && filename) {
      files.push({
        buffer: Buffer.from(fileData),
        filename,
      })
    }
  }

  return { status: 'success', companyName, processDate, files }
}
