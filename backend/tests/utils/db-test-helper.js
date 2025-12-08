/**
 * データベーステストヘルパー
 *
 * 統合テストで使用するデータベース操作ユーティリティ
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
  )
}

// Supabaseクライアント（テスト用）
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * データベース接続の健全性チェック
 */
async function checkDatabaseConnection() {
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

/**
 * テスト用ユーザーの作成
 *
 * @param {object} options - ユーザー情報
 * @param {string} options.email - メールアドレス
 * @param {string} options.password - パスワード
 * @param {string} options.role - ロール ('admin' | 'user')
 * @returns {Promise<object>} 作成されたユーザー情報
 */
async function createTestUser({ email, password, role = 'user' }) {
  try {
    // 1. Supabase Authでユーザー作成
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール確認をスキップ
      })

    if (authError) {
      console.error('テストユーザー作成エラー (Auth):', authError)
      throw authError
    }

    const userId = authData.user.id

    // 2. profilesテーブルにデータ追加
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email,
      role,
      is_deleted: false,
    })

    if (profileError) {
      console.error('テストユーザー作成エラー (Profile):', profileError)
      // Authで作成したユーザーを削除
      await supabase.auth.admin.deleteUser(userId)
      throw profileError
    }

    return {
      id: userId,
      email,
      role,
    }
  } catch (error) {
    console.error('テストユーザー作成中にエラーが発生しました:', error)
    throw error
  }
}

/**
 * テスト用ユーザーの削除
 *
 * @param {string} userId - ユーザーID
 */
async function deleteTestUser(userId) {
  try {
    // 1. profilesテーブルから削除
    await supabase.from('profiles').delete().eq('id', userId)

    // 2. Supabase Authから削除
    await supabase.auth.admin.deleteUser(userId)

    console.log(`テストユーザー削除完了: ${userId}`)
  } catch (error) {
    console.error('テストユーザー削除中にエラーが発生しました:', error)
  }
}

/**
 * メールアドレスでユーザーを検索して削除
 *
 * @param {string} email - メールアドレス
 */
async function deleteTestUserByEmail(email) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (data) {
      await deleteTestUser(data.id)
    }
  } catch (error) {
    console.error('テストユーザー削除中にエラーが発生しました:', error)
  }
}

/**
 * テスト用ユーザーをログインさせてトークンを取得
 *
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @returns {Promise<string>} アクセストークン
 */
async function loginTestUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('テストユーザーログインエラー:', error)
      throw error
    }

    return data.session.access_token
  } catch (error) {
    console.error('テストユーザーログイン中にエラーが発生しました:', error)
    throw error
  }
}

module.exports = {
  supabase,
  checkDatabaseConnection,
  createTestUser,
  deleteTestUser,
  deleteTestUserByEmail,
  loginTestUser,
}
