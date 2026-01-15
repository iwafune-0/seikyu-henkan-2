/**
 * P-004: ユーザー管理サービス
 *
 * バックエンドAPI (/api/users) と通信
 * Phase 8でモックから実APIに切り替え
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import {
  API_PATHS,
  type UserListResponse,
  type InviteUserRequest,
  type InviteUserResponse,
  type UpdateUserRoleRequest,
  type UpdateUserRoleResponse,
  type DeleteUserResponse,
  type AppModeResponse,
  type CreateUserDirectRequest,
  type CreateUserDirectResponse,
  type ResetPasswordDirectRequest,
  type ResetPasswordDirectResponse,
} from '@/types'

export const UsersService = {
  /**
   * ユーザー一覧取得
   * GET /api/users
   *
   * @param includeDeleted 削除済みユーザーを含めるか（デフォルト: false）
   */
  async getUsers(includeDeleted: boolean = false): Promise<UserListResponse> {
    const url = includeDeleted
      ? `${API_PATHS.USERS.LIST}?includeDeleted=true`
      : API_PATHS.USERS.LIST
    return apiGet<UserListResponse>(url)
  },

  /**
   * ユーザー招待
   * POST /api/users/invite
   */
  async inviteUser(request: InviteUserRequest): Promise<InviteUserResponse> {
    return apiPost<InviteUserResponse>(API_PATHS.USERS.INVITE, request)
  },

  /**
   * ロール変更
   * PATCH /api/users/:id/role
   */
  async updateUserRole(
    userId: string,
    request: UpdateUserRoleRequest
  ): Promise<UpdateUserRoleResponse> {
    return apiPatch<UpdateUserRoleResponse>(API_PATHS.USERS.UPDATE_ROLE(userId), request)
  },

  /**
   * ユーザー削除（論理削除）
   * DELETE /api/users/:id
   */
  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    return apiDelete<DeleteUserResponse>(API_PATHS.USERS.DELETE(userId))
  },

  /**
   * アプリモード取得
   * GET /api/users/app-mode
   *
   * @returns アプリモード（web | electron）
   */
  async getAppMode(): Promise<AppModeResponse> {
    return apiGet<AppModeResponse>(API_PATHS.USERS.APP_MODE)
  },

  /**
   * ユーザー直接作成（Electron用）
   * POST /api/users/create-direct
   */
  async createUserDirect(request: CreateUserDirectRequest): Promise<CreateUserDirectResponse> {
    return apiPost<CreateUserDirectResponse>(API_PATHS.USERS.CREATE_DIRECT, request)
  },

  /**
   * パスワード直接リセット（Electron用）
   * POST /api/users/:id/reset-password-direct
   */
  async resetPasswordDirect(
    userId: string,
    request: ResetPasswordDirectRequest
  ): Promise<ResetPasswordDirectResponse> {
    return apiPost<ResetPasswordDirectResponse>(
      API_PATHS.USERS.RESET_PASSWORD_DIRECT(userId),
      request
    )
  },
}
