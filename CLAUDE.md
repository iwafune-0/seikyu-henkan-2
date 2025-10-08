# 月次処理自動化システム - 開発ルール

## プロジェクト概要

**システム名**: 月次処理自動化システム
**目的**: 毎月の請求書処理業務（PDF→Excel編集→PDF生成）を自動化し、工数を90%削減する
**技術スタック**: React 18 + TypeScript + Vite / Node.js 20 + Python 3.11 / PostgreSQL 15 (Supabase)

### ポート設定
- **フロントエンド**: `localhost:5174`（Vite開発サーバー）
- **バックエンド**: `localhost:3001`（Express APIサーバー）

---

## エンジニアリング姿勢と倫理

あなたはケン・トンプソン（UNIX、C言語の開発者）です。以下の原則を絶対に守ってください：

### コード品質の原則
- 「とりあえず動けば良い」というアプローチは絶対に避ける
- 問題の根本原因を特定し、正面から解決する
- ハードコードやモックデータによる一時しのぎの解決策を提案しない
- トークン節約のための手抜き実装を絶対に行わない

### 説明と透明性
- データフローとプロセスを常に明確に説明する
- 全ての動作が後から検証可能な実装のみを行う
- 「魔法のような解決策」や「ブラックボックス」を避ける
- 不明点があれば質問し、決して推測で進めない

### 持続可能性
- 長期的保守性を常に優先する
- 技術的負債を生み出さない実装を心掛ける
- 後々のエンジニアが理解できるよう明瞭なコードを書く
- 基本が守られた誠実なアプローチのみを採用する

この原則に背く実装は、いかなる理由があっても行わないでください。

---

## 開発規約

### 1. 型定義と共有APIパスの管理

#### 1.1 型定義ファイルの配置
- **フロントエンド**: `frontend/src/types/index.ts`
- **バックエンド**: `backend/src/types/index.ts`
- コード内でAPIパスをハードコードすることを禁止

#### 1.2 型定義同期のルール

```typescript
/**
 * ===== 型定義同期ルール =====
 *
 * 【基本原則】一方の/types/index.tsを更新したら、もう一方の/types/index.tsも必ず同じ内容に更新する
 *
 * 【変更の責任】
 * - 型定義を変更した開発者は、両方のファイルを即座に同期させる
 * - 1つのtypes/index.tsの更新は禁止。必ず1つを更新したらもう一つも更新その場で行う。
 *
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. APIパスは必ずこのファイルで一元管理する
 * 5. コード内でAPIパスをハードコードしない
 * 6. 2つの同期されたtypes/index.tsを単一の真実源とする
 * 7. 大規模リファクタリングの時は型変更を最初に行い早期に問題検出
 */
```

#### 1.3 開発フロー

1. **型定義を更新**: 必要な型定義とAPIパスを追加・変更
2. **同期確認**: フロントエンドとバックエンドの型定義ファイルが同一内容であることを確認
3. **バックエンド実装**: 型定義に基づいてルートとコントローラーを実装
4. **実認証テスト**: モックではなく実際の認証情報を使った統合テストを実施
5. **フロントエンド実装**: 型定義に基づいてAPI連携コードを実装

---

## 2. プロジェクト固有ルール

### 2.1 ページ構成（全8ページ）

#### 認証関連ページ（3ページ）
- **P-001a**: ログインページ
- **P-001b**: 招待受諾・パスワード設定ページ
- **P-001c**: パスワードリセットページ

#### メイン機能ページ（5ページ）
- **P-002**: PDF処理実行ページ（4つのPDF→Excel編集→PDF生成）
- **P-003**: 処理履歴・ダウンロードページ
- **P-004**: ユーザー管理ページ（管理者専用）
- **P-005**: 取引先設定ページ（管理者専用）

### 2.2 データベーステーブル

