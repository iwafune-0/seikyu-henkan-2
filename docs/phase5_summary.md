# Phase 5 完了報告書 - 環境構築

## 概要

| 項目 | 内容 |
|------|------|
| Phase | 5 |
| 名称 | 環境構築 |
| 完了日 | 2025-12-05 |
| 担当 | 環境構築オーケストレーター |

---

## 実施内容

### 1. Supabase本番認証への切り替え

#### 背景
Phase 4まではモック認証（`VITE_SUPABASE_URL=https://mock-project.supabase.co`）を使用していたが、本番Supabase URLに変更後、ログインできなくなった。

#### 原因
- 本番Supabase URLが設定されているため、モック認証がスキップされた
- Supabase側にユーザーが存在しなかった
- エラーメッセージが英語で表示された（`Invalid login credentials`）

#### 対応
1. 初期管理者ユーザーをSupabaseダッシュボードで作成
2. profilesテーブルにユーザーデータを登録
3. エラーメッセージを日本語化

---

### 2. 初期管理者の作成手順

**重要**: 初期管理者はSupabaseダッシュボードで作成する（正規の初期化手順）

#### 手順

##### Step 1: Supabase Authでユーザー作成

1. Supabaseダッシュボードにアクセス
2. **Authentication** → **Users** を開く
3. **Add user** → **Create new user** をクリック
4. 以下を入力：
   - **Email**: 管理者のメールアドレス
   - **Password**: 8文字以上のパスワード
   - **Auto Confirm User**: ✅ チェック（メール確認をスキップ）
5. ユーザーが作成されたことを確認

##### Step 2: profilesテーブルにデータ追加

1. **Table Editor** → **profiles** を開く
2. **Insert** → **Insert row** をクリック
3. 以下を入力：

| カラム | 値 |
|--------|-----|
| id | Step 1で作成したユーザーのUUID（Authentication → Users で確認） |
| email | 管理者のメールアドレス |
| role | `admin` |
| is_deleted | `false` |
| deleted_at | （空欄） |
| created_at | （自動または空欄） |

4. **Save** をクリック

##### Step 3: ログイン確認

1. フロントエンドを起動（`npm run dev`）
2. 作成したメールアドレスとパスワードでログイン
3. 管理者メニュー（ユーザー管理、取引先設定）が表示されることを確認

---

### 3. コード修正

#### 修正ファイル
- `frontend/src/stores/auth.ts`

#### 修正内容

##### 3.1 エラーメッセージの日本語化

```typescript
const translateAuthError = (message: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
    'Email not confirmed': 'メールアドレスが確認されていません',
    'User not found': 'ユーザーが見つかりません',
    'Invalid email or password': 'メールアドレスまたはパスワードが正しくありません',
    'Too many requests': 'リクエストが多すぎます。しばらく待ってから再試行してください',
    'Email rate limit exceeded': 'メール送信の制限に達しました。しばらく待ってから再試行してください',
  }
  return errorMap[message] || 'ログインに失敗しました。もう一度お試しください'
}
```

##### 3.2 profilesテーブルからroleを取得

```typescript
// 変更前: user_metadataから取得（設定されていない）
role: (data.user.user_metadata?.role as 'admin' | 'user') || 'user'

// 変更後: profilesテーブルから取得
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

role: (profile?.role as 'admin' | 'user') || 'user'
```

---

## 環境変数設定

### 本番Supabase設定（現在）

```bash
# frontend/.env
VITE_SUPABASE_URL=https://smddkgfdvvxwyyknjimf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### モック認証に戻す場合

```bash
# frontend/.env
VITE_SUPABASE_URL=https://mock-project.supabase.co
VITE_SUPABASE_ANON_KEY=mock-anon-key
```

---

## 注意事項

### 初期管理者について

- **初期管理者**はSupabaseダッシュボードで作成する（鶏と卵問題の解決）
- **2人目以降のユーザー**はP-004（ユーザー管理ページ）から招待する（Phase 7で実装）
- これは正規の運用フローであり、特別扱いではない

### P-004（ユーザー管理ページ）の現状

- 現在はモックサービスを使用しているため、モックユーザーが表示される
- Phase 7-8でSupabase APIに置き換え後、profilesテーブルのデータが表示される

---

## 成果物

| 成果物 | 状態 |
|--------|------|
| Supabase認証動作 | ✅ 正常動作 |
| 初期管理者ユーザー | ✅ 作成済み |
| profilesテーブルデータ | ✅ 登録済み |
| エラーメッセージ日本語化 | ✅ 実装済み |

---

## 次のステップ

Phase 6: バックエンド計画 に進む

---

**作成日**: 2025-12-05
