/**
 * Supabase Admin API ヘルパー
 *
 * E2Eテスト用に招待リンクやパスワードリセットリンクを生成する。
 * バックエンドのコードには一切影響しない。
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// バックエンドの.envを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check backend/.env'
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * 招待リンクを生成する（メール送信なし）
 * P-001b テスト用
 *
 * 生成されたリンクはSupabaseのverifyエンドポイント経由で
 * フロントエンドの/accept-invitationにリダイレクトされる
 */
export async function generateInviteLink(email: string, role: 'admin' | 'user' = 'user'): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { role },
      redirectTo: 'http://localhost:5174/accept-invitation',
    },
  })

  if (error) {
    throw new Error(`Failed to generate invite link: ${error.message}`)
  }

  if (!data?.properties?.action_link) {
    throw new Error('No action_link in response')
  }

  return data.properties.action_link
}

/**
 * パスワードリセットリンクを生成する（メール送信なし）
 * P-001c テスト用
 *
 * 生成されたリンクはSupabaseのverifyエンドポイント経由で
 * フロントエンドの/reset-password?step=passwordにリダイレクトされる
 */
export async function generateRecoveryLink(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: 'http://localhost:5174/reset-password?step=password',
    },
  })

  if (error) {
    throw new Error(`Failed to generate recovery link: ${error.message}`)
  }

  if (!data?.properties?.action_link) {
    throw new Error('No action_link in response')
  }

  return data.properties.action_link
}

/**
 * テスト用ユーザーを作成する
 */
export async function createTestUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  return data.user.id
}

/**
 * テスト用ユーザーを削除する
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(`Failed to delete test user: ${error.message}`)
  }
}

/**
 * メールアドレスでユーザーを検索して削除する
 */
export async function deleteTestUserByEmail(email: string): Promise<void> {
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === email)

  if (user) {
    await deleteTestUser(user.id)
  }
}

/**
 * profilesテーブルからテストユーザーを削除
 */
export async function deleteTestProfile(email: string): Promise<void> {
  await supabase
    .from('profiles')
    .delete()
    .eq('email', email)
}

// ============================================
// P-002 PDF処理テスト用ヘルパー
// ============================================

/**
 * 取引先IDを取得する
 */
export async function getCompanyId(companyName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', `%${companyName}%`)
    .single()

  if (error || !data) {
    return null
  }

  return data.id
}

/**
 * 処理済みファイルを取引先IDで削除する
 * P-002 テスト用クリーンアップ
 */
export async function deleteProcessedFilesByCompanyId(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('processed_files')
    .delete()
    .eq('company_id', companyId)

  if (error) {
    console.warn(`Failed to delete processed files: ${error.message}`)
  }
}

/**
 * 処理ログを取引先IDで削除する
 * P-002 テスト用クリーンアップ
 */
export async function deleteProcessLogsByCompanyId(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('process_logs')
    .delete()
    .eq('company_id', companyId)

  if (error) {
    console.warn(`Failed to delete process logs: ${error.message}`)
  }
}

/**
 * 取引先のテンプレートExcelをクリアする
 * TC-001（初回処理フロー）テスト用
 */
export async function clearCompanyTemplate(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({
      template_excel: null,
      template_filename: null,
      template_updated_at: null,
      template_updated_by: null,
    })
    .eq('id', companyId)

  if (error) {
    console.warn(`Failed to clear company template: ${error.message}`)
  }
}

/**
 * P-002テスト用の全クリーンアップ
 */
export async function cleanupP002TestData(companyName: string): Promise<void> {
  const companyId = await getCompanyId(companyName)
  if (!companyId) {
    console.warn(`Company not found: ${companyName}`)
    return
  }

  await deleteProcessedFilesByCompanyId(companyId)
  await deleteProcessLogsByCompanyId(companyId)
}

/**
 * E2Eテストで作成された全ユーザーを一括削除
 * 手動クリーンアップ用
 */
export async function cleanupAllE2ETestUsers(): Promise<{ deleted: string[], errors: string[] }> {
  const deleted: string[] = []
  const errors: string[] = []

  // E2Eテストで生成されたパターンにマッチするユーザーを取得
  const { data: users } = await supabase.auth.admin.listUsers()

  if (!users?.users) {
    return { deleted, errors }
  }

  // e2e-で始まるメールアドレスのユーザーを削除
  const e2eUsers = users.users.filter(u =>
    u.email?.startsWith('e2e-') && u.email?.endsWith('@example.com')
  )

  for (const user of e2eUsers) {
    try {
      await supabase.auth.admin.deleteUser(user.id)
      deleted.push(user.email || user.id)
    } catch (err) {
      errors.push(`${user.email}: ${err}`)
    }
  }

  // profilesテーブルからも削除
  await supabase
    .from('profiles')
    .delete()
    .like('email', 'e2e-%@example.com')

  return { deleted, errors }
}

/**
 * Supabaseクライアントをエクスポート（直接クエリ用）
 */
export { supabase }
