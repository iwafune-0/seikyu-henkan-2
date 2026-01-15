import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import {
  getUsersController,
  inviteUserController,
  updateUserRoleController,
  deleteUserController,
  getAppModeController,
  createUserDirectController,
  resetPasswordDirectController,
} from '../controllers/usersController'

/**
 * ユーザー管理ルート（管理者専用）
 *
 * 全エンドポイントは以下のミドルウェアを通過する:
 * 1. authenticateToken - JWT認証
 * 2. requireAdmin - 管理者権限チェック
 */

const router = Router()

/**
 * GET /api/users
 * アクティブなユーザー一覧を取得
 *
 * ミドルウェア: 認証 + 管理者権限
 * レスポンス: { users: User[], total: number }
 */
router.get('/', authenticateToken, requireAdmin, getUsersController)

/**
 * GET /api/users/app-mode
 * アプリケーションモードを取得
 *
 * ミドルウェア: 認証 + 管理者権限
 * レスポンス: { mode: 'web' | 'electron' }
 */
router.get('/app-mode', authenticateToken, requireAdmin, getAppModeController)

/**
 * POST /api/users/invite
 * 新しいユーザーを招待（Webモード用）
 *
 * ミドルウェア: 認証 + 管理者権限
 * リクエストボディ: { email: string, role: 'admin' | 'user' }
 * レスポンス: { success: boolean, message: string }
 */
router.post('/invite', authenticateToken, requireAdmin, inviteUserController)

/**
 * POST /api/users/create-direct
 * ユーザーを直接作成（Electronモード用）
 *
 * ミドルウェア: 認証 + 管理者権限
 * リクエストボディ: { email: string, password: string, role: 'admin' | 'user' }
 * レスポンス: { success: boolean, message: string, user?: User }
 */
router.post('/create-direct', authenticateToken, requireAdmin, createUserDirectController)

/**
 * PATCH /api/users/:id/role
 * ユーザーのロールを変更
 *
 * ミドルウェア: 認証 + 管理者権限
 * パラメータ: id - ユーザーID
 * リクエストボディ: { role: 'admin' | 'user' }
 * レスポンス: { success: boolean, user: User }
 */
router.patch('/:id/role', authenticateToken, requireAdmin, updateUserRoleController)

/**
 * POST /api/users/:id/reset-password-direct
 * パスワードを直接リセット（Electronモード用）
 *
 * ミドルウェア: 認証 + 管理者権限
 * パラメータ: id - ユーザーID
 * リクエストボディ: { new_password: string }
 * レスポンス: { success: boolean, message: string }
 */
router.post('/:id/reset-password-direct', authenticateToken, requireAdmin, resetPasswordDirectController)

/**
 * DELETE /api/users/:id
 * ユーザーを論理削除
 *
 * ミドルウェア: 認証 + 管理者権限
 * パラメータ: id - ユーザーID
 * レスポンス: { success: boolean, message: string }
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUserController)

export default router
