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
export async function createTestUser(email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  // profilesテーブルにロールを設定
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      email,
      role,
      is_deleted: false,
    })

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`)
  }

  return data.user.id
}

/**
 * テスト用ユーザーを削除する
 * エラーが発生しても警告を出すのみで続行
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    console.warn(`Warning: Failed to delete test user: ${error.message}`)
  }
}

/**
 * メールアドレスでユーザーを検索して削除する
 * auth.usersにユーザーがいなくてもprofilesは削除する
 */
export async function deleteTestUserByEmail(email: string): Promise<void> {
  // profilesテーブルから削除（常に実行）
  await supabase
    .from('profiles')
    .delete()
    .eq('email', email)

  // auth.usersから削除（存在する場合のみ）
  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users?.find(u => u.email === email)

  if (user) {
    await deleteTestUser(user.id)
  }
}

/**
 * 論理削除済みユーザーを作成する
 * E2E-USER-014テスト用
 *
 * このテストでは、profilesテーブルのみに論理削除済みユーザーを残し、
 * auth.usersからはユーザーを削除します。
 * これにより、再招待時にSupabase Authが新規ユーザーとして扱い、
 * 招待メールを送信できるようになります。
 */
export async function createDeletedUser(email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<string> {
  // まず既存ユーザーがいれば完全削除
  await deleteTestUserByEmail(email)

  // profilesテーブルに論理削除済みユーザーを作成
  // UUIDはauth.usersのIDと一致する必要があるため、仮のIDを使用
  // 実際の再招待時に新しいIDで作成される
  const tempId = '00000000-0000-0000-0000-000000000000'

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: tempId,
      email,
      role,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })

  if (profileError) {
    // 既に存在する場合は更新
    await supabase
      .from('profiles')
      .update({
        role,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('email', email)
  }

  return tempId
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
 * 取引先のdisplay_nameをリセットする（E2Eテスト後のクリーンアップ用）
 * nameと同じ値に戻す（「株式会社」プレフィックス付き）
 */
export async function resetCompanyDisplayName(companyName: string): Promise<void> {
  const displayNameMap: Record<string, string> = {
    'ネクストビッツ': '株式会社ネクストビッツ',
    'オフ・ビート・ワークス': '株式会社オフ・ビート・ワークス',
  }

  const correctDisplayName = displayNameMap[companyName]
  if (!correctDisplayName) {
    console.warn(`Unknown company name: ${companyName}`)
    return
  }

  const { error } = await supabase
    .from('companies')
    .update({ display_name: correctDisplayName })
    .ilike('name', `%${companyName}%`)

  if (error) {
    console.warn(`Failed to reset display_name for ${companyName}: ${error.message}`)
  } else {
    console.log(`Reset display_name for ${companyName} to "${correctDisplayName}"`)
  }
}

/**
 * 処理済みファイルを取引先IDで削除する（テストデータのみ）
 * P-002 テスト用クリーンアップ
 *
 * 注意: 実際の処理データを保護するため、テストデータのみ削除する
 * テストデータの判定: ファイル名に "E2E" または "テスト" を含む
 */
export async function deleteProcessedFilesByCompanyId(companyId: string): Promise<void> {
  // テストデータのみ削除（E2E または テスト を含むファイル名）
  const { error: error1 } = await supabase
    .from('processed_files')
    .delete()
    .eq('company_id', companyId)
    .ilike('excel_filename', '%E2E%')

  const { error: error2 } = await supabase
    .from('processed_files')
    .delete()
    .eq('company_id', companyId)
    .ilike('excel_filename', '%テスト%')

  if (error1) {
    console.warn(`Failed to delete processed files (E2E): ${error1.message}`)
  }
  if (error2) {
    console.warn(`Failed to delete processed files (テスト): ${error2.message}`)
  }
}

/**
 * 処理ログを取引先IDで削除する（テストデータのみ）
 * P-002 テスト用クリーンアップ
 *
 * 注意: 実際の処理データを保護するため、テストデータのみ削除する
 * テストデータの判定: エラーメッセージに "E2E" または "テスト" を含む、
 * または関連するprocessed_filesがテストデータの場合
 */
export async function deleteProcessLogsByCompanyId(companyId: string): Promise<void> {
  // テストデータのみ削除
  const { error: error1 } = await supabase
    .from('process_logs')
    .delete()
    .eq('company_id', companyId)
    .ilike('error_message', '%E2E%')

  const { error: error2 } = await supabase
    .from('process_logs')
    .delete()
    .eq('company_id', companyId)
    .ilike('error_message', '%テスト%')

  // error_messageがnullのテストログも削除（成功ログ）
  // ただし、実際のログを保護するため、最近作成されたもののみ対象
  // （テストは短時間で作成・削除されるため）

  if (error1) {
    console.warn(`Failed to delete process logs (E2E): ${error1.message}`)
  }
  if (error2) {
    console.warn(`Failed to delete process logs (テスト): ${error2.message}`)
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
 * テンプレートバックアップデータの型（会社情報全般のバックアップに使用）
 */
export interface TemplateBackup {
  template_excel: string | null
  template_filename: string | null
  template_updated_at: string | null
  template_updated_by: string | null
  display_name?: string | null
  is_active?: boolean
}

/**
 * 取引先のテンプレートをバックアップする
 * E2E-COMP-017, 022, 023, 039テスト用
 */
export async function backupCompanyTemplate(companyId: string): Promise<TemplateBackup | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('template_excel, template_filename, template_updated_at, template_updated_by, display_name, is_active')
    .eq('id', companyId)
    .single()

  if (error) {
    console.warn(`Failed to backup company template: ${error.message}`)
    return null
  }

  return data as TemplateBackup
}

/**
 * 取引先のテンプレートをリストアする
 * E2E-COMP-017, 022, 023, 039テスト用
 */
export async function restoreCompanyTemplate(companyId: string, backup: TemplateBackup): Promise<void> {
  const updateData: Record<string, unknown> = {
    template_excel: backup.template_excel,
    template_filename: backup.template_filename,
    template_updated_at: backup.template_updated_at,
    template_updated_by: backup.template_updated_by,
  }

  // display_nameが含まれている場合は復元する
  if (backup.display_name !== undefined) {
    updateData.display_name = backup.display_name
  }

  // is_activeが含まれている場合は復元する
  if (backup.is_active !== undefined) {
    updateData.is_active = backup.is_active
  }

  const { error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', companyId)

  if (error) {
    console.warn(`Failed to restore company template: ${error.message}`)
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

// ============================================
// P-003 処理履歴テスト用ヘルパー
// ============================================

/**
 * P-003テスト用の成功処理データを作成
 */
export async function createP003SuccessTestData(): Promise<string | null> {
  // 取引先IDを取得
  const companyId = await getCompanyId('ネクストビッツ')
  if (!companyId) {
    console.warn('Company not found: ネクストビッツ')
    return null
  }

  // テスト用ユーザーIDを取得（現在のユーザー一覧から最初の管理者を使用）
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_deleted', false)
    .limit(1)

  if (!profiles || profiles.length === 0) {
    console.warn('No active user found')
    return null
  }

  const userId = profiles[0].id

  // 成功処理データを作成
  const { data, error } = await supabase
    .from('processed_files')
    .insert({
      user_id: userId,
      company_id: companyId,
      process_date: new Date().toISOString().split('T')[0],
      excel_file: Buffer.from('test excel content').toString('base64'),
      excel_filename: 'E2E_テスト_ネクストビッツ_2025-12.xlsx',
      order_pdf: Buffer.from('test order pdf').toString('base64'),
      order_pdf_filename: '注文書_E2Eテスト.pdf',
      inspection_pdf: Buffer.from('test inspection pdf').toString('base64'),
      inspection_pdf_filename: '検収書_E2Eテスト.pdf',
      processing_time: 5000,
      status: 'success',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create success test data:', error.message)
    return null
  }

  return data?.id || null
}

/**
 * P-003テスト用のエラー処理データを作成
 */
export async function createP003ErrorTestData(): Promise<string | null> {
  // 取引先IDを取得
  const companyId = await getCompanyId('ネクストビッツ')
  if (!companyId) {
    console.warn('Company not found: ネクストビッツ')
    return null
  }

  // テスト用ユーザーIDを取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_deleted', false)
    .limit(1)

  if (!profiles || profiles.length === 0) {
    console.warn('No active user found')
    return null
  }

  const userId = profiles[0].id

  // エラー処理データをprocessed_filesテーブルに作成
  // 必須カラム（excel_file, order_pdf, inspection_pdf）にはダミーデータを設定
  const { data, error } = await supabase
    .from('processed_files')
    .insert({
      user_id: userId,
      company_id: companyId,
      process_date: new Date().toISOString().split('T')[0],
      excel_file: Buffer.from('dummy excel for error').toString('base64'),
      excel_filename: 'E2E_テスト_エラー_ネクストビッツ.xlsx',
      order_pdf: Buffer.from('dummy order pdf').toString('base64'),
      order_pdf_filename: '注文書_E2Eテストエラー.pdf',
      inspection_pdf: Buffer.from('dummy inspection pdf').toString('base64'),
      inspection_pdf_filename: '検収書_E2Eテストエラー.pdf',
      processing_time: 0,
      status: 'error',
      error_message: 'E2Eテスト用エラーメッセージ',
      error_code: 'E2E_TEST_ERROR',
      error_detail: 'これはE2Eテスト用のエラーデータです',
      error_stacktrace: 'Error: E2E Test Error\n    at test.spec.ts:1:1',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create error test data:', error.message)
    return null
  }

  return data?.id || null
}

/**
 * P-003テスト用データのクリーンアップ
 */
export async function cleanupP003TestData(): Promise<void> {
  // E2Eテスト用のprocessed_filesを削除（ファイル名でフィルタ）
  await supabase
    .from('processed_files')
    .delete()
    .like('excel_filename', '%E2E%テスト%')

  // E2Eテスト用のprocessed_filesを削除（エラーメッセージでフィルタ）
  await supabase
    .from('processed_files')
    .delete()
    .like('error_message', '%E2Eテスト%')

  console.log('P-003 test data cleanup completed')
}

// ============================================
// P-003 追加テスト用ヘルパー（E2E-HIST-005, 013, 014）
// ============================================

/**
 * E2E-HIST-005用: 2人目の処理者による処理データを作成
 */
export async function createP003TestDataWithSecondUser(): Promise<{
  userId: string
  processedFileId: string
} | null> {
  const testEmail = 'e2e-hist005-seconduser@example.com'
  const testPassword = 'TestPassword123'

  // 既存のテストユーザーを削除
  await deleteTestUserByEmail(testEmail)

  // テストユーザーを作成
  const userId = await createTestUser(testEmail, testPassword, 'user')

  // 取引先IDを取得
  const companyId = await getCompanyId('ネクストビッツ')
  if (!companyId) {
    console.warn('Company not found: ネクストビッツ')
    return null
  }

  // 処理データを作成
  const { data, error } = await supabase
    .from('processed_files')
    .insert({
      user_id: userId,
      company_id: companyId,
      process_date: new Date().toISOString().split('T')[0],
      excel_file: Buffer.from('test excel for second user').toString('base64'),
      excel_filename: 'E2E_テスト_HIST005_2人目処理者.xlsx',
      order_pdf: Buffer.from('test order pdf').toString('base64'),
      order_pdf_filename: '注文書_E2Eテスト_HIST005.pdf',
      inspection_pdf: Buffer.from('test inspection pdf').toString('base64'),
      inspection_pdf_filename: '検収書_E2Eテスト_HIST005.pdf',
      processing_time: 3000,
      status: 'success',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create test data with second user:', error.message)
    return null
  }

  return { userId, processedFileId: data?.id || '' }
}

/**
 * E2E-HIST-005用: クリーンアップ
 */
export async function cleanupP003SecondUserTestData(): Promise<void> {
  const testEmail = 'e2e-hist005-seconduser@example.com'

  // processed_filesを削除
  await supabase
    .from('processed_files')
    .delete()
    .like('excel_filename', '%HIST005%')

  // テストユーザーを削除
  await deleteTestUserByEmail(testEmail)

  console.log('P-003 HIST-005 test data cleanup completed')
}

/**
 * E2E-HIST-013用: 削除済みユーザーの処理データを作成
 */
export async function createP003TestDataWithDeletedUser(): Promise<{
  userId: string
  processedFileId: string
} | null> {
  const testEmail = 'e2e-hist013-deleteduser@example.com'
  const testPassword = 'TestPassword123'

  // 既存データをクリーンアップ（FK制約を考慮した順序）
  // 1. processed_filesを先に削除
  await supabase.from('processed_files').delete().like('excel_filename', '%HIST013%')

  // 2. auth.usersとprofilesを削除
  await deleteTestUserByEmail(testEmail)

  // テストユーザーを作成
  const userId = await createTestUser(testEmail, testPassword, 'user')

  // 取引先IDを取得
  const companyId = await getCompanyId('ネクストビッツ')
  if (!companyId) {
    console.warn('Company not found: ネクストビッツ')
    return null
  }

  // 処理データを作成
  const { data, error } = await supabase
    .from('processed_files')
    .insert({
      user_id: userId,
      company_id: companyId,
      process_date: new Date().toISOString().split('T')[0],
      excel_file: Buffer.from('test excel for deleted user').toString('base64'),
      excel_filename: 'E2E_テスト_HIST013_削除済み処理者.xlsx',
      order_pdf: Buffer.from('test order pdf').toString('base64'),
      order_pdf_filename: '注文書_E2Eテスト_HIST013.pdf',
      inspection_pdf: Buffer.from('test inspection pdf').toString('base64'),
      inspection_pdf_filename: '検収書_E2Eテスト_HIST013.pdf',
      processing_time: 3000,
      status: 'success',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create test data with deleted user:', error.message)
    return null
  }

  // ユーザーを論理削除（auth.usersは削除しない - FK制約があるため）
  await supabase
    .from('profiles')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return { userId, processedFileId: data?.id || '' }
}

/**
 * E2E-HIST-013用: クリーンアップ
 * 削除順序: processed_files → profiles → auth.users（FK制約を考慮）
 */
export async function cleanupP003DeletedUserTestData(): Promise<void> {
  const testEmail = 'e2e-hist013-deleteduser@example.com'

  // 1. processed_filesを削除（FK制約があるため最初に削除）
  await supabase
    .from('processed_files')
    .delete()
    .like('excel_filename', '%HIST013%')

  // 2. auth.usersからユーザーを検索
  const { data: users } = await supabase.auth.admin.listUsers()
  const testUser = users?.users?.find((u) => u.email === testEmail)

  // 3. profilesから削除
  await supabase.from('profiles').delete().eq('email', testEmail)

  // 4. auth.usersから削除
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id)
  }

  console.log('P-003 HIST-013 test data cleanup completed')
}

/**
 * E2E-HIST-014用: 無効な取引先の処理データを作成
 */
export async function createP003TestDataWithInactiveCompany(): Promise<{
  companyId: string
  processedFileId: string
  originalIsActive: boolean
} | null> {
  // オフ・ビート・ワークスを使用（テスト用に一時的に無効化）
  const companyName = 'オフ・ビート・ワークス'
  const { data: company } = await supabase
    .from('companies')
    .select('id, is_active')
    .ilike('name', `%${companyName}%`)
    .single()

  if (!company) {
    console.warn(`Company not found: ${companyName}`)
    return null
  }

  const originalIsActive = company.is_active

  // 取引先を無効化
  await supabase
    .from('companies')
    .update({ is_active: false })
    .eq('id', company.id)

  // ユーザーIDを取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_deleted', false)
    .limit(1)

  if (!profiles || profiles.length === 0) {
    console.warn('No active user found')
    return null
  }

  const userId = profiles[0].id

  // 処理データを作成
  const { data, error } = await supabase
    .from('processed_files')
    .insert({
      user_id: userId,
      company_id: company.id,
      process_date: new Date().toISOString().split('T')[0],
      excel_file: Buffer.from('test excel for inactive company').toString('base64'),
      excel_filename: 'E2E_テスト_HIST014_無効取引先.xlsx',
      order_pdf: Buffer.from('test order pdf').toString('base64'),
      order_pdf_filename: '注文書_E2Eテスト_HIST014.pdf',
      inspection_pdf: Buffer.from('test inspection pdf').toString('base64'),
      inspection_pdf_filename: '検収書_E2Eテスト_HIST014.pdf',
      processing_time: 3000,
      status: 'success',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create test data with inactive company:', error.message)
    return null
  }

  return {
    companyId: company.id,
    processedFileId: data?.id || '',
    originalIsActive,
  }
}

/**
 * E2E-HIST-014用: クリーンアップ（取引先を有効に戻す）
 */
export async function cleanupP003InactiveCompanyTestData(
  companyId: string,
  originalIsActive: boolean
): Promise<void> {
  // processed_filesを削除
  await supabase
    .from('processed_files')
    .delete()
    .like('excel_filename', '%HIST014%')

  // 取引先の状態を元に戻す
  await supabase
    .from('companies')
    .update({ is_active: originalIsActive })
    .eq('id', companyId)

  console.log('P-003 HIST-014 test data cleanup completed')
}

// ============================================
// 孤立ユーザー・テストユーザー クリーンアップ
// ============================================

/**
 * E2Eテストパターンにマッチするメールアドレスかどうか判定
 */
function isTestEmail(email: string): boolean {
  const testPatterns = [
    /^e2e-/i,                      // e2e-で始まる
    /^test[-_]/i,                  // test-またはtest_で始まる
    /@example\.com$/i,             // @example.comで終わる
    /^newadmin_test_/i,            // newadmin_test_で始まる
    /^newuser_test_/i,             // newuser_test_で始まる
    /^deleted@/i,                  // deleted@で始まる
    /test.*@.*\.co\.jp$/i,         // test含む@*.co.jp
  ]

  return testPatterns.some((pattern) => pattern.test(email))
}

/**
 * 孤立ユーザー（auth.usersにいるがprofilesにいない）を検出
 */
export async function findOrphanedAuthUsers(): Promise<
  Array<{ id: string; email: string }>
> {
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  if (!authUsers?.users) {
    return []
  }

  const { data: profiles } = await supabase.from('profiles').select('id, email')
  const profileEmails = new Set(profiles?.map((p) => p.email) || [])

  const orphaned = authUsers.users
    .filter((u) => u.email && !profileEmails.has(u.email))
    .map((u) => ({ id: u.id, email: u.email || '' }))

  return orphaned
}

/**
 * テストユーザー（パターンにマッチするメール）を検出
 */
export async function findTestUsers(): Promise<
  Array<{ id: string; email: string; inProfiles: boolean }>
> {
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  if (!authUsers?.users) {
    return []
  }

  const { data: profiles } = await supabase.from('profiles').select('id, email')
  const profileEmails = new Set(profiles?.map((p) => p.email) || [])

  const testUsers = authUsers.users
    .filter((u) => u.email && isTestEmail(u.email))
    .map((u) => ({
      id: u.id,
      email: u.email || '',
      inProfiles: profileEmails.has(u.email || ''),
    }))

  return testUsers
}

/**
 * 包括的なE2Eテストクリーンアップ
 *
 * 以下を順番に実行:
 * 1. 孤立ユーザーを検出
 * 2. テストユーザーを検出
 * 3. 関連するprocessed_filesを削除（FK制約対策）
 * 4. profilesから削除
 * 5. auth.usersから削除
 */
export async function comprehensiveE2ECleanup(): Promise<{
  orphanedUsers: string[]
  testUsers: string[]
  deletedProcessedFiles: number
  errors: string[]
}> {
  const result = {
    orphanedUsers: [] as string[],
    testUsers: [] as string[],
    deletedProcessedFiles: 0,
    errors: [] as string[],
  }

  try {
    // 1. 孤立ユーザーを検出
    const orphaned = await findOrphanedAuthUsers()
    result.orphanedUsers = orphaned.map((u) => u.email)

    // 2. テストユーザーを検出
    const testUsers = await findTestUsers()
    result.testUsers = testUsers.map((u) => u.email)

    // 削除対象のユーザーIDを収集
    const userIdsToDelete = [
      ...orphaned.map((u) => u.id),
      ...testUsers.map((u) => u.id),
    ]
    const emailsToDelete = [
      ...orphaned.map((u) => u.email),
      ...testUsers.map((u) => u.email),
    ]

    if (userIdsToDelete.length === 0) {
      console.log('クリーンアップ対象のユーザーはいません')
      return result
    }

    // 3. 関連するprocessed_filesを削除（FK制約対策）
    for (const userId of userIdsToDelete) {
      const { data: deletedFiles } = await supabase
        .from('processed_files')
        .delete()
        .eq('user_id', userId)
        .select('id')

      if (deletedFiles) {
        result.deletedProcessedFiles += deletedFiles.length
      }
    }

    // 4. profilesから削除
    for (const email of emailsToDelete) {
      await supabase.from('profiles').delete().eq('email', email)
    }

    // 5. auth.usersから削除
    for (const user of [...orphaned, ...testUsers]) {
      try {
        await supabase.auth.admin.deleteUser(user.id)
      } catch (err) {
        result.errors.push(`${user.email}: ${err}`)
      }
    }

    console.log('=== E2Eクリーンアップ完了 ===')
    console.log(`孤立ユーザー削除: ${result.orphanedUsers.length}件`)
    console.log(`テストユーザー削除: ${result.testUsers.length}件`)
    console.log(`処理ファイル削除: ${result.deletedProcessedFiles}件`)

    return result
  } catch (err) {
    result.errors.push(`Unexpected error: ${err}`)
    return result
  }
}

/**
 * クリーンアップの実行確認（ドライラン）
 * 実際には削除せず、対象を表示するのみ
 */
export async function dryRunE2ECleanup(): Promise<void> {
  console.log('=== E2Eクリーンアップ ドライラン ===')

  const orphaned = await findOrphanedAuthUsers()
  console.log(`\n孤立ユーザー (${orphaned.length}件):`)
  orphaned.forEach((u) => console.log(`  - ${u.email}`))

  const testUsers = await findTestUsers()
  console.log(`\nテストユーザー (${testUsers.length}件):`)
  testUsers.forEach((u) =>
    console.log(`  - ${u.email} (profiles: ${u.inProfiles ? 'あり' : 'なし'})`)
  )

  console.log('\n※ 実際に削除するには comprehensiveE2ECleanup() を使用')
}

/**
 * Supabaseクライアントをエクスポート（直接クエリ用）
 */
export { supabase }
