# Phase 7 完了報告書 - バックエンド実装

## 概要

| 項目 | 内容 |
|------|------|
| Phase | 7 |
| 名称 | バックエンド実装 |
| 完了日 | 2025-12-05 |
| 担当 | バックエンド実装オーケストレーター |

---

## 実施内容

### 1. 垂直スライス実装（全6スライス完了）

| スライス | 内容 | 状態 |
|---------|------|------|
| スライス1 | バックエンド基盤 | ✅ 完了 |
| スライス2 | 認証・認可基盤 | ✅ 完了 |
| スライス3-A | ユーザー管理API | ✅ 完了 |
| スライス3-B | 取引先管理API | ✅ 完了 |
| スライス4 | 処理履歴API | ✅ 完了 |
| スライス5 | PDF処理API（検出） | ✅ 完了 |
| スライス6 | PDF処理API（実行） | ✅ 完了 |

### 2. 実装エンドポイント一覧（22エンドポイント）

#### ユーザー管理API
| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| /api/users | GET | ユーザー一覧取得 |
| /api/users/invite | POST | ユーザー招待 |
| /api/users/:id/role | PATCH | ロール変更 |
| /api/users/:id | DELETE | ユーザー削除（論理削除） |

#### 取引先管理API
| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| /api/companies | GET | 取引先一覧取得 |
| /api/companies/:id | GET | 取引先詳細取得 |
| /api/companies/:id | PUT | 取引先更新 |
| /api/companies/:id/template | POST | テンプレートアップロード |
| /api/companies/:id/template | GET | テンプレートダウンロード |

#### 処理履歴API
| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| /api/history | GET | 処理履歴一覧取得 |
| /api/history/:id/download/:fileType | GET | 個別ファイルダウンロード |
| /api/history/:id/download-zip | GET | ZIP一括ダウンロード |

#### PDF処理API
| エンドポイント | メソッド | 機能 |
|--------------|---------|------|
| /api/process/detect | POST | PDF判別・取引先検出 |
| /api/process/upload-single | POST | 個別スロットへのPDFアップロード |
| /api/process/upload-excel | POST | Excelテンプレートアップロード |
| /api/process/execute | POST | PDF処理実行 |
| /api/process/download/:processId/:fileType | GET | 処理結果ダウンロード |
| /api/process/download-zip/:processId | GET | 処理結果ZIP一括ダウンロード |

---

## 成果物

### Node.js（TypeScript）

| ファイル | 役割 |
|---------|------|
| `backend/src/server.ts` | Expressサーバーエントリポイント |
| `backend/src/types/index.ts` | 型定義（フロントエンドと同期） |
| `backend/src/lib/supabase.ts` | Supabaseクライアント |
| `backend/src/middleware/auth.ts` | JWT認証ミドルウェア |
| `backend/src/middleware/requireAdmin.ts` | 管理者権限チェック |
| `backend/src/middleware/errorHandler.ts` | エラーハンドラ |
| `backend/src/utils/response.ts` | 統一レスポンスヘルパー |
| `backend/src/services/profileService.ts` | プロファイル操作 |
| `backend/src/services/usersService.ts` | ユーザー管理ロジック |
| `backend/src/services/companiesService.ts` | 取引先管理ロジック |
| `backend/src/services/historyService.ts` | 処理履歴ロジック |
| `backend/src/services/processService.ts` | PDF処理ロジック |
| `backend/src/controllers/usersController.ts` | ユーザーコントローラー |
| `backend/src/controllers/companiesController.ts` | 取引先コントローラー |
| `backend/src/controllers/historyController.ts` | 処理履歴コントローラー |
| `backend/src/controllers/processController.ts` | PDF処理コントローラー |
| `backend/src/routes/users.ts` | ユーザールート |
| `backend/src/routes/companies.ts` | 取引先ルート |
| `backend/src/routes/history.ts` | 処理履歴ルート |
| `backend/src/routes/process.ts` | PDF処理ルート |

### Python

| ファイル | 役割 |
|---------|------|
| `backend/python/requirements.txt` | 依存パッケージ（pdfplumber, openpyxl, python-dateutil） |
| `backend/python/pdf_parser.py` | PDF解析（pdfplumber使用） |
| `backend/python/excel_editor.py` | Excel編集（openpyxl使用） |
| `backend/python/pdf_generator.py` | PDF生成（LibreOffice使用） |

### 設定ファイル

