import { supabase } from '../lib/supabase'
import { Company } from '../types/index'
import { decodeByteaToBuffer } from '../utils/response'

/**
 * 取引先サービス
 *
 * companiesテーブルへのデータアクセスを提供する。
 * Excelテンプレートの保存・取得はBYTEA型で直接DBに格納する。
 */

/**
 * 取引先一覧を取得
 *
 * @returns 取引先の配列
 * @throws データベースエラー
 */
export async function getAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('取引先一覧取得エラー:', error)
    throw new Error('取引先一覧の取得に失敗しました')
  }

  return data as Company[]
}

/**
 * 取引先IDから詳細情報を取得
 *
 * @param companyId - 取引先ID
 * @returns 取引先情報（存在しない場合はnull）
 * @throws データベースエラー
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) {
    // 存在しない場合はnullを返す（エラーとしない）
    if (error.code === 'PGRST116') {
      return null
    }

    console.error('取引先詳細取得エラー:', error)
    throw new Error('取引先情報の取得に失敗しました')
  }

  return data as Company
}

/**
 * 取引先情報を更新
 *
 * @param companyId - 取引先ID
 * @param updates - 更新内容（name, display_name, is_active）
 * @returns 更新後の取引先情報
 * @throws データベースエラー
 */
export async function updateCompany(
  companyId: string,
  updates: {
    name?: string
    display_name?: string
    is_active?: boolean
  }
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single()

  if (error) {
    console.error('取引先更新エラー:', error)
    throw new Error('取引先情報の更新に失敗しました')
  }

  return data as Company
}

/**
 * Excelテンプレートをアップロード（BYTEA型で保存）
 *
 * @param companyId - 取引先ID
 * @param fileBuffer - ファイルのBuffer
 * @param filename - ファイル名
 * @param userId - アップロードしたユーザーのID
 * @returns 更新後の取引先情報
 * @throws データベースエラー
 */
export async function uploadTemplate(
  companyId: string,
  fileBuffer: Buffer,
  filename: string,
  userId: string
): Promise<Company> {
  const now = new Date().toISOString()

  // Supabaseのbytea型カラムにはBase64エンコードした文字列として保存
  // 読み込み時もBase64文字列として返されるため、整合性を保つ
  const base64Data = fileBuffer.toString('base64')

  const { data, error } = await supabase
    .from('companies')
    .update({
      template_excel: base64Data,
      template_filename: filename,
      template_updated_at: now,
      template_updated_by: userId,
    })
    .eq('id', companyId)
    .select()
    .single()

  if (error) {
    console.error('テンプレートアップロードエラー:', error)
    throw new Error('テンプレートのアップロードに失敗しました')
  }

  return data as Company
}

/**
 * Excelテンプレートを取得（BYTEA型から取得）
 *
 * @param companyId - 取引先ID
 * @returns テンプレート情報（Buffer、ファイル名）、存在しない場合はnull
 * @throws データベースエラー
 */
export async function getTemplate(
  companyId: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('template_excel, template_filename')
    .eq('id', companyId)
    .single()

  if (error) {
    // 存在しない場合はnullを返す
    if (error.code === 'PGRST116') {
      return null
    }

    console.error('テンプレート取得エラー:', error)
    throw new Error('テンプレートの取得に失敗しました')
  }

  // テンプレートが存在しない場合
  if (!data.template_excel || !data.template_filename) {
    return null
  }

  return {
    buffer: decodeByteaToBuffer(data.template_excel),
    filename: data.template_filename,
  }
}
