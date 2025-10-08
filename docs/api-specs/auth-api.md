# 認証API仕様書 (P-001)

**生成日**: 2025-10-08
**対象ページ**: P-001a (ログイン), P-001b (招待受諾), P-001c (パスワードリセット)
**認証方式**: Supabase Auth

---

## 📋 概要

P-001認証ページ群で使用されるSupabase Auth APIの仕様を定義します。

---

## 🔐 エンドポイント一覧

### 1. ログイン (P-001a)

#### エンドポイント
```
POST /auth/v1/token?grant_type=password
```

#### APIパス定数
```typescript
// Supabase Auth内部エンドポイント
supabase.auth.signInWithPassword({ email, password })
```

#### Request
```typescript
{
  email: string;        // メールアドレス
  password: string;     // パスワード (8文字以上、英字・数字含む)
}
```

#### Response (成功)
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata?: {
      role?: 'admin' | 'user';
    };
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: 'bearer';
  };
}
```

#### Response (エラー)
```typescript
{
  error: {
    message: string;
    status: 400 | 401 | 500;
  }
}
```

#### バリデーション
- メールアドレス: 必須、`@`を含む形式
- パスワード: 必須、8文字以上

#### エラーケース
- 401: メールアドレスまたはパスワードが間違っている
- 400: リクエストの形式が不正
- 500: サーバーエラー

---

### 2. ログアウト

#### エンドポイント
```
POST /auth/v1/logout
```

#### APIパス定数
```typescript
supabase.auth.signOut()
```

#### Request
```typescript
// JWTトークンをヘッダーに含める
```

#### Response
```typescript
{
  error: null
}
```

---

### 3. セッション確認

#### エンドポイント
```
GET /auth/v1/user
```

#### APIパス定数
```typescript
supabase.auth.getSession()
```

#### Request
```typescript
// JWTトークンをヘッダーに含める
```

#### Response (セッションあり)
```typescript
{
  data: {
    session: {
      user: {
        id: string;
        email: string;
        user_metadata?: {
          role?: 'admin' | 'user';
        };
        created_at: string;
      };
      access_token: string;
      refresh_token: string;
    }
  }
}
```

#### Response (セッションなし)
```typescript
{
  data: {
    session: null
  }
}
```

---

### 4. 招待受諾・パスワード設定 (P-001b)

#### エンドポイント
```
PUT /auth/v1/user
```

#### APIパス定数
```typescript
supabase.auth.updateUser({ password })
```

#### Request
```typescript
{
  password: string;  // 新しいパスワード (英字・数字を含む8文字以上)
}
```

#### Response (成功)
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata?: {
      role?: 'admin' | 'user';
    };
    created_at: string;
  }
}
```

#### Response (エラー)
```typescript
{
  error: {
    message: string;
    status: 400 | 422 | 500;
  }
}
```

#### バリデーション
- パスワード: 必須、8文字以上、英字を含む、数字を含む、半角英数字のみ
- パスワード確認: パスワードと一致

#### エラーケース
- 400: 無効なトークン
- 422: パスワード要件を満たしていない
- 500: サーバーエラー

---

### 5. パスワードリセット (P-001c)

#### 5-1. パスワードリセットメール送信

##### エンドポイント
```
POST /auth/v1/recover
```

##### APIパス定数
```typescript
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password?step=password`
})
```

##### Request
```typescript
{
  email: string;  // 登録済みメールアドレス
}
```

##### Response (成功)
```typescript
{
  error: null
}
```

##### Response (エラー)
```typescript
{
  error: {
    message: string;
    status: 400 | 422 | 500;
  }
}
```

##### バリデーション
- メールアドレス: 必須、`@`を含む形式

---

#### 5-2. パスワード更新

##### エンドポイント
```
PUT /auth/v1/user
```

##### APIパス定数
```typescript
supabase.auth.updateUser({ password })
```

##### Request
```typescript
{
  password: string;  // 新しいパスワード (英字・数字を含む8文字以上)
}
```

##### Response (成功)
```typescript
{
  user: {
    id: string;
    email: string;
    user_metadata?: {
      role?: 'admin' | 'user';
    };
    created_at: string;
  }
}
```

##### Response (エラー)
```typescript
{
  error: {
    message: string;
    status: 400 | 422 | 500;
  }
}
```

##### バリデーション
- パスワード: 必須、8文字以上、英字を含む、数字を含む、半角英数字のみ
- パスワード確認: パスワードと一致

##### エラーケース
- 400: 無効なトークン
- 422: パスワード要件を満たしていない
- 500: サーバーエラー

---

## 🔄 認証フロー

### 初回登録フロー
```
1. 管理者がユーザー招待 (P-004)
   ↓