| ファイル | 役割 |
|---------|------|
| `backend/package.json` | 依存関係管理 |
| `backend/tsconfig.json` | TypeScript設定 |
| `backend/.env.example` | 環境変数テンプレート |
| `backend/.gitignore` | Git除外設定 |

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| APIサーバー | Node.js 20 + Express 4.x + TypeScript 5.x |
| PDF処理 | Python 3.11 + pdfplumber |
| Excel処理 | Python 3.11 + openpyxl |
| PDF生成 | LibreOffice |
| データベース | PostgreSQL 15 (Supabase) |
| 認証 | Supabase Auth + JWT |

---

## 主要な実装ポイント

### 1. JWT認証ミドルウェア
- Supabase Authのトークン検証
- profilesテーブルからユーザー情報取得
- 削除済みユーザーのアクセス拒否

### 2. 最終管理者保護
- 管理者が1人のみの場合、削除/降格をブロック
- ロール変更と削除の両方で保護

### 3. 論理削除
- is_deleted=true、deleted_atタイムスタンプを記録
- 過去の処理履歴は保持

### 4. BYTEA型ファイル保存
- 全ファイルをPostgreSQL BYTEA型で保存
- URLリンクでの直接アクセス不可（セキュリティ確保）

### 5. Node.js-Python連携
- child_process.spawnでPythonスクリプト呼び出し
- JSON形式でデータ受け渡し
- エラー時もDB保存

### 6. 取引先判別ロジック
- ネクストビッツ: ファイル名が`TRR-`で始まる
- オフ・ビート・ワークス: ファイル名に`offbeat-to-terra`を含む

---

## Phase 8への引き継ぎ

### 読み込ませるべきファイル

| ファイル | 理由 |
|---------|------|
| `docs/SCOPE_PROGRESS.md` | 進捗管理 |
| `docs/phase7_summary.md` | Phase 7完了報告 |
| `frontend/src/types/index.ts` | 型定義（バックエンドと同期済み） |

### モックからAPIへの置き換え

| フロントエンドサービス | バックエンドAPI |
|---------------------|---------------|
| `frontend/src/services/mock/usersService.ts` | `/api/users/*` |
| `frontend/src/services/mock/companiesService.ts` | `/api/companies/*` |
| `frontend/src/services/mock/historyService.ts` | `/api/history/*` |
| `frontend/src/services/mock/processService.ts` | `/api/process/*` |

### 環境変数設定

バックエンドの`.env`ファイルに以下を設定：

```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5174
SUPABASE_URL=https://smddkgfdvvxwyyknjimf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<実際のキー>
```

### バックエンドサーバー起動

```bash
cd backend
npm install
npm run dev
```

---

## 進捗更新

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| ステータス | Phase 6完了 | Phase 7完了 |
| 完了タスク数 | 6/10 | 7/10 |
| 進捗率 | 72% | 84% |
| 次のマイルストーン | Phase 7 | Phase 8 |

---

## 処理ルール確定（2025-12-08追記）

### 参照ファイル

| ファイル | 内容 |
|---------|------|
| `rule/ネクストビッツ_処理内容.txt` | ネクストビッツの処理ルール |
| `rule/オフ・ビート・ワークス_処理内容.txt` | オフ・ビート・ワークスの処理ルール |
| `データ/ネクストビッツ/2507/` | ネクストビッツのサンプルデータ（2025年7月分） |
| `データ/ネクストビッツ/2508/` | ネクストビッツのサンプルデータ（2025年8月分） |
| `データ/オフ・ビート・ワークス/2507/` | オフ・ビート・ワークスのサンプルデータ（2025年7月分） |
| `データ/オフ・ビート・ワークス/2508/` | オフ・ビート・ワークスのサンプルデータ（2025年8月分） |

### 出力ファイル名（確定）

| 項目 | ネクストビッツ | オフ・ビート・ワークス |
|------|--------------|---------------------|
| Excel | `テラ【株式会社ネクストビッツ御中】注文検収書_{YYMM}.xlsx` | `テラ【株式会社オフ・ビート・ワークス御中】注文検収書_{YYMM}.xlsx` |
| 注文書PDF | `注文書_{YYMM}.pdf` | `注文書_{YYMM}.pdf` |
| 検収書PDF | `検収書_{YYMM}.pdf` | `検収書_{YYMM}.pdf` |
| ZIP | `ネクストビッツ_{YYMM}.zip` | `オフ・ビート・ワークス_{YYMM}.zip` |

※ `{YYMM}` = 年下2桁 + 月2桁（例: 2025年7月 → `2507`）

### 入力PDFの用途

