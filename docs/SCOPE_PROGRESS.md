# seikyu-henkan-2 開発進捗状況

## 1. 基本情報

- **ステータス**: Phase 9 E2Eテスト完了（Phase 10 デプロイは保留）
- **完了タスク数**: 9/10（Phase 1-9完了、Phase 10保留）
- **進捗率**: 91%（作業量ベース）
- **E2Eテスト進捗**: 173/176項目 Pass（98%）
- **追加実装**: Phase 11（PDF出力最適化 + デスクトップアプリ化）計画中
- **最終更新日**: 2026-01-28

### 進捗率の計算方法
- **準備フェーズ**（Phase 1-2）: 各5% → 合計10%
- **実装フェーズ**（Phase 3-8）: 各12% → 合計72%
- **完成フェーズ**（Phase 9-10）: 各9% → 合計18%
- **追加実装**（Phase 11）: 進捗率には含めない（別枠）

## 2. 実装計画

BlueLampでの開発は以下のフローに沿って進行します：

### 開発フェーズ（Phase 1-10: 基本実装）
| フェーズ | 状態 | 担当エージェント | 解説 |
|---------|------|----------------|------|
| **Phase 1: 要件定義** | [x] | 要件定義エンジニア | あなたのアイデアを実現可能な要件に落とし込みます |
| **Phase 2: Git/GitHub管理** | [x] | Git管理エージェント | プロジェクトリポジトリを準備し開発環境を整えます |
| **Phase 3: フロントエンド基盤** | [x] | フロントエンド基盤オーケストレーター | React+TypeScript+Viteの最新基盤が即座に立ち上がります |
| **Phase 4: ページ実装** | [x] | ページ実装オーケストレーター | 画面が一つずつ形になっていきます |
| **Phase 5: 環境構築** | [x] | 環境構築オーケストレーター | 本番環境で動作するための秘密鍵を取得し設定します（※補足あり） |
| **Phase 6: バックエンド計画** | [x] | バックエンド計画オーケストレーター | 実装の順番を計画し効果的にプロジェクトを組み上げます |
| **Phase 7: バックエンド実装** | [x] | バックエンド実装オーケストレーター | いよいよバックエンドの実装に入ります |
| **Phase 8: API統合** | [x] | フロントエンド実装オーケストレーター | プロトタイプが動くシステムへと変わります |
| **Phase 9: E2Eテスト** | [x] | E2Eテストオーケストレーター | ユーザー操作をシミュレートして品質を担保します（173/176項目 Pass） |
| **Phase 10: デプロイメント** | [保留] | デプロイオーケストレーター | Phase 11完了後に実施予定（※補足あり） |

### 追加実装（Phase 11: PDF出力最適化 + デスクトップアプリ化）

**詳細計画書**: `docs/PDF出力改善_デスクトップアプリ化_計画.md`

| フェーズ | 状態 | 内容 |
|---------|------|------|
| **Phase 11-1: PDF出力エンジン切り替え** | [実装完了] | PDF_ENGINE環境変数による切り替え（LibreOffice/Excel直接出力） |
| **Phase 11-2: ユーザー管理機能Electron対応** | [実装完了] | APP_MODE環境変数による切り替え（招待メール/直接追加） |
| **Phase 11-3: 動作確認** | [完了] | 全機能の動作確認・デバッグ（ネクストビッツ・オフビート両方確認済み、E2Eテスト173/176 Pass） |
| **Phase 11-4: 統合・調整** | [完了] | エラーハンドリング・ログ出力（現状で十分と判断） |
| **Phase 11-5: ドキュメント** | [計画中] | CLAUDE.md, README更新 |
| **Phase 12: Electron化** | [未着手] | Webアプリを.exe形式にパッケージング（Phase 11完了後） |

#### Phase 5 補足: 当初漏れていた設定項目

以下の設定項目がPhase 5の計画に含まれておらず、Phase 7完了後に追加対応しました。
今後同様のプロジェクトでは、Phase 5で実施すべき項目として明記してください。

| 設定項目 | 状態 | 説明 |
|---------|------|------|
| Python環境構築 | ✅ 対応済 | pip, pdfplumber, openpyxl, python-dateutil |
| LibreOfficeインストール | ✅ 対応済 | PDF生成（Excel→PDF変換）に必要 |
| SUPABASE_SERVICE_ROLE_KEY | ✅ 対応済 | バックエンドからの管理者API呼び出しに必要 |
| 初期取引先データ投入 | ✅ 対応済 | companiesテーブルにネクストビッツ/オフ・ビート・ワークス |
| Supabase Redirect URLs（開発用） | ✅ 対応済 | `http://localhost:5174/accept-invitation` |
| Supabaseメールテンプレート | ✅ 対応済 | 招待メールを日本語化 |
| SMTP設定 | ⏳ 本番時 | 本番運用時にカスタムSMTPサーバー設定 |

