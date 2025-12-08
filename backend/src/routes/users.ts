import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { requireAdmin } from '../middleware/requireAdmin'
import {
  getUsersController,
  inviteUserController,
  updateUserRoleController,
  deleteUserController,
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
 * POST /api/users/invite
 * 新しいユーザーを招待
 *
 * ミドルウェア: 認証 + 管理者権限
 * リクエストボディ: { email: string, role: 'admin' | 'user' }
 * レスポンス: { success: boolean, message: string }
 */
router.post('/invite', authenticateToken, requireAdmin, inviteUserController)

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
 * DELETE /api/users/:id
 * ユーザーを論理削除
 *
 * ミドルウェア: 認証 + 管理者権限
 * パラメータ: id - ユーザーID
 * レスポンス: { success: boolean, message: string }
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUserController)

export default router
