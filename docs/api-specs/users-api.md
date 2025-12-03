# ユーザー管理API仕様書 (P-004)

**生成日**: 2025-12-03
**対象ページ**: P-004 (ユーザー管理ページ)
**モックサービス**: `frontend/src/services/mock/usersService.ts`

---

## 📋 概要

P-004 ユーザー管理ページで使用されるAPIの仕様を定義します。
Phase 7でバックエンドAPI実装時に、このモックサービスを実APIに置き換えます。

---

## 🔐 エンドポイント一覧

### 1. ユーザー一覧取得

#### エンドポイント
```
GET /api/users
```

#### APIパス定数
```typescript
API_PATHS.USERS.LIST
```

#### 機能
- アクティブなユーザー一覧を取得
- 削除済みユーザー（is_deleted = true）は除外

#### Request
なし

#### Response (成功)
```typescript
interface UserListResponse {
  users: User[];
  total: number;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
}
```

#### Response例
```json
{
  "users": [
    {
      "id": "uuid-1",
      "email": "admin@example.com",
      "role": "admin",
      "is_deleted": false,
      "created_at": "2025-10-01T00:00:00Z"
    },
    {
      "id": "uuid-2",
      "email": "user@example.com",
      "role": "user",
      "is_deleted": false,
      "created_at": "2025-10-10T00:00:00Z"
    }
  ],
  "total": 2
}
```

---

### 2. ユーザー招待

#### エンドポイント
```
POST /api/users/invite
```

#### APIパス定数
```typescript
API_PATHS.USERS.INVITE
```

#### 機能
- 新しいユーザーを招待
- 招待メールを送信（Supabase Auth使用）
- **注意**: Phase 4モックでは即座にユーザーが作成されるが、Phase 7では招待メール送信のみ

#### Request
```typescript
interface InviteUserRequest {
  email: string;          // メールアドレス
  role: 'admin' | 'user'; // 権限
}
```

#### Response (成功)
```typescript
interface InviteUserResponse {
  success: true;
  message: string;  // 例: "招待メールを送信しました: user@example.com"
}
```

#### Response (エラー)
```typescript
{
  success: false;
  error: string;
  code: 'DUPLICATE_EMAIL' | 'INVALID_EMAIL' | 'SEND_FAILED';
}
```

#### エラーケース
| コード | 説明 |
|--------|------|
| `DUPLICATE_EMAIL` | 既に登録されているメールアドレス |
| `INVALID_EMAIL` | メールアドレスの形式が不正 |
| `SEND_FAILED` | メール送信に失敗 |

#### Phase 7での正しいフロー
```
1. 「新規ユーザーを招待」→ 招待メール送信のみ（ユーザー未作成）
2. ユーザー一覧には表示されない
3. 招待メール内のリンククリック → P-001b（招待受諾ページ）
4. パスワード設定完了時 → 初めてユーザーが作成され、ユーザー一覧に表示
```

---

### 3. ロール変更

#### エンドポイント
```
PATCH /api/users/:userId/role
```

#### APIパス定数
```typescript
API_PATHS.USERS.UPDATE_ROLE(userId)
```

#### 機能
- ユーザーのロール（権限）を変更
- 最終管理者の降格は拒否

#### パラメータ
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| userId | string | ユーザーID |

#### Request
```typescript
interface UpdateUserRoleRequest {
  role: 'admin' | 'user';
}
```

#### Response (成功)
```typescript
interface UpdateUserRoleResponse {
  success: true;
  user: User;
}
```

#### Response (エラー)
```typescript
{
  success: false;
  error: string;
  code: 'NOT_FOUND' | 'LAST_ADMIN';
}
```

#### エラーケース
| コード | 説明 |
|--------|------|
| `NOT_FOUND` | ユーザーが見つからない |
| `LAST_ADMIN` | 最終管理者のため降格できない |

---

### 4. ユーザー削除（論理削除）

#### エンドポイント
```
DELETE /api/users/:userId
```

#### APIパス定数
```typescript
API_PATHS.USERS.DELETE(userId)
```

#### 機能
- ユーザーを論理削除（is_deleted = true）
- 物理削除ではなく、deleted_atタイムスタンプを記録
- 最終管理者の削除は拒否

#### パラメータ
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| userId | string | ユーザーID |

#### Response (成功)
```typescript
interface DeleteUserResponse {
  success: true;
  message: string;  // 例: "ユーザーを削除しました"
}
```

#### Response (エラー)
```typescript
{
  success: false;
  error: string;
  code: 'NOT_FOUND' | 'LAST_ADMIN';
}
```

#### エラーケース
| コード | 説明 |
|--------|------|
| `NOT_FOUND` | ユーザーが見つからない |
| `LAST_ADMIN` | 最終管理者のため削除できない |

#### 論理削除の影響
- 削除されたユーザーはログインできなくなる
- ユーザー一覧（P-004）には表示されない
- 過去の処理履歴（P-003）では「メールアドレス（削除済み）」と表示される
- 取引先テンプレート更新者（P-005）も保持される

---

## 📝 型定義

### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // メールアドレス
  role: 'admin' | 'user';        // 権限
  is_deleted: boolean;           // 論理削除フラグ
  deleted_at?: string;           // 削除日時（ISO 8601）
  created_at: string;            // 登録日時（ISO 8601）
}
```

### 権限
| ロール | 説明 |
|--------|------|
| `admin` | 管理者 - ユーザー管理 + 取引先設定管理 + 全機能 |
| `user` | 一般ユーザー - 処理実行 + 全データ閲覧・ダウンロード |

---

## 🛡️ 保護機能

### 最終管理者保護
- 管理者が1人のみの場合、その管理者は：
  - 削除できない
  - 一般ユーザーに降格できない
- フロントエンド・バックエンド両方でチェック

### チェックロジック
```typescript
const adminCount = users.filter(u => u.role === 'admin' && !u.is_deleted).length
if (adminCount === 1 && targetUser.role === 'admin') {
  throw new Error('最終管理者のため操作できません')
}
```

---

## 🔗 関連ファイル

| ファイル | 用途 |
|----------|------|
| `frontend/src/services/mock/usersService.ts` | モックサービス（Phase 7で置き換え） |
| `frontend/src/pages/users/UsersPage.tsx` | P-004ページコンポーネント |
| `backend/src/controllers/usersController.ts` | ユーザーコントローラー（Phase 7で作成） |
| `backend/src/routes/users.ts` | ユーザールート（Phase 7で作成） |

---

## 📊 データベーステーブル

### profiles（ユーザープロファイル）
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)
```sql
-- ログイン可能なユーザーは is_deleted = false のみ
CREATE POLICY "Users can only login if not deleted"
ON profiles
FOR SELECT
USING (is_deleted = false);

-- 管理者のみユーザー情報を更新可能
CREATE POLICY "Admins can update users"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_deleted = false
  )
);
```
