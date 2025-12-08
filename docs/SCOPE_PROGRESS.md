# seikyu-henkan-2 開発進捗状況

## 1. 基本情報

- **ステータス**: Phase 7完了
- **完了タスク数**: 7/10
- **進捗率**: 84%（作業量ベース）
- **次のマイルストーン**: Phase 8 API統合
- **最終更新日**: 2025-12-05

### 進捗率の計算方法
- **準備フェーズ**（Phase 1-2）: 各5% → 合計10%
- **実装フェーズ**（Phase 3-8）: 各12% → 合計72%
- **完成フェーズ**（Phase 9-10）: 各9% → 合計18%

## 2. 実装計画

BlueLampでの開発は以下のフローに沿って進行します：

### 開発フェーズ
| フェーズ | 状態 | 担当エージェント | 解説 |
|---------|------|----------------|------|
| **Phase 1: 要件定義** | [x] | 要件定義エンジニア | あなたのアイデアを実現可能な要件に落とし込みます |
| **Phase 2: Git/GitHub管理** | [x] | Git管理エージェント | プロジェクトリポジトリを準備し開発環境を整えます |
| **Phase 3: フロントエンド基盤** | [x] | フロントエンド基盤オーケストレーター | React+TypeScript+Viteの最新基盤が即座に立ち上がります |
| **Phase 4: ページ実装** | [x] | ページ実装オーケストレーター | 画面が一つずつ形になっていきます |
| **Phase 5: 環境構築** | [x] | 環境構築オーケストレーター | 本番環境で動作するための秘密鍵を取得し設定します |
| **Phase 6: バックエンド計画** | [x] | バックエンド計画オーケストレーター | 実装の順番を計画し効果的にプロジェクトを組み上げます |
| **Phase 7: バックエンド実装** | [x] | バックエンド実装オーケストレーター | いよいよバックエンドの実装に入ります |
| **Phase 8: API統合** | [ ] | フロントエンド実装オーケストレーター | プロトタイプが動くシステムへと変わります |
| **Phase 9: E2Eテスト** | [ ] | E2Eテストオーケストレーター | ユーザー操作をシミュレートして品質を担保します |
| **Phase 10: デプロイメント** | [ ] | デプロイオーケストレーター | いよいよデプロイ！インターネットに公開します |

### サポートツール（必要に応じて使用）
| ツール | 担当エージェント | 解説 |
|---------|----------------|------|
| **機能拡張** | 機能拡張オーケストレーター | リリース後も新機能を追加できます |
| **デバッグ** | デバッグマスター | エラーが発生したら完全自動で解決します |
| **TypeScript型解消** | TypeScript型解消オーケストレーター | 型エラーを徹底的に分析し一掃します |
| **リファクタリング** | リファクタリングオーケストレーター | コード品質を大規模に改善します |
| **ドキュメント生成** | ドキュメント生成オーケストレーター | 日本標準の納品ドキュメントを自動生成します |
| **相談** | 相談エージェント | プロジェクトに関する汎用的な相談やサポートを提供します |

---

## 3. ページ管理表

### 認証関連ページ（3ページ）

| ページID | ページ名 | 権限 | 状態 |
|---------|---------|------|------|
| P-001a | ログインページ | ゲスト | ✅ 完成 |
| P-001b | 招待受諾・パスワード設定ページ | 招待リンク保有者 | ✅ 完成 |
| P-001c | パスワードリセットページ | パスワードリセットリンク保有者 | ✅ 完成 |

### メイン機能ページ（4ページ）

| ページID | ページ名 | 権限 | 状態 |
|---------|---------|------|------|
| P-002 | PDF処理実行ページ | 全ユーザー | ✅ 完成（モック） |
| P-003 | 処理履歴・ダウンロードページ | 全ユーザー | ✅ 完成（モック） |
| P-004 | ユーザー管理ページ | 管理者専用 | ✅ 完成（モック） |
| P-005 | 取引先設定ページ | 管理者専用 | ✅ 完成（モック） |

### 実装優先順位

