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

// ============================================================
// APIパス定義（バックエンドと完全一致させる）
// ============================================================
export const API_PATHS = {
  // 認証関連
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  RESET_PASSWORD: '/api/auth/reset-password',

  // ユーザー関連
  GET_USERS: '/api/users',
  GET_USER: (id: string) => `/api/users/${id}`,
  INVITE_USER: '/api/users/invite',
  DELETE_USER: (id: string) => `/api/users/${id}`,
  UPDATE_USER_ROLE: (id: string) => `/api/users/${id}/role`,

  // 取引先関連
  GET_COMPANIES: '/api/companies',
  GET_COMPANY: (id: string) => `/api/companies/${id}`,
  UPDATE_COMPANY: (id: string) => `/api/companies/${id}`,
  UPLOAD_TEMPLATE: (id: string) => `/api/companies/${id}/template`,

  // PDF処理関連
  PROCESS_PDF: '/api/process/pdf',
  GET_HISTORY: '/api/process/history',
  DOWNLOAD_FILE: (id: string, type: 'excel' | 'order' | 'inspection') =>
    `/api/process/${id}/download/${type}`,
} as const;

// ============================================================
// ユーザー型定義
// ============================================================
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface InviteUserRequest {
  email: string;
  role: UserRole;
}

// ============================================================
// 取引先型定義
// ============================================================
export interface Company {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  last_processed_at?: string;
  template_filename?: string;
  template_updated_at?: string;
  template_updated_by?: string;
  created_at: string;
}

// ============================================================
// 処理履歴型定義
// ============================================================
export type ProcessStatus = 'success' | 'error';

export interface ProcessedFile {
  id: string;
  user_id: string;
  company_id: string;
  process_date: string;
  excel_filename: string;
  order_pdf_filename: string;
  inspection_pdf_filename: string;
  processing_time: number; // 秒
  status: ProcessStatus;
  error_message?: string;
  created_at: string;
  // リレーション
  user?: User;
  company?: Company;
}

export interface ProcessPDFRequest {
  estimate_pdf: File;
  invoice_pdf: File;
  order_pdf: File;
  delivery_pdf: File;
  template_excel?: File; // 初回のみ必須
}

export interface ProcessPDFResponse {
  id: string;
  company_id: string;
  company_name: string;
  excel_file: Blob;
  excel_filename: string;
  order_pdf: Blob;
  order_pdf_filename: string;
  inspection_pdf: Blob;
  inspection_pdf_filename: string;
  processing_time: number;
}

// ============================================================
// エラー型定義
// ============================================================
export interface APIError {
  error: string;
  message: string;
  details?: string;
}
