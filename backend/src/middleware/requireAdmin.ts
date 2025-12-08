import { Request, Response, NextFunction } from 'express'
import { sendForbidden } from '../utils/response'

/**
 * 管理者権限チェックミドルウェア
 *
 * req.user.roleが'admin'であることを確認する。
 * このミドルウェアは必ず authenticateToken ミドルウェアの後に実行すること。
 *
 * 使用例:
 * ```typescript
 * router.get('/api/users', authenticateToken, requireAdmin, getUsersController)
 * ```
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 * @param next - 次のミドルウェアへの制御移譲
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 認証ミドルウェアが実行されていない場合
  if (!req.user) {
    sendForbidden(res, '認証が必要です')
    return
  }

  // 管理者ロールでない場合
  if (req.user.role !== 'admin') {
    sendForbidden(res, 'この操作には管理者権限が必要です')
    return
  }

  // 管理者権限あり、次のミドルウェアへ
  next()
}
