import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { sendUnauthorized } from '../utils/response'
import { getProfileByUserId, isUserDeleted } from '../services/profileService'
import { UserRole } from '../types/index'

/**
 * リクエストにユーザー情報を追加する型拡張
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
      }
    }
  }
}

/**
 * JWT認証ミドルウェア
 *
 * リクエストヘッダーからJWTトークンを取得し、Supabase Authで検証する。
 * 検証成功後、profilesテーブルからユーザー情報を取得し、req.userに設定する。
 *
 * 認証失敗のパターン:
 * - Authorizationヘッダーがない
 * - トークン形式が不正
 * - トークンが無効または期限切れ
 * - ユーザーが削除済み（is_deleted=true）
 * - profilesテーブルにユーザーが存在しない
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 * @param next - 次のミドルウェアへの制御移譲
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Authorizationヘッダーの取得
    const authHeader = req.headers.authorization

    if (!authHeader) {
      sendUnauthorized(res, '認証トークンが提供されていません')
      return
    }

    // 2. Bearer トークン形式のチェック
    const token = authHeader.replace('Bearer ', '')

    if (!token || token === authHeader) {
      sendUnauthorized(res, '認証トークンの形式が不正です')
      return
    }

    // 3. Supabase Authでトークン検証
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('JWT検証エラー:', authError?.message)
      sendUnauthorized(res, '認証トークンが無効です')
      return
    }

    // 4. ユーザーが削除済みかチェック
    const deleted = await isUserDeleted(user.id)

    if (deleted) {
      sendUnauthorized(res, 'このユーザーは削除されています')
      return
    }

    // 5. profilesテーブルからユーザー情報を取得
    const profile = await getProfileByUserId(user.id)

    if (!profile) {
      sendUnauthorized(res, 'ユーザー情報が見つかりません')
      return
    }

    // 6. req.userにユーザー情報を設定
    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    }

    // 7. 次のミドルウェアへ
    next()
  } catch (error) {
    console.error('認証処理中にエラーが発生しました:', error)
    sendUnauthorized(res, '認証に失敗しました')
  }
}
