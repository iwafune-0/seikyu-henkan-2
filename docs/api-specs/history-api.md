# P-003: 処理履歴・ダウンロードページ - API仕様書

**作成日**: 2025-10-17
**フェーズ**: Phase 4（ページ実装）
**実装予定**: Phase 7（バックエンド実装）

---

## 1. 概要

P-003（処理履歴・ダウンロードページ）で使用するAPIの仕様書です。Phase 7でバックエンド実装時に参照します。

---

## 2. エンドポイント一覧

| エンドポイント | メソッド | 説明 | 認証 |
|--------------|---------|------|------|
| `/api/history` | GET | 処理履歴一覧を取得 | 必須 |
| `/api/history/:id/download/:fileType` | GET | 個別ファイルをダウンロード | 必須 |
| `/api/history/:id/download-zip` | GET | ZIP一括ダウンロード | 必須 |

---

## 3. API詳細

### 3.1. 処理履歴一覧を取得

**エンドポイント**: `GET /api/history`

**説明**: 処理履歴一覧をフィルター条件付きで取得します。全ユーザーが全データにアクセス可能です。

**認証**: JWT必須

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|---|
| `company_id` | string | - | 取引先ID | `1` |
| `user_id` | string | - | 処理者のユーザーID | `user1` |
| `status` | string | - | 処理ステータス（`success` or `error`） | `success` |
| `date_from` | string | - | 処理日（開始） YYYY-MM-DD | `2025-10-01` |
| `date_to` | string | - | 処理日（終了） YYYY-MM-DD | `2025-10-31` |
| `sort_order` | string | - | 並び順（`desc` or `asc`）デフォルト: `desc` | `desc` |

**レスポンス**: `200 OK`

```json
{
  "history": [
    {
      "id": "1",
      "user_id": "user1",
      "user_email": "admin@example.com",
      "company_id": "1",
      "company_name": "ネクストビッツ",
      "process_date": "2025-10-15",
      "excel_file": "base64_encoded_string",
      "excel_filename": "テラ【株式会社ネクストビッツ御中】注文検収書_2510.xlsx",
      "order_pdf": "base64_encoded_string",
      "order_pdf_filename": "注文書_2510.pdf",
      "inspection_pdf": "base64_encoded_string",
      "inspection_pdf_filename": "検収書_2510.pdf",
      "input_pdf_1": "base64_encoded_string",
      "input_pdf_1_filename": "入力PDF1.pdf",
      "input_pdf_2": "base64_encoded_string",
      "input_pdf_2_filename": "入力PDF2.pdf",
      "input_pdf_3": "base64_encoded_string",
      "input_pdf_3_filename": "入力PDF3.pdf",
      "input_pdf_4": "base64_encoded_string",
      "input_pdf_4_filename": "入力PDF4.pdf",
      "processing_time": 12.5,
      "status": "success",
      "created_at": "2025-10-15T14:30:00Z"
    },
    {
      "id": "2",
      "user_id": "user2",
      "user_email": "user@example.com",
      "company_id": "1",
      "company_name": "ネクストビッツ",
      "process_date": "2025-10-13",
      "processing_time": 8.7,
      "status": "error",
      "error_message": "PDFのフォーマットが正しくありません",
      "error_code": "INVALID_PDF_FORMAT",
      "error_detail": "PDF解析中にエラーが発生しました。特定のフィールドが見つかりません。",
      "error_stacktrace": "Error: PDF解析エラー\n    at parsePDF (pdf_parser.py:125)\n    at processFile (pdf_processor.py:67)\n    at main (main.py:45)",
      "created_at": "2025-10-13T16:45:00Z"
    }
  ],
  "total": 2
}
```

**エラーレスポンス**:

- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー

---

### 3.2. 個別ファイルをダウンロード

**エンドポイント**: `GET /api/history/:id/download/:fileType`

**説明**: 特定の処理履歴から個別ファイルをダウンロードします。

**認証**: JWT必須

**パスパラメータ**:

| パラメータ | 型 | 説明 | 例 |
|-----------|---|------|---|
| `id` | string | 処理履歴ID | `1` |
| `fileType` | string | ファイルタイプ（`excel`, `order_pdf`, `inspection_pdf`, `input_pdf_1`, `input_pdf_2`, `input_pdf_3`, `input_pdf_4`） | `excel` |

