import { Response } from 'express'

/**
 * 成功レスポンスの標準フォーマット
 */
interface SuccessResponse<T = unknown> {
  success: true
  message?: string
  data?: T
}

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
 * 成功レスポンス送信
 *
 * @param res - Expressレスポンスオブジェクト
 * @param data - レスポンスデータ（任意）
 * @param message - 成功メッセージ（任意）
 * @param statusCode - HTTPステータスコード（デフォルト: 200）
 */
export function sendSuccess<T = unknown>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): void {
  const response: SuccessResponse<T> = {
    success: true,
  }

  if (message) {
    response.message = message
  }

  if (data !== undefined) {
    response.data = data
  }

  res.status(statusCode).json(response)
}

/**
 * 400 Bad Request レスポンス送信
 *
 * @param res - Expressレスポンスオブジェクト
 * @param message - エラーメッセージ
 * @param details - エラー詳細（任意）
 */
export function sendBadRequest(
  res: Response,
  message: string,
  details?: unknown
): void {
  const response: ErrorResponse = {
    success: false,
    error: 'Bad Request',
    message,
  }

  if (details) {
    response.details = details
  }

  res.status(400).json(response)
}

/**
 * 401 Unauthorized レスポンス送信
 *
 * @param res - Expressレスポンスオブジェクト
 * @param message - エラーメッセージ
 */
export function sendUnauthorized(res: Response, message: string): void {
  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message,
  })
}

/**
 * 403 Forbidden レスポンス送信
 *
 * @param res - Expressレスポンスオブジェクト
 * @param message - エラーメッセージ
 */
export function sendForbidden(res: Response, message: string): void {
  res.status(403).json({
    success: false,
    error: 'Forbidden',
    message,
  })
}

/**
 * 404 Not Found レスポンス送信
 *
 * @param res - Expressレスポンスオブジェクト
 * @param message - エラーメッセージ
 */
export function sendNotFound(res: Response, message: string): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message,
  })
}

/**
 * 500 Internal Server Error レスポンス送信
 *
 * @param res - Expressレスポンスオブジェクト
 * @param error - エラーオブジェクト
 * @param customMessage - カスタムエラーメッセージ（任意）
 */
export function sendInternalError(
  res: Response,
  error: Error | unknown,
  customMessage?: string
): void {
  console.error('内部サーバーエラー:', error)

  const errorMessage =
    customMessage ||
    (error instanceof Error ? error.message : '内部サーバーエラーが発生しました')

  const response: ErrorResponse = {
    success: false,
    error: 'Internal Server Error',
    message: errorMessage,
  }

  // 開発環境のみスタックトレースを含める
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    response.stack = error.stack
  }

  res.status(500).json(response)
}
