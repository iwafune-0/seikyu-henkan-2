# 招待機能 - 残作業

**最終更新**: 2025-12-11
**コミット**: b88f4c0

## 現在の状態

招待メール送信 → リンククリック → パスワード設定 → ログイン まで動作確認済み。

**ただし、以下の問題が残っている：**

## 問題: 招待ユーザーがprofilesテーブルに登録されない

### 症状
- Supabase Auth（ダッシュボードのUsers）にはユーザーが表示される
- アプリのユーザー管理ページにはユーザーが表示されない
- 原因: `profiles`テーブルにINSERTされていない

### 原因
`backend/src/services/usersService.ts`の`inviteUser()`関数:
- Supabase Authに招待メールを送信している
- **新規ユーザーの場合、`profiles`テーブルへのINSERTが行われていない**
- 削除済みユーザーの再招待時のみ`profiles`をUPDATEしている

### 解決方法（2つの選択肢）

#### 方法1: Supabaseにトリガーを設定（推奨）
`auth.users`に新規ユーザーが作成されたら、自動的に`profiles`テーブルにもINSERTするトリガーを設定。

**Supabase SQL Editorで実行:**
```sql
-- profiles自動作成用の関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_deleted, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    false,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**注意**:
- `role`は招待時に`data: { role }`で渡している（usersService.ts:91）
- `raw_user_meta_data`に格納される

#### 方法2: 招待時にprofilesテーブルにもINSERTする
`inviteUser()`関数で、Supabase Auth招待後に`profiles`テーブルにもINSERTする。

**ただし、この方法の問題点:**
- 招待時点でSupabase AuthのユーザーIDが取得できない
- パスワード設定完了時にprofilesを作成する必要がある

### 推奨: 方法1（トリガー設定）

トリガーを設定すれば、Supabase Authにユーザーが作成された時点で自動的にprofilesにも登録される。

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
