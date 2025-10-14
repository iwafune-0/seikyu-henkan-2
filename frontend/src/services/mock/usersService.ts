/**
 * P-004: ユーザー管理ページ - モックサービス
 *
 * Phase 4（フロントエンド実装）で使用するモックデータとAPI呼び出し
 * Phase 8（API統合）で実際のバックエンドAPIに接続
 */

import type {
  User,
  UserListResponse,
  InviteUserRequest,
  InviteUserResponse,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
  DeleteUserResponse,
} from '@/types'

// モックユーザーデータ
const mockUsers: User[] = [
  {
    id: 'mock-admin-id',
    email: 'admin@example.com',
    role: 'admin',
    is_deleted: false,
    created_at: '2025-10-01T00:00:00Z',
  },
  {
    id: 'mock-admin2-id',
    email: 'admin2@example.com',
    role: 'admin',
    is_deleted: false,
    created_at: '2025-10-05T00:00:00Z',
  },
  {
    id: 'mock-user-id',
    email: 'user@example.com',
    role: 'user',
    is_deleted: false,
    created_at: '2025-10-10T00:00:00Z',
  },
]

// モックデータを操作するための内部状態
let users = [...mockUsers]

export const UsersService = {
  /**
   * ユーザー一覧取得
   * @MOCK_TO_API: GET {API_PATHS.USERS.LIST}
   */
  async getUsers(): Promise<UserListResponse> {
    // モック: 削除済みでないユーザーのみ返す
    const activeUsers = users.filter((u) => !u.is_deleted)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          users: activeUsers,
          total: activeUsers.length,
        })
      }, 300) // 300ms遅延でAPIっぽく
    })
  },

  /**
   * ユーザー招待
   * @MOCK_TO_API: POST {API_PATHS.USERS.INVITE}
   */
  async inviteUser(request: InviteUserRequest): Promise<InviteUserResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // モック: 新しいユーザーを追加
        const newUser: User = {
          id: `mock-${Date.now()}`,
          email: request.email,
          role: request.role,
          is_deleted: false,
          created_at: new Date().toISOString(),
        }
        users.push(newUser)

        resolve({
          success: true,
          message: `招待メールを送信しました: ${request.email}`,
        })
      }, 500)
    })
  },

  /**
   * ロール変更
   * @MOCK_TO_API: PATCH {API_PATHS.USERS.UPDATE_ROLE(userId)}
   */
  async updateUserRole(
    userId: string,
    request: UpdateUserRoleRequest
  ): Promise<UpdateUserRoleResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find((u) => u.id === userId)

        if (!user) {
          reject(new Error('ユーザーが見つかりません'))
          return
        }

        // 最終管理者チェック
        const adminCount = users.filter((u) => u.role === 'admin' && !u.is_deleted).length
        if (user.role === 'admin' && request.role === 'user' && adminCount === 1) {
          reject(new Error('最終管理者のため降格できません'))
          return
        }

        // ロール更新
        user.role = request.role

        resolve({
          success: true,
          user: { ...user },
        })
      }, 500)
    })
  },

  /**
   * ユーザー削除（論理削除）
   * @MOCK_TO_API: DELETE {API_PATHS.USERS.DELETE(userId)}
   */
  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find((u) => u.id === userId)

        if (!user) {
          reject(new Error('ユーザーが見つかりません'))
          return
        }

        // 最終管理者チェック
        const adminCount = users.filter((u) => u.role === 'admin' && !u.is_deleted).length
        if (user.role === 'admin' && adminCount === 1) {
          reject(new Error('最終管理者のため削除できません'))
          return
        }

        // 論理削除
        user.is_deleted = true
        user.deleted_at = new Date().toISOString()

        resolve({
          success: true,
          message: 'ユーザーを削除しました',
        })
      }, 500)
    })
  },

  /**
   * 管理者数をカウント（最終管理者チェック用）
   */
  countAdmins(): number {
    return users.filter((u) => u.role === 'admin' && !u.is_deleted).length
  },

  /**
   * モックデータリセット（開発用）
   */
  resetMockData(): void {
    users = [...mockUsers]
  },
}
