# 月次処理自動化システム

毎月の請求書処理業務（PDF→Excel編集→PDF生成）を自動化し、工数を90%削減するWebアプリケーション

---

## 📋 プロジェクト概要

### 目的
毎月25日～翌月5日に受領する4種類のPDF（見積書・請求書・注文請書・納品書）を自動処理し、取引先ごとのExcelファイル編集とPDF生成を自動化することで、月次業務の工数を90%削減する。

### 対象ユーザー
- 社内スタッフ（管理者・一般ユーザー）
- 招待制による限定的なアクセス

### 対象取引先
- **現在**: ネクストビッツ様、オフ・ビート・ワークス様
- **将来**: 追加可能な設計

---

## 🛠️ 技術スタック

### フロントエンド
- **React** 19
- **TypeScript** 5.x
- **Vite** 7.x
- **Tailwind CSS** 3.4.18
- **Zustand** (状態管理)
- **React Router** 7.x
- **Supabase Auth** (認証)

### バックエンド
- **Node.js** 20 + Express + TypeScript（API層）
- **Python** 3.11（処理層）
  - pdfplumber（PDF解析）
  - openpyxl（Excel編集）
  - PDF生成（PDF_ENGINEで切り替え）
    - LibreOffice（Linux/AWS Lambda向け）
    - Excel ExportAsFixedFormat（Windows社内配布向け）

### データベース・認証
- **PostgreSQL** 15（Supabase）
- **Supabase Auth**（招待制）
- **Row Level Security**（RLS）

### 配布方式（Phase 12で実装予定）
- **方式**: Electron（デスクトップアプリ）
- **形式**: .exe形式で社内配布
- **必須要件**: Microsoft Excel 2016以降（PDF生成に必要）
- **データベース**: Supabase（クラウド）
- **月額費用**: $0（無料枠内）

※当初予定のAWS Lambda + Amplifyデプロイは中止。Electronによる.exe配布に方針変更。

---

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/iwafune-0/seikyu-henkan-2.git
cd seikyu-henkan-2
```

### 2. フロントエンドの準備

```bash
cd frontend
npm install
```

### 3. 環境変数の設定

`frontend/.env` ファイルを作成し、以下を設定：

```bash
# Supabase設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```


### 4. バックエンドの準備

```bash
cd ../backend
npm install
```

### 5. Python環境の構築（必須）

PDF解析・Excel編集に必要なPythonパッケージをインストール：

```bash
# pipがインストールされていない場合
curl -sS https://bootstrap.pypa.io/get-pip.py | python3 - --user --break-system-packages

# PATHに追加（必要に応じて.bashrcに追記）
export PATH="$HOME/.local/bin:$PATH"

# Python依存パッケージのインストール
pip3 install -r backend/python/requirements.txt --break-system-packages
```

**インストールされるパッケージ**:
- `pdfplumber` - PDF解析
- `openpyxl` - Excel編集
- `python-dateutil` - 日付処理

**動作確認**:
```bash
python3 -c "import pdfplumber; import openpyxl; print('OK')"
```

### 5.1 PDF生成エンジンの準備

PDF生成（Excel→PDF変換）には以下のいずれかが必要です。

**A. Windows社内配布の場合（推奨）**: Microsoft Excel 2016以降
- Excel ExportAsFixedFormatを使用（高品質なPDF出力）
- `backend/.env`で`PDF_ENGINE=excel`を設定

**B. Linux/AWS Lambdaの場合**: LibreOffice
```bash
sudo apt-get update && sudo apt-get install -y libreoffice-calc
```
動作確認: `soffice --version`
- `backend/.env`で`PDF_ENGINE=libreoffice`を設定（デフォルト）

### 5.2 バックエンド環境変数の設定（必須）

`backend/.env.example`をコピーして`backend/.env`を作成し、以下を設定：

```bash
# Supabase設定（必須）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PDF出力エンジン（Windows社内配布の場合）
PDF_ENGINE=excel

# アプリケーションモード（Electron配布の場合）
APP_MODE=electron
```

**Supabase Service Role Keyの取得方法**:
1. https://supabase.com/dashboard にアクセス
2. プロジェクト選択 → **Settings** → **API**
3. **Project API keys** の `service_role` をコピー

**注意**: service_role keyは絶対に公開しないでください

### 5.3 Supabase招待メール設定（必須）

ユーザー招待機能を動作させるには、Supabaseダッシュボードで以下を設定：

#### Redirect URLs設定（必須）

1. https://supabase.com/dashboard にアクセス
2. プロジェクト選択 → **Authentication** → **URL Configuration**
3. **Redirect URLs** に以下を追加：
   - 開発環境: `http://localhost:5174/accept-invitation`
   - 本番環境: `https://your-domain.com/accept-invitation`（Phase 10で追加）

