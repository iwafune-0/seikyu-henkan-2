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
  // 公開API（認証不要）
  PUBLIC: {
    APP_MODE: '/api/public/app-mode',
  },

  // 認証関連
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  RESET_PASSWORD: '/api/auth/reset-password',
  ACCEPT_INVITATION: '/api/auth/accept-invitation',
  CHANGE_PASSWORD: '/api/auth/change-password',

  // ユーザー関連
  USERS: {
    LIST: '/api/users',
    INVITE: '/api/users/invite',
    CREATE_DIRECT: '/api/users/create-direct', // Electron用: 直接ユーザー作成
    RESET_PASSWORD_DIRECT: (id: string) => `/api/users/${id}/reset-password-direct`, // Electron用: 直接パスワードリセット
    APP_MODE: '/api/users/app-mode', // アプリモード取得
    UPDATE_ROLE: (id: string) => `/api/users/${id}/role`,
    DELETE: (id: string) => `/api/users/${id}`,
  },

  // 取引先関連
  COMPANIES: {
    LIST: '/api/companies',
    GET: (id: string) => `/api/companies/${id}`,
    UPDATE: (id: string) => `/api/companies/${id}`,
    UPLOAD_TEMPLATE: (id: string) => `/api/companies/${id}/template`,
    DOWNLOAD_TEMPLATE: (id: string) => `/api/companies/${id}/template`,
    PROCESSING_RULES: (id: string) => `/api/companies/${id}/rules`,
    PROCESS_HISTORY: (id: string) => `/api/companies/${id}/history`,
  },

  // PDF処理関連（スライス5: 検出、スライス6: 実行）
  PROCESS: {
    DETECT: '/api/process/detect',
    UPLOAD_SINGLE: '/api/process/upload-single',
    UPLOAD_EXCEL: '/api/process/upload-excel',
    EXECUTE: '/api/process/execute',
    DOWNLOAD: (processId: string, fileType: string) => `/api/process/download/${processId}/${fileType}`,
    DOWNLOAD_ZIP: (processId: string) => `/api/process/download-zip/${processId}`,
  },

  // 処理履歴関連（P-003）
  HISTORY: {
    LIST: '/api/history',
    DOWNLOAD_FILE: (historyId: string, fileType: string) => `/api/history/${historyId}/download/${fileType}`,
    DOWNLOAD_ZIP: (historyId: string) => `/api/history/${historyId}/download-zip`,
  },
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

// パスワード変更（ログイン中ユーザー用）
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
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

// Electron用: 直接ユーザー作成
export interface CreateUserDirectRequest {
  email: string
  password: string
  role: UserRole
}

export interface CreateUserDirectResponse {
  success: boolean
  message: string
  user?: User
}

// Electron用: 直接パスワードリセット
export interface ResetPasswordDirectRequest {
  new_password: string
}

export interface ResetPasswordDirectResponse {
  success: boolean
  message: string
}

// アプリモード取得レスポンス
export type AppMode = 'web' | 'electron'

export interface AppModeResponse {
  mode: AppMode
}

// ========================================
// 取引先関連型定義（P-005）
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

export interface CompanyListResponse {
  companies: Company[]
  total: number
}

export interface UpdateCompanyRequest {
  name?: string
  display_name?: string
  is_active?: boolean
}

export interface UpdateCompanyResponse {
  success: boolean
  company: Company
}

export interface UploadTemplateResponse {
  success: boolean
  filename: string
  updated_at: string
}

// ========================================
// PDF処理関連型定義
// ========================================
export type ProcessStatus = 'success' | 'error' | 'processing'

// PDF種別（4種類必須）
export type PdfType = 'estimate' | 'invoice' | 'order_confirmation' | 'delivery'

// PDF種別ごとのファイル状態
export interface PdfSlot {
  type: PdfType
  file: { filename: string; buffer: Buffer } | null
  status: 'empty' | 'uploaded' | 'error'
  errorMessage?: string
}

// 事前チェック結果
export interface PreCheckResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  missingTypes: PdfType[] // 不足しているPDF種別
}

// 取引先判別結果（スライス5）
export interface DetectionResult {
  company: Company | null
  pdfSlots: PdfSlot[]
  preCheck: PreCheckResult
  needsExcel: boolean // 初回の場合true
}

// 処理結果（スライス6）
export interface ProcessResult {
  excelFilename: string
  orderPdfFilename: string
  inspectionPdfFilename: string
  companyName: string // ZIP用
  yearMonth: string // ZIP用（YYMM形式）
  processId: string // 処理ID（DBレコードID）
}

export interface ProcessedFile {
  id: string
  user_id: string
  user_email?: string // 表示用（JOINで取得）
  company_id: string
  company_name?: string // 表示用（JOINで取得）
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
  error_code?: string // エラーコード（エラー発生時）
  error_detail?: string // エラー詳細（エラー発生時）
  error_stacktrace?: string // スタックトレース（エラー発生時）
  input_pdf_1?: string // 入力PDF1（BYTEA型、Base64エンコード）
  input_pdf_1_filename?: string
  input_pdf_2?: string // 入力PDF2
  input_pdf_2_filename?: string
  input_pdf_3?: string // 入力PDF3
  input_pdf_3_filename?: string
  input_pdf_4?: string // 入力PDF4
  input_pdf_4_filename?: string
  created_at: string
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

// ========================================
// 処理履歴関連型定義（P-003）
// ========================================
export interface HistoryFilters {
  company_id?: string
  user_id?: string
  status?: 'success' | 'error' | ''
  date_from?: string // YYYY-MM-DD
  date_to?: string // YYYY-MM-DD
  sort_order?: 'desc' | 'asc'
}

export interface HistoryListResponse {
  history: ProcessedFile[]
  total: number
}

export type DownloadFileType = 'excel' | 'order_pdf' | 'inspection_pdf' | 'input_pdf_1' | 'input_pdf_2' | 'input_pdf_3' | 'input_pdf_4'

export interface DownloadFileResponse {
  success: boolean
  filename: string
  data: Blob
}
