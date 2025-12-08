import { Request, Response, NextFunction } from 'express'

/**
 * エラーレスポンスの標準フォーマット
 */
interface ErrorResponse {
  success: false
  error: string
  message: string
  details?: unknown
  stack?: string
}

/**
 * グローバルエラーハンドラ
 *
 * Expressアプリケーション全体でキャッチされなかったエラーを処理し、
 * 統一されたJSONレスポンスを返す。
 *
 * 開発環境ではスタックトレースを含め、本番環境では除外する。
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // エラーログを出力
  console.error('エラーが発生しました:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  })

  // ステータスコードの決定（デフォルト: 500）
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500

  // エラーレスポンスの構築
  const errorResponse: ErrorResponse = {
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || '内部サーバーエラーが発生しました',
  }

  // 開発環境のみスタックトレースを含める
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
  }

  res.status(statusCode).json(errorResponse)
}

/**
 * 404エラーハンドラ
 *
 * 定義されていないルートにアクセスした場合に呼び出される。
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `ルート ${req.method} ${req.path} が見つかりません`,
  })
}