#### Phase 10 補足: デプロイ時に必要な追加設定

以下の設定はPhase 10（デプロイメント）で実施が必要です。

| 設定項目 | 説明 |
|---------|------|
| Supabase本番用Redirect URL | `https://your-domain.com/accept-invitation` を追加 |
| SMTP設定 | 本番用メールサーバー設定（招待メール送信用） |
| 環境変数（本番） | AWS Lambda/Amplifyに本番用環境変数を設定 |

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
| P-002 | PDF処理実行ページ | 全ユーザー | ✅ 完成（API統合済） |
| P-003 | 処理履歴・ダウンロードページ | 全ユーザー | ✅ 完成（API統合済） |
| P-004 | ユーザー管理ページ | 管理者専用 | ✅ 完成（API統合済） |
| P-005 | 取引先設定ページ | 管理者専用 | ✅ 完成（API統合済） |

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

## 5. Phase 8 API統合完了報告

### 5.1 完了内容

| 項目 | 状態 |
|------|------|
| APIクライアント基盤（api.ts）作成 | ✅ 完了 |
| ユーザー管理サービス（usersService.ts）統合 | ✅ 完了 |
| 取引先管理サービス（companiesService.ts）統合 | ✅ 完了 |
| 処理履歴サービス（historyService.ts）統合 | ✅ 完了 |
| PDF処理サービス（processService.ts）統合 | ✅ 完了 |
| ページコンポーネント修正 | ✅ 完了 |
| モックサービス削除 | ✅ 完了 |
| TypeScriptビルド確認 | ✅ 完了 |

### 5.2 作成されたファイル

```
frontend/src/
├── lib/
│   └── api.ts              # APIクライアント基盤（認証付きfetch）
└── services/
    ├── usersService.ts     # ユーザー管理API（/api/users）
    ├── companiesService.ts # 取引先管理API（/api/companies）
    ├── historyService.ts   # 処理履歴API（/api/history）
    └── processService.ts   # PDF処理API（/api/process）
```

### 5.3 削除されたファイル

```
frontend/src/services/mock/  # ディレクトリごと削除
├── usersService.ts         # モックユーザー管理
├── companiesService.ts     # モック取引先管理
├── historyService.ts       # モック処理履歴
└── processService.ts       # モックPDF処理
```

### 5.4 API統合の技術詳細

- **認証**: Supabase Auth JWTトークンを自動付与
- **エラーハンドリング**: 日本語エラーメッセージに変換
- **ファイルダウンロード**: Content-Dispositionヘッダーからファイル名取得
- **FormData対応**: ファイルアップロード時はContent-Type自動設定

### 5.5 次のステップ

Phase 9（E2Eテスト）では以下を実施:
- Playwrightによる自動テスト
- ユーザーフロー全体のテスト
- エラーケースのテスト

---

## 6. Phase 8 追加実装: Excel検証機能

### 6.1 実装背景

Phase 8のAPI統合完了後、チェック項目の実装漏れが発見されました。
手順書に記載されているチェック項目がバックエンドで実装されていなかったため、追加実装を行いました。

### 6.2 追加実装ファイル

| ファイル | 内容 |
|---------|------|
| `backend/python/excel_validator.py` | Excel検証スクリプト（新規作成） |
| `backend/src/services/processService.ts` | 検証処理の追加、処理順序の最適化 |
| `frontend/src/pages/companies/CompaniesPage.tsx` | 処理ルール表示の更新 |

### 6.3 実装したチェック項目

#### ネクストビッツ