#### メールテンプレートの日本語化（任意）

1. **Authentication** → **Email Templates**
2. 「Invite user」テンプレートを編集：

```html
<h2>アカウント招待</h2>
<p>月次処理自動化システムへの招待を受け取りました。</p>
<p>以下のリンクをクリックしてパスワードを設定してください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードを設定する</a></p>
<p>このリンクは24時間で無効になります。</p>
```

#### SMTP設定（本番運用時に必要）

開発環境ではSupabase内蔵のメールサーバーを使用（1時間あたり4通まで）。
本番運用時は **Settings** → **Auth** → **SMTP Settings** でカスタムSMTPサーバーを設定。

### 6. 開発サーバーの起動

```bash
# フロントエンド（ポート5174）
cd frontend
npm run dev

# バックエンド（ポート3001）※別ターミナルで
cd backend
npm run dev
```

### 7. ブラウザでアクセス

```
http://localhost:5174
```

---

## 📦 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# TypeScript型チェック
npx tsc --noEmit

# 本番ビルド
npm run build

# ビルドプレビュー
npm run preview
```

---

## 📁 プロジェクト構成

```
seikyu-henkan-2/
├── frontend/                # フロントエンド (React + TypeScript)
│   ├── src/
│   │   ├── components/      # 再利用可能なコンポーネント
│   │   │   ├── auth/        # 認証関連
│   │   │   ├── layouts/     # レイアウト
│   │   │   └── navigation/  # ナビゲーション
│   │   ├── pages/           # ページコンポーネント
│   │   │   ├── auth/        # 認証ページ (P-001a/b/c)
│   │   │   ├── process/     # PDF処理 (P-002)
│   │   │   ├── history/     # 処理履歴 (P-003)
│   │   │   ├── users/       # ユーザー管理 (P-004)
│   │   │   └── companies/   # 取引先設定 (P-005)
│   │   ├── services/        # サービス層
│   │   │   └── mock/        # モックサービス (Phase 5以前)
│   │   ├── stores/          # Zustand状態管理
│   │   ├── types/           # TypeScript型定義
│   │   ├── lib/             # ライブラリ設定
│   │   └── App.tsx          # ルート設定
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                 # バックエンド (Phase 7以降)
│   ├── src/
│   │   ├── routes/          # APIルート
│   │   ├── controllers/     # コントローラー
│   │   ├── services/        # ビジネスロジック
│   │   ├── types/           # TypeScript型定義
│   │   └── middleware/      # ミドルウェア
│   └── python/              # Python処理層
│       ├── pdf_parser.py    # PDF解析
│       ├── excel_editor.py  # Excel編集
│       └── pdf_generator.py # PDF生成
│
├── docs/                    # ドキュメント
│   ├── requirements.md      # 要件定義書
│   ├── SCOPE_PROGRESS.md    # 開発進捗状況
│   ├── api-specs/           # API仕様書
│   ├── e2e-specs/           # E2Eテスト仕様書
│   ├── phase1_summary.md    # Phase 1完了報告
│   ├── phase2_summary.md    # Phase 2完了報告
│   ├── phase3_summary.md    # Phase 3完了報告
│   ├── phase4_summary.md    # Phase 4-A完了報告 (P-001)
│   ├── phase4_b_summary.md  # Phase 4-B完了報告 (ログイン状態保持)
│   ├── phase4_p004_summary.md # Phase 4-P004完了報告 (P-004)
│   └── phase4_p005_summary.md # Phase 4-P005完了報告 (P-005)
│
├── source/                  # サンプルPDF・Excel
│   ├── オフ・ビート・ワークス/
│   └── ネクストビッツ/
│
├── mockups/                 # HTMLモックアップ (Phase 4)
│   ├── UsersPage.html       # P-004モックアップ
│   └── CompanySettingsPage.html # P-005モックアップ
│
├── CLAUDE.md                # 開発ルール
└── README.md                # このファイル
```

---

## 🎯 機能一覧（全7ページ）

### 認証関連ページ（3ページ）

| ページID | ページ名 | URL | 権限 | 状態 |
|---------|---------|-----|------|------|
| P-001a | ログインページ | `/login` | ゲスト | ✅ 完成 |
| P-001b | 招待受諾・パスワード設定ページ | `/accept-invitation` | 招待リンク保有者 | ✅ 完成 |
| P-001c | パスワードリセットページ | `/reset-password` | ゲスト | ✅ 完成 |

### メイン機能ページ（4ページ）

| ページID | ページ名 | URL | 権限 | 状態 |
|---------|---------|-----|------|------|
| P-002 | PDF処理実行ページ | `/process` | 全ユーザー | ✅ 完成（API統合済） |
| P-003 | 処理履歴・ダウンロードページ | `/history` | 全ユーザー | ✅ 完成（API統合済） |
| P-004 | ユーザー管理ページ | `/users` | 管理者専用 | ✅ 完成（API統合済） |
| P-005 | 取引先設定ページ | `/companies` | 管理者専用 | ✅ 完成（API統合済） |

**補足**: `/` にアクセスすると、ログイン済みなら `/process`、未ログインなら `/login` にリダイレクト

---

## 📊 開発進捗

| Phase | 名称 | 状態 |
|-------|------|------|
| Phase 1 | 要件定義 | ✅ 完了 |
| Phase 2 | Git/GitHub管理 | ✅ 完了 |
| Phase 3 | フロントエンド基盤 | ✅ 完了 |
| Phase 4 | ページ実装 | ✅ 完了（全7ページ完成） |
| Phase 5 | 環境構築 | ✅ 完了 |
| Phase 6 | バックエンド計画 | ✅ 完了 |
| Phase 7 | バックエンド実装 | ✅ 完了 |
| Phase 8 | API統合 | ✅ 完了 |
| Phase 9 | E2Eテスト | ✅ 完了（173/176 Pass） |
| Phase 11 | PDF出力最適化 + Electron版機能準備 | ✅ 完了 |
| Phase 12 | Electron化 | ⏳ 未着手 |

※Phase 10（AWSデプロイ）は中止、Electron配布に方針変更

詳細は [docs/SCOPE_PROGRESS.md](docs/SCOPE_PROGRESS.md) を参照

---

## 📝 ドキュメント

### 主要ドキュメント
- [要件定義書](docs/requirements.md) - システム要件の詳細定義
- [開発進捗状況](docs/SCOPE_PROGRESS.md) - Phase別の進捗管理
- [開発ルール](CLAUDE.md) - コーディング規約・ガイドライン

### API・テスト仕様書
- [認証API仕様書](docs/api-specs/auth-api.md) - Supabase Auth API仕様
- [認証E2Eテスト仕様書](docs/e2e-specs/auth-e2e.md) - P-001のテスト項目
- [PDF処理API仕様書](docs/api-specs/process-api.md) - P-002 API仕様
- [PDF処理E2Eテスト仕様書](docs/e2e-specs/process-e2e.md) - P-002のテスト項目
- [処理履歴API仕様書](docs/api-specs/history-api.md) - P-003 API仕様
- [処理履歴E2Eテスト仕様書](docs/e2e-specs/history-e2e.md) - P-003のテスト項目
- [ユーザー管理API仕様書](docs/api-specs/users-api.md) - P-004 API仕様
- [ユーザー管理E2Eテスト仕様書](docs/e2e-specs/users-e2e.md) - P-004のテスト項目
- [取引先設定API仕様書](docs/api-specs/companies-api.md) - P-005 API仕様
- [取引先設定E2Eテスト仕様書](docs/e2e-specs/companies-e2e.md) - P-005のテスト項目

### Phase完了報告書
- [Phase 1完了報告](docs/phase1_summary.md)
- [Phase 2完了報告](docs/phase2_summary.md)
- [Phase 3完了報告](docs/phase3_summary.md)
- [Phase 4-A完了報告](docs/phase4_summary.md) - P-001（認証ページ）
- [Phase 4-B完了報告](docs/phase4_b_summary.md) - ログイン状態保持機能
- [Phase 4-P004完了報告](docs/phase4_p004_summary.md) - P-004（ユーザー管理ページ）
- [Phase 4-P005完了報告](docs/phase4_p005_summary.md) - P-005（取引先設定ページ）
- [Phase 7完了報告](docs/phase7_summary.md) - バックエンド実装
- [Phase 8完了報告](docs/phase8_summary.md) - API統合・Excel検証機能

---

## 🔒 セキュリティ

- **招待制認証**: Supabase Authによる厳格なアクセス制御
- **パスワード要件**: 英字・数字を含む8文字以上
- **HTTPS通信**: 全通信の暗号化
- **Row Level Security**: データベースレベルの権限制御
- **CSRF対策**: JWTトークンベースの認証

---

## 📄 ライセンス

このプロジェクトは社内専用システムです。

---

## 👥 開発者

- **プロジェクトオーナー**: iwafune-0
- **リポジトリ**: https://github.com/iwafune-0/seikyu-henkan-2

---

**最終更新**: 2026-01-28