**レスポンス**: `200 OK`

- **Content-Type**: `application/octet-stream`
- **Content-Disposition**: `attachment; filename="テラ【株式会社ネクストビッツ御中】注文検収書_2510.xlsx"`
- **Body**: ファイルのバイナリデータ

**エラーレスポンス**:

- `401 Unauthorized`: 認証エラー
- `404 Not Found`: 処理履歴が見つからない、またはファイルが存在しない
- `500 Internal Server Error`: サーバーエラー

---

### 3.3. ZIP一括ダウンロード

**エンドポイント**: `GET /api/history/:id/download-zip`

**説明**: 特定の処理履歴から生成ファイルと入力ファイルを全てZIP形式で一括ダウンロードします。エラー発生時の処理はダウンロード不可。

**認証**: JWT必須

**パスパラメータ**:

| パラメータ | 型 | 説明 | 例 |
|-----------|---|------|---|
| `id` | string | 処理履歴ID | `1` |

**レスポンス**: `200 OK`

- **Content-Type**: `application/zip`
- **Content-Disposition**: `attachment; filename="ネクストビッツ_2510.zip"`
- **Body**: ZIPファイルのバイナリデータ

**ZIP内容**:

```
ネクストビッツ_2510.zip
├── テラ【株式会社ネクストビッツ御中】注文検収書_2510.xlsx
├── 注文書_2510.pdf
└── 検収書_2510.pdf
```

**エラーレスポンス**:

- `400 Bad Request`: エラー発生時の処理はダウンロード不可
  ```json
  {
    "error": "エラー発生時の処理はダウンロードできません"
  }
  ```
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: 処理履歴が見つからない
- `500 Internal Server Error`: サーバーエラー

---

## 4. データベーススキーマ

### 4.1. processed_files テーブル

処理済みファイルを保存するテーブルです。

| カラム名 | 型 | NULL | 説明 |
|---------|---|------|------|
| `id` | UUID | NOT NULL | 主キー |
| `user_id` | UUID | NOT NULL | 処理者のユーザーID（profiles.id） |
| `company_id` | UUID | NOT NULL | 取引先ID（companies.id） |
| `process_date` | DATE | NOT NULL | 処理日（YYYY-MM-DD） |
| `excel_file` | BYTEA | NULL | 生成されたExcelファイル（BYTEA型） |
| `excel_filename` | TEXT | NULL | Excelファイル名 |
| `order_pdf` | BYTEA | NULL | 注文書PDF（BYTEA型） |
| `order_pdf_filename` | TEXT | NULL | 注文書PDFファイル名 |
| `inspection_pdf` | BYTEA | NULL | 検収書PDF（BYTEA型） |
| `inspection_pdf_filename` | TEXT | NULL | 検収書PDFファイル名 |
| `input_pdf_1` | BYTEA | NULL | 入力PDF1（BYTEA型） |
| `input_pdf_1_filename` | TEXT | NULL | 入力PDF1ファイル名 |
| `input_pdf_2` | BYTEA | NULL | 入力PDF2（BYTEA型） |
| `input_pdf_2_filename` | TEXT | NULL | 入力PDF2ファイル名 |
| `input_pdf_3` | BYTEA | NULL | 入力PDF3（BYTEA型） |
| `input_pdf_3_filename` | TEXT | NULL | 入力PDF3ファイル名 |
| `input_pdf_4` | BYTEA | NULL | 入力PDF4（BYTEA型） |
| `input_pdf_4_filename` | TEXT | NULL | 入力PDF4ファイル名 |
| `processing_time` | NUMERIC(5,2) | NULL | 処理時間（秒） |
| `status` | TEXT | NOT NULL | 処理ステータス（`success` or `error`） |
| `error_message` | TEXT | NULL | エラーメッセージ（エラー発生時） |
| `error_code` | TEXT | NULL | エラーコード（エラー発生時） |
| `error_detail` | TEXT | NULL | エラー詳細（エラー発生時） |
| `error_stacktrace` | TEXT | NULL | スタックトレース（エラー発生時） |
| `created_at` | TIMESTAMPTZ | NOT NULL | 作成日時 |

**インデックス**:
- `idx_processed_files_user_id` ON `user_id`
- `idx_processed_files_company_id` ON `company_id`
- `idx_processed_files_process_date` ON `process_date`
- `idx_processed_files_status` ON `status`
- `idx_processed_files_created_at` ON `created_at`

