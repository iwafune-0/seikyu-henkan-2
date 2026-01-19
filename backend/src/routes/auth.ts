import { Router, Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { supabase } from '../lib/supabase'
import {
  sendSuccess,
  sendBadRequest,
  sendUnauthorized,
  sendInternalError,
} from '../utils/response'

/**
 * 認証関連ルート
 *
 * パスワード変更など、ログイン済みユーザーが自分自身に対して行う操作
 */

const router = Router()

/**
 * POST /api/auth/change-password
 * ログイン中のユーザーがパスワードを変更
 *
 * ミドルウェア: 認証（管理者権限不要）
 * リクエストボディ: { current_password: string, new_password: string }
 * レスポンス: { success: boolean, message: string }
 */
router.post('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body
    const user = req.user

    // 1. バリデーション
    if (!current_password || typeof current_password !== 'string') {
      sendBadRequest(res, '現在のパスワードは必須です')
      return
    }

    if (!new_password || typeof new_password !== 'string') {
      sendBadRequest(res, '新しいパスワードは必須です')
      return
    }

    if (new_password.length < 8) {
      sendBadRequest(res, '新しいパスワードは8文字以上で入力してください')
      return
    }

    // 英数字のみ許可
    if (!/^[a-zA-Z0-9]+$/.test(new_password)) {
      sendBadRequest(res, '新しいパスワードは英数字のみ使用できます')
      return
    }

    // 英字と数字の両方を含むかチェック
    const hasLetter = /[a-zA-Z]/.test(new_password)
    const hasNumber = /[0-9]/.test(new_password)
    if (!hasLetter || !hasNumber) {
      sendBadRequest(res, '新しいパスワードは英字と数字の両方を含めてください')
      return
    }

    if (current_password === new_password) {
      sendBadRequest(res, '新しいパスワードは現在のパスワードと異なる必要があります')
      return
    }

    if (!user || !user.email) {
      sendUnauthorized(res, 'ユーザー情報が見つかりません')
      return
    }

    // 2. 現在のパスワードを検証（サインイン試行）
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    })

    if (signInError) {
      sendBadRequest(res, '現在のパスワードが正しくありません')
      return
    }

    // 3. 新しいパスワードに更新
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: new_password,
    })

    if (updateError) {
      throw new Error(`パスワードの更新に失敗しました: ${updateError.message}`)
    }

    sendSuccess(res, { success: true }, 'パスワードを変更しました')
  } catch (error) {
    console.error('パスワード変更エラー:', error)
    sendInternalError(res, error)
  }
})

export default router
