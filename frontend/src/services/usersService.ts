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
}
