import { supabase } from '../lib/supabase'
import {
  User,
  UserListResponse,
  InviteUserRequest,
  InviteUserResponse,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
  DeleteUserResponse,
} from '../types/index'

/**
 * ユーザー管理サービス
 *
 * ユーザーの一覧取得、招待、ロール変更、論理削除を行う
 * Supabase Authとprofilesテーブルを操作
 */

/**
 * アクティブなユーザー一覧を取得
 *
 * @returns ユーザー一覧とカウント
 * @throws Error データベースエラー時
 */
export async function getAllUsers(): Promise<UserListResponse> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`ユーザー一覧の取得に失敗しました: ${error.message}`)
    }

    return {
      users: data as User[],
      total: data.length,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('ユーザー一覧の取得中に不明なエラーが発生しました')
  }
}

/**
 * ユーザーを招待
 *
 * Supabase Authの招待機能を使用してメールを送信
 * - 既存ユーザー（is_deleted=false）への招待はエラー
 * - 削除済みユーザー（is_deleted=true）への再招待は許可
 *
 * @param request 招待リクエスト（email, role）
 * @returns 招待成功レスポンス
 * @throws Error 招待失敗時（重複メール、送信エラー等）
 */
export async function inviteUser(
  request: InviteUserRequest
): Promise<InviteUserResponse> {
  const { email, role } = request

  try {
    // 1. 既存ユーザーのチェック（is_deleted=falseのみ）
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, is_deleted')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = データが見つからない（正常なケース）
      throw new Error(`ユーザー存在チェックに失敗しました: ${checkError.message}`)
    }

    // 既存ユーザー（削除されていない）への招待は拒否
    if (existingUser && !existingUser.is_deleted) {
      throw new Error('このメールアドレスは既に登録されています')
    }

    // 2. Supabase Authで招待メール送信
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174'
    const redirectUrl = `${frontendUrl}/accept-invitation`

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectUrl,
        data: { role },
      }
    )

    if (inviteError) {
      throw new Error(`招待メールの送信に失敗しました: ${inviteError.message}`)
    }

    // 削除済みユーザーへの再招待の場合、is_deletedをfalseに戻す
    if (existingUser && existingUser.is_deleted) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_deleted: false,
          deleted_at: null,
          role, // 新しいロールを設定
        })
        .eq('email', email)

      if (updateError) {
        console.warn('削除済みユーザーの復元に失敗しました:', updateError.message)
        // エラーでも招待メールは送信済みなので、警告のみ
      }
    }

    return {
      success: true,
      message: `招待メールを送信しました: ${email}`,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('ユーザー招待中に不明なエラーが発生しました')
  }
}

/**
 * ユーザーのロールを変更
 *
 * 最終管理者（管理者が1人のみ）の降格は拒否
 *
 * @param userId 対象ユーザーID
 * @param request ロール変更リクエスト
 * @returns 更新後のユーザー情報
 * @throws Error ユーザーが見つからない、最終管理者の降格、データベースエラー
 */
export async function updateUserRole(
  userId: string,
  request: UpdateUserRoleRequest
): Promise<UpdateUserRoleResponse> {
  const { role } = request

  try {
    // 1. 対象ユーザーの取得
    const { data: targetUser, error: getUserError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_deleted', false)
      .single()

    if (getUserError || !targetUser) {
      throw new Error('ユーザーが見つかりません')
    }

    // 2. 最終管理者保護チェック（管理者→一般ユーザーに降格する場合）
    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await countActiveAdmins()

      if (adminCount === 1) {
        throw new Error(
          '最終管理者のためロールを変更できません。他の管理者を追加してから再度お試しください。'
        )
      }
    }

    // 3. ロール更新
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`ロールの更新に失敗しました: ${updateError.message}`)
    }

    return {
      success: true,
      user: updatedUser as User,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('ロール変更中に不明なエラーが発生しました')
  }
}

/**
 * ユーザーを論理削除
 *
 * 物理削除ではなく、is_deleted=trueに設定
 * 最終管理者（管理者が1人のみ）の削除は拒否
 *
 * @param userId 対象ユーザーID
 * @returns 削除成功レスポンス
 * @throws Error ユーザーが見つからない、最終管理者の削除、データベースエラー
 */
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  try {
    // 1. 対象ユーザーの取得
    const { data: targetUser, error: getUserError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('is_deleted', false)
      .single()

    if (getUserError || !targetUser) {
      throw new Error('ユーザーが見つかりません')
    }

    // 2. 最終管理者保護チェック
    if (targetUser.role === 'admin') {
      const adminCount = await countActiveAdmins()

      if (adminCount === 1) {
        throw new Error(
          '最終管理者のため削除できません。他の管理者を追加してから再度お試しください。'
        )
      }
    }

    // 3. 論理削除（is_deleted=true、deleted_at=現在時刻）
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (deleteError) {
      throw new Error(`ユーザーの削除に失敗しました: ${deleteError.message}`)
    }

    return {
      success: true,
      message: 'ユーザーを削除しました',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('ユーザー削除中に不明なエラーが発生しました')
  }
}

/**
 * アクティブな管理者数をカウント
 *
 * is_deleted=false かつ role='admin' のユーザー数を取得
 *
 * @returns アクティブな管理者数
 * @private
 */
async function countActiveAdmins(): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_deleted', false)
    .eq('role', 'admin')

  if (error) {
    console.error('管理者数のカウントに失敗しました:', error.message)
    return 0
  }

  return data.length
}