**RLS（Row Level Security）**:
- 全ユーザーが全データを閲覧可能（`SELECT`）
- データの挿入は認証済みユーザーのみ（`INSERT`）
- 更新・削除は不可

---

## 5. SQL例

### 5.1. 処理履歴一覧取得（フィルター付き）

```sql
SELECT
  pf.id,
  pf.user_id,
  p.email AS user_email,
  pf.company_id,
  c.name AS company_name,
  pf.process_date,
  encode(pf.excel_file, 'base64') AS excel_file,
  pf.excel_filename,
  encode(pf.order_pdf, 'base64') AS order_pdf,
  pf.order_pdf_filename,
  encode(pf.inspection_pdf, 'base64') AS inspection_pdf,
  pf.inspection_pdf_filename,
  encode(pf.input_pdf_1, 'base64') AS input_pdf_1,
  pf.input_pdf_1_filename,
  encode(pf.input_pdf_2, 'base64') AS input_pdf_2,
  pf.input_pdf_2_filename,
  encode(pf.input_pdf_3, 'base64') AS input_pdf_3,
  pf.input_pdf_3_filename,
  encode(pf.input_pdf_4, 'base64') AS input_pdf_4,
  pf.input_pdf_4_filename,
  pf.processing_time,
  pf.status,
  pf.error_message,
  pf.error_code,
  pf.error_detail,
  pf.error_stacktrace,
  pf.created_at
FROM
  processed_files pf
  INNER JOIN profiles p ON pf.user_id = p.id
  INNER JOIN companies c ON pf.company_id = c.id
WHERE
  (pf.company_id = $1 OR $1 IS NULL)
  AND (pf.user_id = $2 OR $2 IS NULL)
  AND (pf.status = $3 OR $3 IS NULL)
  AND (pf.process_date >= $4 OR $4 IS NULL)
  AND (pf.process_date <= $5 OR $5 IS NULL)
ORDER BY
  pf.created_at DESC
LIMIT 100;
```

### 5.2. 個別ファイルダウンロード

```sql
SELECT
  excel_file,
  excel_filename
FROM
  processed_files
WHERE
  id = $1
  AND excel_file IS NOT NULL;
```

### 5.3. ZIP一括ダウンロード用データ取得

```sql
SELECT
  excel_file,
  excel_filename,
  order_pdf,
  order_pdf_filename,
  inspection_pdf,
  inspection_pdf_filename,
  input_pdf_1,
  input_pdf_1_filename,
  input_pdf_2,
  input_pdf_2_filename,
  input_pdf_3,
  input_pdf_3_filename,
  input_pdf_4,
  input_pdf_4_filename,
  status
FROM
  processed_files
WHERE
  id = $1
  AND status = 'success';
```

---

## 6. 実装時の注意点

### 6.1. ファイルサイズ制限

- 個別ファイル: 最大10MB
- ZIP一括: 最大50MB

### 6.2. Base64エンコーディング

- データベースに保存されたBYTEA型のファイルは、フロントエンドに返却する際にBase64エンコーディングする
- フロントエンド側でBase64デコードしてBlobに変換する

### 6.3. パフォーマンス

- 処理履歴一覧取得時は、ファイルデータ（BYTEA型）を含めるとレスポンスサイズが大きくなるため、一覧表示ではファイルデータを除外する
- ファイルダウンロード時のみBYTEA型を取得する

### 6.4. セキュリティ

- RLS設定により、全ユーザーが全データを閲覧可能（要件定義書に記載）
- ただし、認証は必須（JWTトークン検証）

---

## 7. Phase 7での実装タスク

1. **バックエンド実装**:
   - `backend/src/routes/history.ts` - ルート定義
   - `backend/src/controllers/historyController.ts` - コントローラー実装
   - `backend/src/services/historyService.ts` - ビジネスロジック実装

2. **データベース設定**:
   - `processed_files`テーブル作成（マイグレーション）
   - RLS設定
   - インデックス作成

3. **統合テスト**:
   - API動作確認
   - ファイルダウンロード確認
   - ZIP生成確認

4. **フロントエンド修正**:
   - `frontend/src/services/mock/historyService.ts` を削除
   - Supabase APIクライアントに置き換え

---

**作成者**: Claude Code
**レビュー**: 未実施
**承認**: 未実施