2. ユーザーに招待メール送信
   ↓
3. ユーザーが招待リンクをクリック
   ↓
4. P-001b: パスワード設定
   - supabase.auth.updateUser({ password })
   ↓
5. ログインページへリダイレクト
   ↓
6. P-001a: ログイン
   - supabase.auth.signInWithPassword({ email, password })
```

### 通常ログインフロー
```
1. P-001a: メール + パスワード入力
   ↓
2. supabase.auth.signInWithPassword({ email, password })
   ↓
3. JWTトークン取得
   ↓
4. localStorageに保存（Zustand persist）
   ↓
5. /processへリダイレクト
```

### パスワードリセットフロー
```
1. P-001c (step=email): メールアドレス入力
   ↓
2. supabase.auth.resetPasswordForEmail(email, { redirectTo })
   ↓
3. リセットメール送信
   ↓
4. ユーザーがリンクをクリック
   ↓
5. P-001c (step=password): 新パスワード設定
   ↓
6. supabase.auth.updateUser({ password })
   ↓
7. ログインページへリダイレクト
```

---

## 🔒 セキュリティ

### パスワード要件
- 最小長: 8文字
- 必須文字: 英字 (a-zA-Z)
- 必須文字: 数字 (0-9)
- 許可文字: 半角英数字のみ

### トークン管理
- Access Token: JWTトークン、1時間有効
- Refresh Token: セッション更新用、7日間有効
- localStorage: Zustand persistで永続化

### CSRF対策
- Supabase Authが自動対応
- JWTトークンベース認証

---

## 📝 モックサービス

開発環境（`VITE_SUPABASE_URL=https://mock-project.supabase.co`）では、モック認証を使用:

### モックユーザー
```typescript
{
  'admin@example.com': {
    id: 'mock-admin-id',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2025-10-08T00:00:00.000Z',
  },
  'user@example.com': {
    id: 'mock-user-id',
    email: 'user@example.com',
    role: 'user',
    created_at: '2025-10-08T00:00:00.000Z',
  },
}
```

### モック動作
- パスワード: 任意（8文字以上であれば認証成功）
- レスポンス遅延: 500ms（実際の認証をシミュレート）
- トークン: モック環境では不要

---

## 🎯 バックエンド実装時の注意点

### Phase 5（環境構築）での対応
1. Supabaseプロジェクト作成
2. 環境変数設定（実際のURL、ANON_KEY）
3. auth.tsの`import.meta.env.VITE_SUPABASE_URL`チェックにより自動切り替え

### Phase 7（バックエンド実装）での対応
- Supabase Authはサーバー側で自動処理
- 追加実装不要（Supabaseが全て処理）

### Phase 8（API統合）での対応
- モックフラグを削除
- 実際のSupabase認証に切り替え
- 動作確認

---

## 🔗 関連ファイル

| ファイル | 役割 |
|---------|------|
| `frontend/src/stores/auth.ts` | 認証状態管理 |
| `frontend/src/pages/auth/LoginPage.tsx` | ログイン画面 |
| `frontend/src/pages/auth/AcceptInvitationPage.tsx` | 招待受諾画面 |
| `frontend/src/pages/auth/ResetPasswordPage.tsx` | パスワードリセット画面 |
| `frontend/src/lib/supabase.ts` | Supabaseクライアント |
| `frontend/src/types/index.ts` | 型定義 |

---

**作成日**: 2025-10-08
**バージョン**: 1.0
**Phase**: 4-B (P-001ドキュメント補完)