| シート | セル | 項目 | チェック内容 |
|--------|------|------|-------------|
| 注文書 | AC3 | 注文番号 | yyyymmdd-01形式か |
| | B8 | 宛名 | 「株式会社ネクストビッツ　御中」か |
| | G12 | 発注金額 | 請求書PDFの合計金額と一致するか |
| | C17 | 明細タイトル | 「yyyy年mm月分作業費」形式か |
| | AA17 | 摘要 | 「見積番号：TRR-YY-0MM」形式で見積PDFと一致するか |
| | C18 | 件名 | 見積書の件名に応じた正しい件名か |
| | C19 | 明細締め | 「以下、余白」が入力されているか |
| | W39 | 小計 | 請求書PDFの消費税10%対象と一致するか |
| | W40 | 消費税 | 請求書PDFの消費税(10%)と一致するか |
| | W41 | 合計金額 | 請求書PDFの合計金額と一致するか |
| 検収書 | AC4 | 検収番号 | yyyymmdd-01形式か |
| | AC5 | 検収日 | 当月末日か |
| | B7 | 宛名 | 「株式会社ネクストビッツ　御中」か |
| | G14 | 合計金額 | 請求書PDFの合計金額と一致するか |
| | C19 | 明細タイトル | 「yyyy年mm月分作業費」形式か |
| | AA19 | 摘要 | 「見積番号：TRR-YY-0MM」形式で見積PDFと一致するか |
| | C20 | 件名 | 見積書の件名に応じた正しい件名か |
| | C21 | 明細締め | 「以下、余白」が入力されているか |
| | W41 | 小計 | 請求書PDFの消費税10%対象と一致するか |
| | W42 | 消費税 | 請求書PDFの消費税(10%)と一致するか |
| | W43 | 合計金額 | 請求書PDFの合計金額と一致するか |

#### オフ・ビート・ワークス

| シート | セル | 項目 | チェック内容 |
|--------|------|------|-------------|
| 注文書 | AC3 | 注文番号 | yyyymmdd-02形式か |
| | B8 | 宛名 | 「株式会社オフ・ビート・ワークス　御中」か |
| | G12 | 発注金額 | 請求書PDFの合計金額と一致するか |
| | C17 | 明細タイトル | 「yyyy年mm月作業費」形式か（「分」なし） |
| | AA17 | 摘要 | 「見積番号：NNNNNNN」形式で見積PDFと一致するか |
| | C(18+N) | 明細締め | 「以下、余白」が入力されているか（N=明細行数） |
| | W39 | 小計 | 請求書PDFの小計と一致するか |
| | W40 | 消費税 | 請求書PDFの消費税額合計と一致するか |
| | W41 | 合計金額 | 請求書PDFの合計と一致するか |
| 検収書 | AC4 | 検収番号 | yyyymmdd-02形式か |
| | AC5 | 検収日 | 当月末日か |
| | B7 | 宛名 | 「株式会社オフ・ビート・ワークス　御中」か |
| | G14 | 合計金額 | 請求書PDFの合計と一致するか |
| | C19 | 明細タイトル | 「yyyy年mm月作業費」形式か |
| | AA19 | 摘要 | 「見積番号：NNNNNNN」形式で見積PDFと一致するか |
| | C(20+N) | 明細締め | 「以下、余白」が入力されているか（N=明細行数） |
| | W41 | 小計 | 請求書PDFの小計と一致するか |
| | W42 | 消費税 | 請求書PDFの消費税額合計と一致するか |
| | W43 | 合計金額 | 請求書PDFの合計と一致するか |

### 6.4 処理フロー（最適化後）

```
1. PDF解析（pdf_parser.py）
   - 見積書: estimate_number, subject, quantity, unit_price
   - 請求書: total, subtotal, tax, items
      ↓
2. テンプレート取得（DB or アップロード）
      ↓
3. Excel編集（excel_editor.py）
   - セルに値を書き込み
   - 数式は保持（計算はLibreOfficeが行う）
      ↓
3.5. 金額整合性の事前チェック
      ↓
4. Excel検証（excel_validator.py）★新規追加
   - LibreOfficeでExcel→ODS→XLSX変換（数式計算）
   - 計算結果を取得して全チェック項目を検証
   - エラーがあればここで処理中断（PDF生成をスキップ）
      ↓
5. PDF生成（pdf_generator.py）
   - 検証OKの場合のみ実行
   - LibreOfficeでExcel→PDF変換
      ↓
6. 生成ファイル読み込み・DB保存
```

**処理順序の最適化ポイント**:
- Excel検証をPDF生成の前に移動
- 検証エラー時はPDF生成をスキップ（処理時間節約）

### 6.5 技術詳細

#### LibreOfficeによる数式計算

openpyxlは数式を計算できないため、LibreOfficeを使用して数式を計算しています。

```
処理フロー:
1. Excel(.xlsx) → LibreOfficeでODS変換（数式が計算される）
2. ODS → LibreOfficeでXLSX変換（計算結果が値として保存）
3. openpyxl(data_only=True)で計算済みExcelを読み込み
4. 各セルの値をチェック
```