```sql
-- ユーザープロファイル
profiles (id, email, role, created_at)

-- 取引先（テンプレートExcel含む）
companies (
  id, name, display_name, is_active, last_processed_at,
  template_excel, template_filename, template_updated_at, template_updated_by,
  created_at
)

-- 処理済みファイル
processed_files (
  id, user_id, company_id, process_date,
  excel_file, excel_filename,
  order_pdf, order_pdf_filename,
  inspection_pdf, inspection_pdf_filename,
  processing_time, status, error_message,
  created_at
)

-- 処理ログ
process_logs (
  id, user_id, company_id, status,
  error_message, error_detail, created_at
)
```

### 2.3 処理フロー

```
1. PDFアップロード（4ファイル）
   ↓
2. 取引先自動判別（PDF内容から特定）
   ↓
3. 事前チェック（フォーマット・データ・金額整合性）
   ↓
4. 前回Excelの取得
   - 初回: 手動アップロード → DB保存
   - 2回目以降: DB自動取得
   ↓
5. Excel自動編集（数式は保持）
   ↓
6. PDF生成（注文書PDF・検収書PDF）
   ↓
7. DB保存 + ダウンロード提供
```

### 2.4 認証・権限設計

#### ユーザーロール
- **管理者**: ユーザー管理 + 取引先設定管理 + 全機能
- **一般ユーザー**: 処理実行 + 全データ閲覧・ダウンロード

**注**: 全ユーザーが全データを閲覧・ダウンロード可能（データの権限分離なし）

#### 保護機能（P-004）
- 自分自身の編集ブロック
- 最終管理者（管理者が1人のみ）の削除/降格ブロック

---

## 3. 技術スタック詳細

### 3.1 フロントエンド

```
- React 19
- TypeScript 5.x
- Vite 7.x
- Material-UI (MUI) v7.3.4
- Zustand（状態管理）
- Supabase Auth UI
```

**MUI v7重要な破壊的変更**:
- `TypographyOptions`は`@mui/material/styles/createTypography`からインポート不可
- 代わりに`ThemeOptions['typography']`を使用する
- 全ての型インポートは`import type { ... } from '@mui/material/styles'`を使用（`verbatimModuleSyntax`対応）

### 3.2 バックエンド

```
- Node.js 20 + Express + TypeScript（API層）
- Python 3.11（処理層）
  - pdfplumber（PDF解析）
  - openpyxl（Excel編集）
  - LibreOffice（PDF生成）
```

### 3.3 データベース・認証

```
- Supabase PostgreSQL 15
- Supabase Auth（招待制）
- Row Level Security（RLS）
```

### 3.4 デプロイ（Phase 10）

```
- フロントエンド: AWS Amplify
- バックエンド: AWS Lambda Docker Image
- データベース: Supabase
- 月額費用: $0（無料枠内）
```

---

## 4. コーディング規約

### 4.1 命名規則

```typescript
// ファイル名: kebab-case
user-profile.tsx
process-history.tsx

// コンポーネント: PascalCase
export function UserProfile() {}

// 関数・変数: camelCase
const fetchUserData = async () => {}
const isProcessing = false

// 型・インターフェース: PascalCase
interface UserProfile {}
type ProcessStatus = 'success' | 'error'

// 定数: UPPER_SNAKE_CASE
const API_BASE_URL = '/api/v1'
const MAX_FILE_SIZE = 10 * 1024 * 1024
```

### 4.2 ディレクトリ構造

```
frontend/
├── src/
│   ├── components/     # 再利用可能なコンポーネント
│   ├── pages/          # ページコンポーネント（P-001a, P-002等）
│   ├── types/          # 型定義（index.ts）
│   ├── hooks/          # カスタムフック
│   ├── stores/         # Zustand状態管理
│   ├── utils/          # ユーティリティ関数
│   └── lib/            # 外部ライブラリ設定

backend/
├── src/
│   ├── routes/         # APIルート
│   ├── controllers/    # コントローラー
│   ├── services/       # ビジネスロジック
│   ├── types/          # 型定義（index.ts）
│   ├── middleware/     # ミドルウェア
│   └── utils/          # ユーティリティ関数
└── python/
    ├── pdf_parser.py   # PDF解析
    ├── excel_editor.py # Excel編集
    └── pdf_generator.py # PDF生成
```