1. **Phase 3-4**: 認証関連ページ（P-001a/b/c）
2. **Phase 4**: メイン機能ページ（P-002, P-003, P-004, P-005）
3. **Phase 7-8**: バックエンドAPI統合

---

## 4. バックエンド実装計画（Phase 6成果物）

### 4.1 垂直スライス実装順序

| 順序 | スライス名 | 主要機能 | 依存スライス | 完了 |
|------|-----------|---------|-------------|------|
| 1 | バックエンド基盤 | Express設定、ミドルウェア、型定義同期、ディレクトリ構造 | なし | [x] |
| 2 | 認証・認可基盤 | JWTミドルウェア、profilesテーブル操作、管理者権限チェック | スライス1 | [x] |
| 3-A | ユーザー管理API | ユーザー一覧、招待機能、ロール変更、論理削除 | スライス2 | [x] |
| 3-B | 取引先管理API | 取引先一覧/詳細、テンプレートアップロード/ダウンロード | スライス2 | [x] |
| 4 | 処理履歴API | 履歴一覧、個別ファイルダウンロード、ZIP生成 | スライス2 | [x] |
| 5 | PDF処理API（検出） | PDF種別判別、取引先検出、事前チェック | スライス3-B | [x] |
| 6 | PDF処理API（実行） | Python連携、PDF解析、Excel編集、PDF生成、DB保存 | スライス5 | [x] |

※ 番号-アルファベット表記（3-A, 3-B）は並列実装可能を示す

### 4.2 エンドポイント実装タスクリスト

#### スライス1: バックエンド基盤
| タスク | 内容 | 完了 |
|--------|------|------|
| 1.1 | backendディレクトリ構造作成（src/routes, controllers, services, middleware, types） | [x] |
| 1.2 | package.json作成（Express, TypeScript, ts-node, Supabase等） | [x] |
| 1.3 | tsconfig.json作成（バックエンド用TypeScript設定） | [x] |
| 1.4 | backend/src/types/index.ts作成（frontend/src/types/index.tsと同期） | [x] |
| 1.5 | Express基本設定（CORS, JSON Parser, エラーハンドラ） | [x] |
| 1.6 | Supabaseクライアント初期化（Service Role Key使用） | [x] |
| 1.7 | 環境変数設定（.env.example作成） | [x] |

#### スライス2: 認証・認可基盤
| タスク | エンドポイント | メソッド | 完了 |
|--------|--------------|---------|------|
| 2.1 | JWTミドルウェア実装（Supabase Auth検証） | - | [x] |
| 2.2 | 管理者権限チェックミドルウェア実装 | - | [x] |
| 2.3 | profilesテーブル操作ヘルパー（role取得、is_deletedチェック） | - | [x] |
| 2.4 | エラーレスポンス統一ヘルパー（400/401/403/404/500） | - | [x] |

#### スライス3-A: ユーザー管理API
| タスク | エンドポイント | メソッド | 完了 |
|--------|--------------|---------|------|
| 3A.1 | /api/users | GET | [x] |
| 3A.2 | /api/users/invite | POST | [x] |
| 3A.3 | /api/users/:id/role | PATCH | [x] |
| 3A.4 | /api/users/:id | DELETE | [x] |
| 3A.5 | 最終管理者保護ロジック実装 | - | [x] |

#### スライス3-B: 取引先管理API
| タスク | エンドポイント | メソッド | 完了 |
|--------|--------------|---------|------|
| 3B.1 | /api/companies | GET | [x] |
| 3B.2 | /api/companies/:id | GET | [x] |
| 3B.3 | /api/companies/:id | PUT | [x] |
| 3B.4 | /api/companies/:id/template | POST | [x] |
| 3B.5 | /api/companies/:id/template | GET | [x] |

#### スライス4: 処理履歴API
| タスク | エンドポイント | メソッド | 完了 |
|--------|--------------|---------|------|
| 4.1 | /api/history | GET | [x] |
| 4.2 | /api/history/:id/download/:fileType | GET | [x] |
| 4.3 | /api/history/:id/download-zip | GET | [x] |
| 4.4 | ZIP生成ユーティリティ実装（archiver） | - | [x] |