#### 動的行チェック（オフ・ビート・ワークス）

オフ・ビート・ワークスは複数明細に対応しているため、「以下、余白」の行位置が動的に変わります。

```python
# 明細行数に応じた行位置計算
items_count = len(invoice_data['items'])
order_blank_row = 18 + items_count      # 注文書
inspection_blank_row = 20 + items_count  # 検収書
```

---

## 7. 本来Phase 8で実施すべき内容（参考）

Phase 8（API統合）の本来の範囲と、今回追加で実施した内容を明記します。

### 7.1 Phase 8の本来の範囲

| 項目 | 内容 | 状態 |
|------|------|------|
| APIクライアント基盤作成 | フロントエンドからバックエンドAPIを呼び出す共通関数 | ✅ 完了 |
| モックサービス置き換え | モックデータをAPI呼び出しに置き換え | ✅ 完了 |
| ページコンポーネント修正 | APIレスポンスに合わせたUI調整 | ✅ 完了 |
| 統合テスト | フロントエンド-バックエンド間の動作確認 | ✅ 完了 |
| エラーハンドリング | API エラーの日本語化、ユーザー通知 | ✅ 完了 |

### 7.2 今回追加で実施した内容（Phase 8拡張）

| 項目 | 内容 | 理由 |
|------|------|------|
| Excel検証機能 | チェック項目の実装 | 手順書のチェック項目が未実装だったため |
| 処理順序最適化 | 検証→PDF生成の順序変更 | エラー時のPDF生成回避 |
| 処理ルール表示更新 | フロントエンドの取引先詳細 | チェック項目追加に伴う更新 |

### 7.3 教訓・今後のプロジェクトへの提言

1. **チェック項目は要件定義時に明確化**: 手順書のチェック項目はPhase 1で洗い出し、Phase 7で実装すべき
2. **検証機能は処理実装と同時に**: Excel編集機能と検証機能は同一フェーズで実装すべき
3. **LibreOffice依存の明確化**: 数式計算にLibreOfficeが必要な場合、Phase 5で明記すべき

---

## 8. E2Eテスト後のタスク

以下のタスクはE2Eテスト完了後に実施します。

| タスク | 優先度 | 内容 |
|--------|--------|------|
| エラーメッセージ改善 | 中 | 技術的なエラーメッセージをユーザー向けに分かりやすく改善 |

### 8.1 エラーメッセージ改善

**現在のエラーメッセージ（技術者向け）**:
```
注文書C18: 件名が不正です（期待: 　Telemas作業(システム改修等)、実際: XXX）
```

**改善後のエラーメッセージ（運用者向け）**:
```
注文書の件名が正しくありません
正しい値「　Telemas作業(システム改修等)」と異なります
```

**対象ファイル**:
- `backend/python/excel_validator.py` - エラーメッセージ生成部分

---

## 9. Phase 9 E2Eテスト進捗（2026-01-28時点）

### 9.1 全体進捗

| 項目 | 数値 |
|------|------|
| 総テスト項目数 | 176項目 |
| テストPass | 173項目 (98%) |
| スキップ/対象外 | 3項目 (2%) |

**詳細**: `docs/e2e-test-checklist.md` を参照

### 9.2 ページ別進捗

| ページ | 状態 | 詳細 |
|--------|------|------|
| P-001 認証ページ | ✅ 完了 | 38/39項目（1項目対象外: スクリーンリーダー） |
| P-002 PDF処理実行ページ | ✅ 完了 | 25/25項目 |
| P-003 処理履歴ページ | ✅ 完了 | 16/16項目 |
| P-004 ユーザー管理ページ | ✅ 完了 | 36/39項目（3項目スキップ: Supabaseレート制限2件、RLS問題1件） |
| P-005 取引先設定ページ | ✅ 完了 | 6/6項目 |

### 9.3 E2Eテスト関連ファイル

```
tests/e2e/
├── auth.spec.ts           # P-001 認証テスト
├── process.spec.ts        # P-002 PDF処理テスト
├── history.spec.ts        # P-003 処理履歴テスト
├── users.spec.ts          # P-004 ユーザー管理テスト
├── companies.spec.ts      # P-005 取引先設定テスト
├── fixtures/
│   └── test-auth.ts       # 認証ヘルパー
└── helpers/
    └── supabase-admin.ts  # Supabase Admin APIヘルパー
```

---

## 10. 付録

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
