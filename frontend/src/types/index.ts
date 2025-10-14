/**
 * ===== 型定義同期ルール =====
 *
 * 【基本原則】一方の/types/index.tsを更新したら、もう一方の/types/index.tsも必ず同じ内容に更新する
 *
 * 【変更の責任】
 * - 型定義を変更した開発者は、両方のファイルを即座に同期させる
 * - 1つのtypes/index.tsの更新は禁止。必ず1つを更新したらもう一つも更新その場で行う。
 *
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. APIパスは必ずこのファイルで一元管理する
 * 5. コード内でAPIパスをハードコードしない
 * 6. 2つの同期されたtypes/index.tsを単一の真実源とする
 * 7. 大規模リファクタリングの時は型変更を最初に行い早期に問題検出
 */

// ========================================
// APIパス定義（フロントエンド・バックエンド共通）
// ========================================
export const API_PATHS = {
  // 認証関連
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  RESET_PASSWORD: '/api/auth/reset-password',
  ACCEPT_INVITATION: '/api/auth/accept-invitation',

  // ユーザー関連
  USERS: {
    LIST: '/api/users',
    INVITE: '/api/users/invite',
    UPDATE_ROLE: (id: string) => `/api/users/${id}/role`,
    DELETE: (id: string) => `/api/users/${id}`,
  },

  // 取引先関連
  COMPANIES: '/api/companies',
  COMPANY_BY_ID: (id: string) => `/api/companies/${id}`,

  // PDF処理関連
  PROCESS_PDF: '/api/process/pdf',
  PROCESS_HISTORY: '/api/process/history',
  DOWNLOAD_FILE: (fileId: string) => `/api/process/download/${fileId}`,
} as const

// ========================================
// ユーザー関連型定義
// ========================================
export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  role: UserRole
  is_deleted?: boolean
  deleted_at?: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  user: User
  session: {
    access_token: string
    refresh_token: string
  }
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
  confirm_password: string
}

export interface AcceptInvitationRequest {
  token: string
  password: string
  confirm_password: string
}

// ========================================
// ユーザー管理関連型定義（P-004）
// ========================================
export interface UserListResponse {
  users: User[]
  total: number
}

export interface InviteUserRequest {
  email: string
  role: UserRole
}

export interface InviteUserResponse {
  success: boolean
  message: string
}

export interface UpdateUserRoleRequest {
  role: UserRole
}

export interface UpdateUserRoleResponse {
  success: boolean
  user: User
}

export interface DeleteUserRequest {
  // 論理削除のため、リクエストボディは不要
  // DELETEメソッドでIDのみ使用
}

export interface DeleteUserResponse {
  success: boolean
  message: string
}

// ========================================
// 取引先関連型定義
// ========================================
export interface Company {
  id: string
  name: string
  display_name: string
  is_active: boolean
  last_processed_at?: string
  template_excel?: string
  template_filename?: string
  template_updated_at?: string
  template_updated_by?: string
  created_at: string
}

// ========================================
// PDF処理関連型定義
// ========================================
export type ProcessStatus = 'success' | 'error' | 'processing'

export interface ProcessedFile {
  id: string
  user_id: string
  company_id: string
  process_date: string
  excel_file?: string
  excel_filename?: string
  order_pdf?: string
  order_pdf_filename?: string
  inspection_pdf?: string
  inspection_pdf_filename?: string
  processing_time?: number
  status: ProcessStatus
  error_message?: string
  created_at: string
}

export interface ProcessPdfRequest {
  files: File[]
  company_id?: string
}

export interface ProcessPdfResponse {
  success: boolean
  file_id: string
  company_id: string
  order_pdf_url: string
  inspection_pdf_url: string
  excel_url: string
  processing_time: number
}

// ========================================
// ログ関連型定義
// ========================================
export interface ProcessLog {
  id: string
  user_id: string
  company_id?: string
  status: ProcessStatus
  error_message?: string
  error_detail?: string
  created_at: string
}
