# P-005: 取引先設定API仕様書

**作成日**: 2025-10-15
**Phase**: Phase 4（ページ実装） - MVP版（モック）
**実API実装**: Phase 7

---

## 1. 概要

P-005（取引先設定ページ）で使用するAPI仕様を定義します。現在はモックサービスで実装されており、Phase 7でSupabase APIに置き換えます。

### 対象API

1. `GET /api/companies` - 取引先一覧取得
2. `GET /api/companies/:id` - 取引先詳細取得
3. `PUT /api/companies/:id` - 取引先情報更新
4. `POST /api/companies/:id/template` - テンプレートアップロード
5. `GET /api/companies/:id/template` - テンプレートダウンロード
6. `GET /api/companies/:id/rules` - 処理ルール取得（MVP版：未実装）
7. `GET /api/companies/:id/history` - 処理履歴取得（MVP版：P-003で実装）

---

## 2. API詳細

### 2.1 取引先一覧取得

**エンドポイント**: `GET /api/companies`

**権限**: 管理者専用

**リクエスト**:
```
GET /api/companies
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**:
```typescript
{
  companies: Company[]
  total: number
}

interface Company {
  id: string
  name: string
  display_name: string
  is_active: boolean
  last_processed_at?: string
  template_excel?: string
  template_filename?: string
  template_updated_at?: string
  template_updated_by?: string
  created_at: string
}
```

**成功例**:
```json
{
  "companies": [
    {
      "id": "1",
      "name": "ネクストビッツ",
      "display_name": "株式会社ネクストビッツ 御中",
      "is_active": true,
      "last_processed_at": "2025-10-10",
      "template_excel": "nextbits_template.xlsx",
      "template_filename": "nextbits_template.xlsx",
      "template_updated_at": "2025-09-15T14:30:00Z",
      "template_updated_by": "admin@example.com",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 2
}
```

**エラー**:
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 権限エラー（一般ユーザー）
- `500 Internal Server Error` - サーバーエラー

---

### 2.2 取引先詳細取得

**エンドポイント**: `GET /api/companies/:id`

**権限**: 管理者専用

**リクエスト**:
```
GET /api/companies/1
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**:
```typescript
Company
```

**成功例**:
```json
{
  "id": "1",
  "name": "ネクストビッツ",
  "display_name": "株式会社ネクストビッツ 御中",
  "is_active": true,
  "last_processed_at": "2025-10-10",
  "template_excel": "nextbits_template.xlsx",
  "template_filename": "nextbits_template.xlsx",
  "template_updated_at": "2025-09-15T14:30:00Z",
  "template_updated_by": "admin@example.com",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**エラー**:
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 権限エラー
- `404 Not Found` - 取引先が存在しない
- `500 Internal Server Error` - サーバーエラー

---

### 2.3 取引先情報更新

**エンドポイント**: `PUT /api/companies/:id`

**権限**: 管理者専用

**リクエスト**:
```
PUT /api/companies/1
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "ネクストビッツ",
  "display_name": "株式会社ネクストビッツ 御中",
  "is_active": true
}
```

**リクエストボディ**:
```typescript
interface UpdateCompanyRequest {
  name?: string
  display_name?: string
  is_active?: boolean
}
```

**バリデーション**:
- `name`: 必須、1文字以上
- `display_name`: 必須、1文字以上
- `is_active`: boolean

**レスポンス**:
```typescript
{
  success: boolean
  company: Company
}
```

**成功例**:
```json
{
  "success": true,
  "company": {
    "id": "1",
    "name": "ネクストビッツ",
    "display_name": "株式会社ネクストビッツ 御中",
    "is_active": true,
    "last_processed_at": "2025-10-10",
    "template_excel": "nextbits_template.xlsx",
    "template_filename": "nextbits_template.xlsx",
    "template_updated_at": "2025-09-15T14:30:00Z",
    "template_updated_by": "admin@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**エラー**:
- `400 Bad Request` - バリデーションエラー
  ```json
  {
    "error": "Validation Error",
    "details": {
      "name": "取引先名を入力してください",
      "display_name": "表示名を入力してください"
    }
  }
  ```
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 権限エラー
- `404 Not Found` - 取引先が存在しない
- `500 Internal Server Error` - サーバーエラー

---

### 2.4 テンプレートアップロード

**エンドポイント**: `POST /api/companies/:id/template`

**権限**: 管理者専用

**リクエスト**:
```
POST /api/companies/1/template
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: <EXCEL_FILE>
```

**バリデーション**:
- ファイル形式: `.xlsx` のみ
- ファイルサイズ: 最大10MB

**レスポンス**:
```typescript
{
  success: boolean
  filename: string
  updated_at: string
}
```

**成功例**:
```json
{
  "success": true,
  "filename": "nextbits_template.xlsx",
  "updated_at": "2025-10-15T10:00:00Z"
}
```

**エラー**:
- `400 Bad Request` - ファイル形式エラー
  ```json
  {
    "error": "Invalid File Format",
    "message": "Excelファイル（.xlsx）のみアップロード可能です"
  }
  ```
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 権限エラー
- `404 Not Found` - 取引先が存在しない
- `413 Payload Too Large` - ファイルサイズ超過
- `500 Internal Server Error` - サーバーエラー

---

### 2.5 テンプレートダウンロード

**エンドポイント**: `GET /api/companies/:id/template`

**権限**: 管理者専用

**リクエスト**:
```
GET /api/companies/1/template
Authorization: Bearer <JWT_TOKEN>
```

**レスポンス**:
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="nextbits_template.xlsx"

<BINARY_DATA>
```

**エラー**:
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 権限エラー
- `404 Not Found` - 取引先またはテンプレートが存在しない
- `500 Internal Server Error` - サーバーエラー

---

### 2.6 処理ルール取得（MVP版：未実装）

**エンドポイント**: `GET /api/companies/:id/rules`

**権限**: 管理者専用

**実装予定**: Phase 7以降

**MVP版の動作**:
- フロントエンドでハードコード表示
- APIは呼び出さない

---

### 2.7 処理履歴取得（P-003で実装）

**エンドポイント**: `GET /api/companies/:id/history`

**権限**: 管理者専用

**実装予定**: P-003実装時

**パラメータ**:
- `limit`: 取得件数（デフォルト: 3）
- `offset`: オフセット（デフォルト: 0）

**レスポンス**:
```typescript
{
  history: ProcessedFile[]
  total: number
}
```

---

## 3. エラーハンドリング

### 共通エラーフォーマット

```json
{
  "error": "Error Type",
  "message": "詳細メッセージ",
  "details": {}
}
```

### HTTPステータスコード

| コード | 意味 | 用途 |
|--------|------|------|
| 200 | OK | 成功 |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソース不存在 |
| 413 | Payload Too Large | ファイルサイズ超過 |
| 500 | Internal Server Error | サーバーエラー |

---

## 4. セキュリティ

### 認証

- JWTトークンベースの認証
- `Authorization: Bearer <TOKEN>` ヘッダー必須

### 権限

- 管理者専用API（全エンドポイント）
- 一般ユーザーはアクセス不可（403エラー）

### ファイルアップロード

- ファイル形式検証（`.xlsx`のみ）
- ファイルサイズ制限（10MB）
- ウイルススキャン（Phase 7で実装予定）

---

## 5. Phase 7での実装タスク

1. **Supabase Storage設定**
   - テンプレートファイル用のバケット作成
   - RLS設定（管理者のみアクセス可能）

2. **APIエンドポイント実装**
   - Node.js + Express
   - ファイルアップロード処理（multer）
   - ファイルダウンロード処理

3. **バリデーション**
   - リクエストボディ検証
   - ファイル形式・サイズ検証

4. **エラーハンドリング**
   - 統一されたエラーレスポンス
   - ロギング

---

## 6. モックサービス（Phase 4）

**ファイル**: `frontend/src/services/mock/companiesService.ts`

**機能**:
- 取引先データをメモリに保持
- ファイルアップロードのシミュレーション
- 300msの遅延でAPIコールをシミュレート

**Phase 7での置き換え**:
モックサービスを実際のSupabase API呼び出しに置き換えます。

---

**作成者**: Claude Code
**レビュー**: 未実施
**承認**: 未実施
