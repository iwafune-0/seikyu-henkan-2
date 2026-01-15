import { Request, Response } from 'express'
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendInternalError,
} from '../utils/response'
import {
  getAllUsers,
  inviteUser,
  updateUserRole,
  deleteUser,
  getAppMode,
  createUserDirect,
  resetPasswordDirect,
} from '../services/usersService'
import {
  InviteUserRequest,
  UpdateUserRoleRequest,
  CreateUserDirectRequest,
  ResetPasswordDirectRequest,
} from '../types/index'

/**
 * ユーザー管理コントローラー
 *
 * P-004 ユーザー管理ページで使用されるAPIエンドポイントのコントローラー
 * 全エンドポイントは管理者専用（requireAdminミドルウェア使用）
 */

/**
 * GET /api/users
 * ユーザー一覧を取得
 *
 * クエリパラメータ:
 * - includeDeleted: 'true' で削除済みユーザーを含める（デフォルト: false）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function getUsersController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const includeDeleted = req.query.includeDeleted === 'true'
    const result = await getAllUsers(includeDeleted)
    sendSuccess(res, result, 'ユーザー一覧を取得しました')
  } catch (error) {
    sendInternalError(res, error)
  }
}

/**
 * POST /api/users/invite
 * 新しいユーザーを招待
 *
 * リクエストボディ:
 * - email: string（必須）
 * - role: 'admin' | 'user'（必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function inviteUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // リクエストボディのバリデーション
    const { email, role } = req.body as InviteUserRequest

    if (!email || typeof email !== 'string') {
      sendBadRequest(res, 'メールアドレスは必須です')
      return
    }

    if (!role || (role !== 'admin' && role !== 'user')) {
      sendBadRequest(res, 'ロールは "admin" または "user" である必要があります')
      return
    }

    // メールアドレスの形式チェック（簡易的な正規表現）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      sendBadRequest(res, 'メールアドレスの形式が不正です')
      return
    }

    const result = await inviteUser({ email, role })
    sendSuccess(res, result, result.message, 201)
  } catch (error) {
    // ビジネスロジックエラー（重複メール等）は400エラー
    if (error instanceof Error) {
      if (
        error.message.includes('既に登録されています') ||
        error.message.includes('形式が不正です')
      ) {
        sendBadRequest(res, error.message)
        return
      }
    }
    sendInternalError(res, error)
  }
}

/**
 * PATCH /api/users/:id/role
 * ユーザーのロールを変更
 *
 * パラメータ:
 * - id: string（ユーザーID）
 *
 * リクエストボディ:
 * - role: 'admin' | 'user'（必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function updateUserRoleController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id: userId } = req.params
    const { role } = req.body as UpdateUserRoleRequest

    // パラメータのバリデーション
    if (!userId) {
      sendBadRequest(res, 'ユーザーIDは必須です')
      return
    }

    if (!role || (role !== 'admin' && role !== 'user')) {
      sendBadRequest(res, 'ロールは "admin" または "user" である必要があります')
      return
    }

    const result = await updateUserRole(userId, { role })
    sendSuccess(res, result, 'ロールを変更しました')
  } catch (error) {
    // ビジネスロジックエラー（最終管理者保護等）
    if (error instanceof Error) {
      if (error.message.includes('ユーザーが見つかりません')) {
        sendNotFound(res, error.message)
        return
      }
      if (
        error.message.includes('最終管理者') ||
        error.message.includes('変更できません')
      ) {
        sendBadRequest(res, error.message)
        return
      }
    }
    sendInternalError(res, error)
  }
}

/**
 * DELETE /api/users/:id
 * ユーザーを論理削除
 *
 * パラメータ:
 * - id: string（ユーザーID）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function deleteUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id: userId } = req.params

    // パラメータのバリデーション
    if (!userId) {
      sendBadRequest(res, 'ユーザーIDは必須です')
      return
    }

    const result = await deleteUser(userId)
    sendSuccess(res, result, result.message)
  } catch (error) {
    // ビジネスロジックエラー（最終管理者保護等）
    if (error instanceof Error) {
      if (error.message.includes('ユーザーが見つかりません')) {
        sendNotFound(res, error.message)
        return
      }
      if (
        error.message.includes('最終管理者') ||
        error.message.includes('削除できません')
      ) {
        sendBadRequest(res, error.message)
        return
      }
    }
    sendInternalError(res, error)
  }
}

/**
 * GET /api/users/app-mode
 * アプリケーションモードを取得
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function getAppModeController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const mode = getAppMode()
    sendSuccess(res, { mode }, 'アプリケーションモードを取得しました')
  } catch (error) {
    sendInternalError(res, error)
  }
}

/**
 * POST /api/users/create-direct
 * ユーザーを直接作成（Electron用）
 *
 * リクエストボディ:
 * - email: string（必須）
 * - password: string（必須）
 * - role: 'admin' | 'user'（必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function createUserDirectController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password, role } = req.body as CreateUserDirectRequest

    // リクエストボディのバリデーション
    if (!email || typeof email !== 'string') {
      sendBadRequest(res, 'メールアドレスは必須です')
      return
    }

    if (!password || typeof password !== 'string') {
      sendBadRequest(res, 'パスワードは必須です')
      return
    }

    if (password.length < 6) {
      sendBadRequest(res, 'パスワードは6文字以上で入力してください')
      return
    }

    if (!role || (role !== 'admin' && role !== 'user')) {
      sendBadRequest(res, 'ロールは "admin" または "user" である必要があります')
      return
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      sendBadRequest(res, 'メールアドレスの形式が不正です')
      return
    }

    const result = await createUserDirect({ email, password, role })
    sendSuccess(res, result, result.message, 201)
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('既に登録されています') ||
        error.message.includes('形式が不正') ||
        error.message.includes('Electronモード')
      ) {
        sendBadRequest(res, error.message)
        return
      }
    }
    sendInternalError(res, error)
  }
}

/**
 * POST /api/users/:id/reset-password-direct
 * パスワードを直接リセット（Electron用）
 *
 * パラメータ:
 * - id: string（ユーザーID）
 *
 * リクエストボディ:
 * - new_password: string（必須）
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function resetPasswordDirectController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id: userId } = req.params
    const { new_password } = req.body as ResetPasswordDirectRequest

    // パラメータのバリデーション
    if (!userId) {
      sendBadRequest(res, 'ユーザーIDは必須です')
      return
    }

    if (!new_password || typeof new_password !== 'string') {
      sendBadRequest(res, '新しいパスワードは必須です')
      return
    }

    if (new_password.length < 6) {
      sendBadRequest(res, 'パスワードは6文字以上で入力してください')
      return
    }

    const result = await resetPasswordDirect(userId, { new_password })
    sendSuccess(res, result, result.message)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ユーザーが見つかりません')) {
        sendNotFound(res, error.message)
        return
      }
      if (error.message.includes('Electronモード')) {
        sendBadRequest(res, error.message)
        return
      }
    }
    sendInternalError(res, error)
  }
}