#### スライス5: PDF処理API（検出）
| タスク | エンドポイント | メソッド | 完了 |
|--------|--------------|---------|------|
| 5.1 | /api/process/detect | POST | [x] |
| 5.2 | /api/process/upload-single | POST | [x] |
| 5.3 | /api/process/upload-excel | POST | [x] |
| 5.4 | ファイル名から取引先判別ロジック実装 | - | [x] |
| 5.5 | PDF種別判別ロジック実装 | - | [x] |

#### スライス6: PDF処理API（実行）
| タスク | エンドポイント | メソッド | 完了 |
|--------|--------------|---------|------|
| 6.1 | /api/process/execute | POST | [x] |
| 6.2 | /api/process/download/:processId/:fileType | GET | [x] |
| 6.3 | /api/process/download-zip/:processId | GET | [x] |
| 6.4 | Python: pdf_parser.py（pdfplumber） | - | [x] |
| 6.5 | Python: excel_editor.py（openpyxl） | - | [x] |
| 6.6 | Python: pdf_generator.py（LibreOffice） | - | [x] |
| 6.7 | Node.js-Python連携（child_process） | - | [x] |
| 6.8 | 処理結果のDB保存（processed_files） | - | [x] |

### 4.3 並列実装スケジュール

```
Week 1:  |======= スライス1: バックエンド基盤 =======|

Week 2:  |====== スライス2: 認証・認可基盤 ======|

Week 3:  |==== スライス3-A: ユーザー管理API ====|
         |==== スライス3-B: 取引先管理API ====|  ← 並列実装

Week 4:  |===== スライス4: 処理履歴API =====|
         |=== スライス5: PDF処理API（検出）===|  ← 並列実装

Week 5-6:|========= スライス6: PDF処理API（実行）=========|
         |== Python: pdf_parser + excel_editor + pdf_generator ==|
```

### 4.4 データベーステーブル作成（Supabaseマイグレーション）

#### 必要テーブル（要件定義書より）

```sql
-- profiles（ユーザープロファイル）: Phase 5で作成済み
-- 追加が必要な場合のみ

-- companies（取引先）
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_processed_at TIMESTAMPTZ,
  template_excel BYTEA,
  template_filename TEXT,
  template_updated_at TIMESTAMPTZ,
  template_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- processed_files（処理済みファイル）
CREATE TABLE processed_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  process_date DATE NOT NULL,

  -- 入力ファイル（BYTEA型）
  input_pdf_1 BYTEA,
  input_pdf_1_filename TEXT,
  input_pdf_2 BYTEA,
  input_pdf_2_filename TEXT,
  input_pdf_3 BYTEA,
  input_pdf_3_filename TEXT,
  input_pdf_4 BYTEA,
  input_pdf_4_filename TEXT,

  -- 出力ファイル（BYTEA型）
  excel_file BYTEA,
  excel_filename TEXT,
  order_pdf BYTEA,
  order_pdf_filename TEXT,
  inspection_pdf BYTEA,
  inspection_pdf_filename TEXT,

  -- 処理情報
  processing_time NUMERIC(5,2),
  status TEXT CHECK (status IN ('success', 'error')),
  error_message TEXT,
  error_code TEXT,
  error_detail TEXT,
  error_stacktrace TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- process_logs（処理ログ）
CREATE TABLE process_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  status TEXT CHECK (status IN ('success', 'error')),
  error_message TEXT,
  error_detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_processed_files_user_id ON processed_files(user_id);
CREATE INDEX idx_processed_files_company_id ON processed_files(company_id);
CREATE INDEX idx_processed_files_process_date ON processed_files(process_date);
CREATE INDEX idx_processed_files_status ON processed_files(status);
CREATE INDEX idx_processed_files_created_at ON processed_files(created_at);
```

#### RLS設定