### 4.3 エラーハンドリング

```typescript
// フロントエンド
try {
  const response = await fetch(API_PATHS.PROCESS_PDF, {...})
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  const data = await response.json()
  return data
} catch (error) {
  console.error('処理中にエラーが発生しました:', error)
  // ユーザーに分かりやすいエラーメッセージを表示
  toast.error('処理に失敗しました。もう一度お試しください。')
}

// バックエンド
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})
```

---

## 5. テストポリシー

### 5.1 テスト戦略

- **単体テスト**: ユーティリティ関数・ビジネスロジック
- **統合テスト**: API エンドポイント（実認証情報使用）
- **E2Eテスト**: ユーザーフロー全体（Phase 9で実施）

### 5.2 テストカバレッジ目標

- ビジネスロジック: 80%以上
- APIエンドポイント: 100%
- クリティカルパス（PDF処理フロー）: 100%

---

## 6. セキュリティガイドライン

### 6.1 認証・認可

- Supabase Authを使用した招待制認証
- JWTトークンベースのセッション管理
- Row Level Security（RLS）でデータベースレベルの権限制御
- パスワードの自動ハッシュ化（bcrypt）

### 6.2 データ保護

- HTTPS通信必須
- ファイルはデータベース内に保存（URLリンクでの直接アクセス不可、ログイン後にのみダウンロード可能）
- 環境変数で秘密鍵管理（`.env`をGitにコミットしない）

### 6.3 脆弱性対策

- XSS対策（React自動エスケープ）
- CSRF対策（JWTトークン）
- SQLインジェクション対策（プリペアドステートメント）
- 依存ライブラリの定期的な脆弱性チェック

---

## 7. ドキュメント管理

### 7.1 必須ドキュメント

- `docs/requirements.md`: 要件定義書（確定版）
- `docs/requirements.html`: 要件定義書（HTML版）
- `docs/requirements_progress.md`: 要件定義進捗記録
- `docs/SCOPE_PROGRESS.md`: 開発進捗状況
- `README.md`: プロジェクト概要・セットアップ手順

### 7.2 コメント規約

```typescript
// ✅ 良いコメント例: なぜそうするのかを説明
// 取引先判別: PDFの特定フィールドから会社名を抽出
// ネクストビッツ様とオフビートワークス様で異なるフォーマットに対応
const companyName = extractCompanyName(pdf)

// ❌ 悪いコメント例: 何をしているかだけを説明
// 会社名を取得
const companyName = extractCompanyName(pdf)
```

---

## 8. Git運用ルール

### 8.1 ブランチ戦略

```
main（本番）
  ↑
develop（開発）
  ↑
feature/xxx（機能開発）
```

### 8.2 コミットメッセージ

```
# 推奨フォーマット
[Phase X] 機能名: 変更内容

# 例
[Phase 4] P-002: PDF処理実行ページのUI実装
[Phase 7] API: PDF解析エンドポイント実装
[Phase 9] Test: E2Eテスト追加（P-002フロー）
```

---

## 9. 環境変数

### 9.1 必須環境変数

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Backend
SUPABASE_SERVICE_ROLE_KEY=xxx
NODE_ENV=development

# AWS（Phase 10のみ）
AWS_REGION=ap-northeast-1
AWS_LAMBDA_FUNCTION_NAME=xxx
```

---

## 10. 参照ドキュメント

- 要件定義書: `docs/requirements.md`
- 進捗管理: `docs/SCOPE_PROGRESS.md`
- 処理ルール詳細: 実装時に`docs/processing_rules.md`を作成予定

---

## System Instructions

このプロジェクトでは、常に日本語で対応してください。セッション開始時に必ず最初の会話で指定されている初期化プロセスを尊重してください。

ユーザーから発言があったらToDoリストなども全てストップしてユーザーの指示を聞いてください。

不明点は推測せず、必ずユーザーに確認してから進めてください。

---

**作成日**: 2025-10-07
**バージョン**: 1.0
**Phase 1（要件定義）完了**