**ネクストビッツ**
| 入力PDF | 用途 |
|---------|------|
| 見積書（`TRR-**-***_お見積書.pdf`） | 数量・単価を抽出 |
| 請求書（`TRR-**-***_請求書.pdf`） | 合計金額のチェック用 |
| 注文請書（`TRR-**-***_注文請書.pdf`） | データ抽出なし（保存のみ） |
| 納品書（`TRR-**-***_納品書.pdf`） | データ抽出なし（保存のみ） |

**オフ・ビート・ワークス**
| 入力PDF | 用途 |
|---------|------|
| 見積書（`*-見積-offbeat-to-terra-*.pdf`） | 見積書番号を抽出 |
| 請求書（`*-請求_offbeat-to-terra-*.pdf`） | 明細（品目・数量・単価）・合計金額を抽出 |
| 注文請書（`請書_offbeat-to-terra-*.pdf`） | 発行日を抽出 |
| 納品書（`*-納品-offbeat-to-terra-*.pdf`） | データ抽出なし（保存のみ） |

### 修正したファイル

| ファイル | 修正内容 |
|---------|---------|
| `docs/api-specs/history-api.md` | モックデータのファイル名を処理ルールに合わせて修正 |
| `frontend/src/services/mock/historyService.ts` | モックデータのファイル名とZIPファイル名生成ロジックを修正 |

### ネクストビッツ処理手順（確定）

#### PDFから抽出するデータ

**見積書から:**
| 項目 | 抽出パターン | 例 |
|------|-------------|-----|
| 見積番号 | `No.TRR-XX-XXX` | `TRR-25-007` |
| 数量 | `1式` → `1` | `1` |
| 単価 | 明細の単価 | `600,000` |

**請求書から（チェック用）:**
| 項目 | 用途 |
|------|------|
| 合計金額（税込） | Excel計算結果と照合 |
| 消費税10%対象 | 小計と照合 |
| 消費税(10%) | 消費税額と照合 |

#### Excel編集内容

**注文書シート:**
| セル | 内容 | 操作 |
|------|------|------|
| AC2 | 発行日 | **編集**: 1ヶ月加算して当月1日に変更 |
| AC3 | 注文番号 | 数式（自動計算） |
| B8 | 宛名 | チェックのみ |
| G12 | 発注金額 | 数式（自動計算） |
| C17 | 明細タイトル | 数式（自動計算） |
| R17 | 数量 | **編集**: 見積書の数量 |
| T17 | 単価 | **編集**: 見積書の単価 |
| W17 | 金額 | 数式（自動計算） |
| AA17 | 摘要 | 数式（自動計算） |
| C18 | 件名 | チェックのみ |
| C19 | 明細締め | チェックのみ（「以下、余白」） |

**検収書シート:**
| セル | 内容 | 操作 |
|------|------|------|
| AC4 | 検収番号 | 数式（自動計算） |
| AC5 | 検収日 | 数式（自動計算） |
| B7 | 宛名 | チェックのみ |
| G14 | 合計金額 | 数式（自動計算） |
| C19 | 明細タイトル | 数式（自動計算） |
| R19 | 数量 | **編集**: 見積書の数量 |
| T19 | 単価 | **編集**: 見積書の単価 |
| W19 | 金額 | 数式（自動計算） |
| AA19 | 摘要 | 数式（自動計算） |
| C20 | 件名 | チェックのみ |
| C21 | 明細締め | チェックのみ（「以下、余白」） |

#### チェック項目
1. 請求書の合計金額（税込）= Excel W41（注文書）の計算結果
2. 小計・消費税・合計が請求書と一致

### 残作業

- [x] Pythonスクリプト（`pdf_parser.py`）を実際のPDF構造に合わせて修正
- [x] Pythonスクリプト（`excel_editor.py`）を実際のExcel構造に合わせて修正
- [x] `processService.ts`のファイル名生成ロジックを修正
- [x] ネクストビッツの処理手順を整理
- [x] オフ・ビート・ワークスの処理手順を整理

### 修正完了（2025-12-08追記）

| ファイル | 修正内容 |
|---------|---------|
| `backend/python/pdf_parser.py` | 実際のPDF構造に合わせて抽出ロジックを修正 |
| `backend/python/excel_editor.py` | 実際のExcel構造（セル位置）に合わせて編集ロジックを修正 |
| `backend/src/services/processService.ts` | 出力ファイル名を処理ルールに合わせて修正 |

---

## 次のステップ

**Phase 8: API統合**

フロントエンドのモックサービスをバックエンドAPIに置き換え、実際のシステムとして動作させます。

1. VS Code拡張「BlueLamp」のプロンプトカードを開く
2. **「Phase 8: API統合」** をクリック
3. 新しいエージェント（@8-0-API統合オーケストレーター）を起動

---

**作成日**: 2025-12-05
