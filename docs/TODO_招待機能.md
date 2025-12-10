# 招待機能 - 残作業

**最終更新**: 2025-12-11
**コミット**: 26359a2

## 現在の状態

招待メール送信 → リンククリック → パスワード設定 → ログイン まで動作確認済み。

**残作業: profilesテーブルへの登録**

## 次回やること（順番に実行）

### 1. Supabaseのトリガーを削除
SQL Editorで以下を実行:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### 2. フロントエンドを修正
`AcceptInvitationPage.tsx`で、パスワード設定成功時にprofilesテーブルにINSERTする処理を追加。

**修正箇所**: `frontend/src/pages/auth/AcceptInvitationPage.tsx`

パスワード設定成功後（`supabase.auth.updateUser`成功後）に:
```typescript
// profilesテーブルにユーザーを登録
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'user',
    is_deleted: false,
    created_at: new Date().toISOString()
  })
}
```

### 3. テスト
1. Supabaseダッシュボードでテストユーザーを削除
2. 新規招待を送信
3. パスワード設定完了
4. ユーザー管理ページに表示されることを確認

## 方式の説明

**トリガー方式の問題点（不採用）:**
- 招待送信時にprofilesに登録される
- 招待を無視した場合、profilesにゴミデータが残る
- 「招待中」と「登録済み」の区別がつかない

**パスワード設定時登録（採用）:**
- パスワード設定完了時にのみprofilesに登録
- 登録完了したユーザーのみ表示される
- クリーンな状態を維持できる

## 今回のセッションで完了した修正

### 1. ダウンロードファイル名問題
- CORS設定に`exposedHeaders: ['Content-Disposition']`追加
- 全ダウンロードAPIをRFC 5987形式（`filename*=UTF-8''...`）に統一
- ZIPファイル名をYYMM形式に統一
- `companies`テーブルJOINで取引先名取得
- `excel_filename`から年月抽出（処理実行日ではなく処理対象月）

**修正ファイル:**
- `backend/src/server.ts` (CORS)
- `backend/src/controllers/processController.ts` (ZIP DL)
- `backend/src/controllers/historyController.ts` (個別/ZIP DL)
- `backend/src/controllers/companiesController.ts` (テンプレートDL)
- `backend/src/services/historyService.ts` (excelFilename戻り値追加)

### 2. 招待リンク問題
- Supabase新認証フロー（セッションベース）に対応
- URLパラメータからの取得 → `supabase.auth.getSession()`に変更
- ローディング状態・エラー状態のUI追加

**修正ファイル:**
- `frontend/src/pages/auth/AcceptInvitationPage.tsx`

## 次回の作業手順

1. Supabaseダッシュボード > SQL Editor を開く
2. 上記のトリガーSQLを実行
3. 新規ユーザーを招待してテスト
4. ユーザー管理ページに表示されることを確認
5. 問題なければ完了
