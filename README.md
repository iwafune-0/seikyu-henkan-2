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
- **現在**: ネクストビッツ様、オフビートワークス様
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

### バックエンド（Phase 7以降で実装予定）
- **Node.js** 20 + Express + TypeScript（API層）
- **Python** 3.11（処理層）
  - pdfplumber（PDF解析）
  - openpyxl（Excel編集）
  - LibreOffice（PDF生成）

### データベース・認証
- **PostgreSQL** 15（Supabase）
- **Supabase Auth**（招待制）
- **Row Level Security**（RLS）

### デプロイ（Phase 10で実装予定）
- **フロントエンド**: AWS Amplify
- **バックエンド**: AWS Lambda Docker Image
- **データベース**: Supabase
- **月額費用**: $0（全て無料枠内）

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

**モック開発時（Phase 5以前）**:
```bash
VITE_SUPABASE_URL=https://mock-project.supabase.co
VITE_SUPABASE_ANON_KEY=mock-anon-key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. ブラウザでアクセス

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
│   ├── オフビートワークス/
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

## 🎯 機能一覧（全8ページ）

### 認証関連ページ（3ページ）

| ページID | ページ名 | 権限 | 状態 |
|---------|---------|------|------|
| P-001a | ログインページ | ゲスト | ✅ 完成 |
| P-001b | 招待受諾・パスワード設定ページ | 招待リンク保有者 | ✅ 完成 |
| P-001c | パスワードリセットページ | ゲスト | ✅ 完成 |

### メイン機能ページ（5ページ）

| ページID | ページ名 | 権限 | 状態 |
|---------|---------|------|------|
| P-002 | PDF処理実行ページ | 全ユーザー | 未実装 |
| P-003 | 処理履歴・ダウンロードページ | 全ユーザー | 未実装 |
| P-004 | ユーザー管理ページ | 管理者専用 | ✅ 完成（モック） |
| P-005 | 取引先設定ページ | 管理者専用 | ✅ 完成（モック） |

---

## 🔑 モックユーザー（Phase 5以前）

開発環境では以下のモックユーザーでログイン可能：

**管理者**:
- メール: `admin@example.com`
- パスワード: `password123`

**一般ユーザー**:
- メール: `user@example.com`
- パスワード: `password123`

---

## 📊 開発進捗

| Phase | 名称 | 状態 |
|-------|------|------|
| Phase 1 | 要件定義 | ✅ 完了 |
| Phase 2 | Git/GitHub管理 | ✅ 完了 |
| Phase 3 | フロントエンド基盤 | ✅ 完了 |
| Phase 4 | ページ実装 | 🔄 進行中（P-001, P-004, P-005完成） |
| Phase 5 | 環境構築 | ⏳ 未着手 |
| Phase 6 | バックエンド計画 | ⏳ 未着手 |
| Phase 7 | バックエンド実装 | ⏳ 未着手 |
| Phase 8 | API統合 | ⏳ 未着手 |
| Phase 9 | E2Eテスト | ⏳ 未着手 |
| Phase 10 | デプロイメント | ⏳ 未着手 |

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

**最終更新**: 2025-10-15
