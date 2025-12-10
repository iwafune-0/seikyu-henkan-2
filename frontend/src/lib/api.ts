/**
 * APIクライアント基盤
 *
 * バックエンドAPIとの通信を担当するヘルパー関数群
 * 認証トークンの自動付与、エラーハンドリングを提供
 */

import { supabase } from './supabase'

// APIベースURL（開発環境）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * 認証トークンを取得
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * APIエラーレスポンスの型
 */
interface ApiErrorResponse {
  error: string
  message?: string
  details?: string
}

/**
 * APIエラーを処理して日本語メッセージを返す
 */
function handleApiError(status: number, data: ApiErrorResponse): string {
  // エラーメッセージの優先順位: message > error > details
  const message = data.message || data.error || data.details

  // ステータスコードに応じたデフォルトメッセージ
  const defaultMessages: Record<number, string> = {
    400: 'リクエストが不正です',
    401: '認証が必要です。再度ログインしてください',
    403: '権限がありません',
    404: 'リソースが見つかりません',
    409: 'リソースが競合しています',
    500: 'サーバーエラーが発生しました',
  }

  return message || defaultMessages[status] || 'エラーが発生しました'
}

/**
 * 汎用APIリクエスト関数
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()

  const headers: HeadersInit = {
    ...(options.headers || {}),
  }

  // FormDataでない場合はContent-Typeを設定
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }

  // 認証トークンがあれば付与
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // レスポンスがJSONでない場合（ファイルダウンロード等）
  const contentType = response.headers.get('content-type')
  if (contentType && !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response as unknown as T
  }

  const json = await response.json()

  if (!response.ok) {
    throw new Error(handleApiError(response.status, json))
  }

  // バックエンドは { success: true, data: {...} } 形式でレスポンスを返す
  // dataプロパティがあればその中身を返し、なければレスポンス全体を返す
  if (json.success && json.data !== undefined) {
    return json.data
  }

  return json
}

/**
 * GETリクエスト
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

/**
 * POSTリクエスト（JSON）
 */
export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * POSTリクエスト（FormData）
 */
export async function apiPostFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: formData,
  })
}

/**
 * PUTリクエスト
 */
export async function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PATCHリクエスト
 */
export async function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETEリクエスト
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

/**
 * ファイルダウンロード（Blobとして取得）
 */
export async function apiDownloadBlob(endpoint: string): Promise<{ blob: Blob; filename: string }> {
  const token = await getAuthToken()

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    // エラーレスポンスをJSONとして読み取る
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json()
      throw new Error(handleApiError(response.status, errorData))
    }
    throw new Error(`ダウンロードに失敗しました (${response.status})`)
  }

  const blob = await response.blob()

  // Content-Dispositionヘッダーからファイル名を取得
  const contentDisposition = response.headers.get('content-disposition')
  let filename = 'download'
  if (contentDisposition) {
    // filename*=UTF-8''... 形式（RFC 5987）
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1])
    } else {
      // filename="..." 形式
      const asciiMatch = contentDisposition.match(/filename="?([^";\n]+)"?/)
      if (asciiMatch) {
        filename = asciiMatch[1]
      }
    }
  }

  return { blob, filename }
}

/**
 * ブラウザでファイルをダウンロード
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
