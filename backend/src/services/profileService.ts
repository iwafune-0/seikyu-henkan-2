import { supabase } from '../lib/supabase'
import { User, UserRole } from '../types/index'

/**
 * profilesテーブル操作ヘルパー
 *
 * ユーザープロファイル情報の取得と検証を行うサービス層
 * JWTミドルウェアや権限チェックから利用される
 */

/**
 * ユーザーIDからプロファイル情報を取得
 *
 * @param userId - ユーザーID（UUID）
 * @returns ユーザープロファイル情報（削除済みの場合はnull）
 */
export async function getProfileByUserId(
  userId: string
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('プロファイル取得エラー:', error)
      return null
    }

    return data as User
  } catch (error) {
    console.error('プロファイル取得中に例外が発生しました:', error)
    return null
  }
}

/**
 * ユーザーが削除済みかどうかをチェック
 *
 * @param userId - ユーザーID（UUID）
 * @returns 削除済みの場合true、それ以外false
 */
export async function isUserDeleted(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_deleted')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('削除済みチェックエラー:', error)
      return true // エラー時は安全のためtrueを返す
    }

    return data?.is_deleted === true
  } catch (error) {
    console.error('削除済みチェック中に例外が発生しました:', error)
    return true // エラー時は安全のためtrueを返す
  }
}

/**
 * ユーザーのロールを取得
 *
 * @param userId - ユーザーID（UUID）
 * @returns ユーザーロール（'admin' | 'user'）、取得失敗時は'user'
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('ロール取得エラー:', error)
      return 'user' // デフォルトは一般ユーザー
    }

    return (data?.role as UserRole) || 'user'
  } catch (error) {
    console.error('ロール取得中に例外が発生しました:', error)
    return 'user' // デフォルトは一般ユーザー
  }
}

/**
 * ユーザーのメールアドレスを取得
 *
 * @param userId - ユーザーID（UUID）
 * @returns メールアドレス、取得失敗時はnull
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('メールアドレス取得エラー:', error)
      return null
    }

    return data?.email || null
  } catch (error) {
    console.error('メールアドレス取得中に例外が発生しました:', error)
    return null
  }
}

/**
 * ユーザーが有効かどうかをチェック（削除されていないか）
 *
 * @param userId - ユーザーID（UUID）
 * @returns 有効なユーザーの場合true、削除済みの場合false
 */
export async function isUserActive(userId: string): Promise<boolean> {
  const deleted = await isUserDeleted(userId)
  return !deleted
}