```sql
-- profiles: Phase 5で設定済み

-- companies: 管理者のみ更新可能
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "全ユーザーが取引先を閲覧可能" ON companies FOR SELECT USING (true);
CREATE POLICY "管理者のみ取引先を更新可能" ON companies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_deleted = false)
);

-- processed_files: 全ユーザーが閲覧可能
ALTER TABLE processed_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "全ユーザーが処理履歴を閲覧可能" ON processed_files FOR SELECT USING (true);
CREATE POLICY "認証済みユーザーが処理履歴を作成可能" ON processed_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 4.5 バックエンド実装への引き継ぎ

#### 実装順序の厳守事項
1. **スライス1（バックエンド基盤）を必ず最初に完成させる**
2. **スライス2（認証・認可基盤）を次に完成させる**（全APIの前提条件）
3. **番号-アルファベット表記（3-A, 3-B等）は並列実装可能**
4. **スライスの依存関係を確認し、前提条件を満たす**

#### 並列実装時の注意事項
- データベースマイグレーションの競合を避ける
- 共通ユーティリティは最初に作成
- 型定義（types/index.ts）の同期を忘れない

#### テスト作成の重要ポイント
- 各スライス完了時に統合テストを作成
- 並列実装したものは個別にテスト可能に設計
- マイルストーントラッカーを必ず実装

---

### 4.6 @9統合テスト成功請負人への引き継ぎ

**実装完了機能**
- スライス6: PDF処理API（実行）
  - POST /api/process/execute（PDF処理実行）
  - GET /api/process/download/:processId/:fileType（個別ファイルダウンロード）
  - GET /api/process/download-zip/:processId（ZIP一括ダウンロード）
  - Python: pdf_parser.py（pdfplumber使用）
  - Python: excel_editor.py（openpyxl使用）
  - Python: pdf_generator.py（LibreOffice使用）
  - Node.js-Python連携（child_process使用）
  - 処理結果のDB保存（processed_files）

**実装ファイル一覧**
- `backend/python/requirements.txt` - Pythonパッケージ依存関係
- `backend/python/pdf_parser.py` - PDF解析スクリプト（pdfplumber）
- `backend/python/excel_editor.py` - Excel編集スクリプト（openpyxl）
- `backend/python/pdf_generator.py` - PDF生成スクリプト（LibreOffice）
- `backend/src/services/processService.ts` - PDF処理ビジネスロジック（実行部分追加）
- `backend/src/controllers/processController.ts` - PDF処理コントローラー（3エンドポイント追加）
- `backend/src/routes/process.ts` - PDF処理ルート定義（3エンドポイント追加）

**統合テスト情報（@9が作成・実行するテスト）**
- **テスト実行コマンド**: `npm run test:integration`（未作成）
- **Python環境構築**: `pip3 install -r backend/python/requirements.txt`（実行前に必須）
- **LibreOffice**: ローカル開発ではモック動作を想定（pdf_generator.pyはLibreOffice未インストール時にエラーメッセージを返す）

**@9への注意事項**
- **実データ主義**: モックは一切使用していません。実際のSupabase環境で動作します。
- **Python環境**: テスト実行前に`pip3 install -r backend/python/requirements.txt`でPythonパッケージをインストールしてください。
- **LibreOffice**: ローカル開発環境ではLibreOfficeが未インストールの可能性があります。PDF生成部分はエラーになりますが、PDF解析→Excel編集までの統合テストは可能です。
- **一時ファイル**: `/tmp`ディレクトリに一時ファイルが作成され、処理完了後に自動削除されます。
- **エラー時のDB保存**: エラー発生時も`processed_files`テーブルにエラー情報が保存されることを確認してください。
- **取引先データ**: `companies`テーブルに「ネクストビッツ」「オフ・ビート・ワークス」が存在し、`template_excel`が登録されていることを前提としています。
- **サーバー起動**: テスト実行前にバックエンドサーバー（localhost:3001）が起動している必要があります。

**テストカバレッジ（@9が作成）**
- POST /api/process/execute - PDF処理実行（正常系、companyIdなしエラー、pdfSlotsなしエラー、テンプレート未登録エラー、Pythonスクリプトエラー）
- GET /api/process/download/:processId/:fileType - 個別ファイルダウンロード（Excel、注文書PDF、検収書PDF、processIdなしエラー、fileTypeなしエラー、不正なfileTypeエラー）
- GET /api/process/download-zip/:processId - ZIP一括ダウンロード（正常系、processIdなしエラー、処理結果なしエラー）

**参考資料**
- API仕様書: `docs/api-specs/process-api.md`
- E2Eテスト仕様書: `docs/e2e-specs/process-e2e.md`（Phase 9で使用）

**次のステップ**
- @9が統合テストを作成し、すべてのテストケースが成功することを確認
- Phase 8（API統合）でフロントエンドと連携

---

### P-003: 処理履歴ページ - モックサービスをSupabase APIに置き換え

**現状（Phase 4完了）**:
- HTMLモックアップ完成
- React実装完成（最終更新: 2025-12-04）
- モックサービス実装完成
- API仕様書作成完了（`docs/phase4_p003_api_spec.md`）
- E2Eテスト仕様書作成完了（`docs/phase4_p003_e2e_spec.md`）
- UI改善完了:
  - タブ表示（生成ファイル/使用したファイル）
  - ファイルダウンロードUIをアイコン付きリンク風に統一
  - P-005とデザイン統一（モーダル、処理情報表示）
  - DatePickerモバイルダイアログ日本語化
  - 処理時間フィールド削除
  - 処理詳細モーダルタイトルから会社名削除（「処理詳細」のみ）
  - 情報表示をコンパクト化（ラベルと値を横並びに）

**Phase 7での修正内容**:
- Supabase PostgreSQLでprocessed_filesテーブルを操作
- RLS設定（全ユーザーが全データ閲覧可能）
- ファイルダウンロード実装（BYTEA型からBlob変換）
- ZIP生成機能実装（バックエンド）
- 使用したファイル（入力PDF）をBYTEA型で保存
- エラー詳細情報（error_code, error_detail, error_stacktrace）を保存

**関連ファイル**:
- `frontend/src/services/mock/historyService.ts` - モックをSupabase API呼び出しに置き換え
- `backend/src/controllers/historyController.ts` - 処理履歴API実装（Phase 7で作成）
- `backend/src/routes/history.ts` - 処理履歴ルート（Phase 7で作成）
- `docs/api-specs/history-api.md` - API仕様書（Phase 7で参照）
- `docs/e2e-specs/history-e2e.md` - E2Eテスト仕様書（Phase 9で参照）
- `docs/phase4_p003_summary.md` - 実装完了報告書

### P-004: ユーザー管理ページ - 招待機能の修正

**現状（Phase 4完了）**:
- React実装完成（最終更新: 2025-12-04）
- モックサービス実装完成
- API仕様書作成完了
- E2Eテスト仕様書作成完了
- 保護機能実装完了:
  - 自分自身のロール変更禁止（ダイアログ表示: 「自分自身のロールは変更できません。他の管理者に依頼してください。」）
  - 最終管理者の削除/降格ブロック
  - 既存ユーザーへの招待ブロック（「このメールアドレスは既に登録されています」）
  - 削除済みユーザーへの再招待は許可
- ロール変更時の認証ストア同期（変更後の再ログイン時に正しいロールを反映）
- 削除ダイアログのレスポンシブ対応（ボタン縦並び）
- **モック動作の制限**: 「新規ユーザーを招待」ボタンクリック時、即座にユーザーが作成される（Phase 7で正しいフローに修正）

**Phase 7での修正内容**:
- Supabase Authの招待機能を実装
- 正しいフロー：
  1. 「新規ユーザーを招待」→ 招待メール送信のみ（ユーザー未作成）
  2. ユーザー一覧には表示されない
  3. 招待メール内のリンククリック → P-001b（招待受諾ページ）
  4. パスワード設定完了時 → 初めてユーザーが作成され、ユーザー一覧に表示

**関連ファイル**:
- `frontend/src/services/mock/usersService.ts` - モックをSupabase API呼び出しに置き換え
- `backend/src/controllers/usersController.ts` - 招待API実装（Phase 7で作成）
- `docs/api-specs/users-api.md` - API仕様書（Phase 7で参照）
- `docs/e2e-specs/users-e2e.md` - E2Eテスト仕様書（Phase 9で参照）

### P-002: PDF処理実行ページ

**現状（Phase 4完了）**:
- React実装完成（最終更新: 2025-12-04）
- モックサービス実装完成
- API仕様書作成完了
- E2Eテスト仕様書作成完了
- UI改善完了:
  - PDFスロット管理（4種類のPDFスロット、OK/未設定表示）
  - ドラッグ&ドロップUI（オーバーレイ表示）
  - 取引先自動判別（ネクストビッツ: TRR-、オフ・ビート・ワークス: offbeat-to-terra）
  - 取引先混在検知
  - Excelテンプレート検証（ファイル名に取引先名必須）
  - 処理完了時のFadeアニメーション
  - ナビゲーション警告ダイアログ（サイドバー・戻るボタン両方をブロック）
  - レスポンシブ対応（取引先表示の段落分け、アラートメッセージの折り返し、フォントサイズ調整）

**Phase 7での修正内容**:
- Python PDF解析（pdfplumber）実装
- Excel自動編集（openpyxl）実装
- PDF生成（LibreOffice）実装
- 処理結果をDBに保存

**関連ファイル**:
- `frontend/src/services/mock/processService.ts` - モックをバックエンドAPIに置き換え
- `backend/src/controllers/processController.ts` - 処理API実装（Phase 7で作成）
- `backend/python/pdf_parser.py` - PDF解析（Phase 7で作成）
- `backend/python/excel_editor.py` - Excel編集（Phase 7で作成）
- `backend/python/pdf_generator.py` - PDF生成（Phase 7で作成）
- `docs/api-specs/process-api.md` - API仕様書（Phase 7で参照）
- `docs/e2e-specs/process-e2e.md` - E2Eテスト仕様書（Phase 9で参照）

### P-005: 取引先設定ページ

**現状（Phase 4完了）**:
- React実装完成（最終更新: 2025-12-04）
- モックサービス実装完成
- API仕様書作成完了
- E2Eテスト仕様書作成完了
- UI改善完了:
  - 取引先詳細ダイアログにタイトル「取引先詳細」追加
  - タブ構成: 3タブ（基本情報、テンプレート、処理ルール）
  - ダイアログボタンのレスポンシブブレークポイント修正（sm:600px以下で縦並び）
  - テンプレートアップロードのドラッグ&ドロップ対応

**Phase 7での修正内容**:
- Supabase PostgreSQLでcompaniesテーブルを操作
- テンプレートExcelのBYTEA型保存/取得
- 取引先の有効/無効切り替え

**関連ファイル**:
- `frontend/src/services/mock/companiesService.ts` - モックをSupabase APIに置き換え
- `backend/src/controllers/companiesController.ts` - 取引先API実装（Phase 7で作成）
- `docs/api-specs/companies-api.md` - API仕様書（Phase 7で参照）
- `docs/e2e-specs/companies-e2e.md` - E2Eテスト仕様書（Phase 9で参照）

---

## 6. 付録

### 開発フロー
```
Phase 1: 要件定義 → Phase 2: Git管理 → Phase 3: フロントエンド基盤 → Phase 4: ページ実装
→ Phase 5: 環境構築 → Phase 6: バックエンド計画 → Phase 7: バックエンド実装
→ Phase 8: API統合 → Phase 9: E2Eテスト → Phase 10: デプロイメント

※ サポートツールは必要に応じて適宜使用
```

### 開始手順

開発プロンプトをクリックして「Phase 1: 要件定義」を選択し、要件定義エンジニアを活用するところから始めてください。各フェーズが完了したら、次のPhaseへ進みます。

サポートツールは開発中の任意のタイミングで、問題解決や品質向上のために使用できます。
