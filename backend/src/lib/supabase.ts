import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
  )
}

/**
 * Supabaseクライアント（Service Role Key使用）
 *
 * Service Role Keyを使用することで、RLSをバイパスし、
 * バックエンドで全テーブルへの完全なアクセス権限を持つ。
 *
 * 注意: このクライアントはバックエンドでのみ使用し、
 * フロントエンドには絶対に公開しないこと。
 */
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * データベース接続の健全性チェック
 * サーバー起動時に呼び出して接続を確認する
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1)

    if (error) {
      console.error('データベース接続エラー:', error.message)
      return false
    }

    console.log('✅ データベース接続成功')
    return true
  } catch (error) {
    console.error('データベース接続チェック中にエラーが発生しました:', error)
    return false
  }
}
