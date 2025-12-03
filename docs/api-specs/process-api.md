# PDF処理API仕様書 (P-002)

**生成日**: 2025-12-03
**対象ページ**: P-002 (PDF処理実行ページ)
**モックサービス**: `frontend/src/services/mock/processService.ts`

---

## 📋 概要

P-002 PDF処理実行ページで使用されるAPIの仕様を定義します。
Phase 7でバックエンドAPI実装時に、このモックサービスを実APIに置き換えます。

---

## 🔐 エンドポイント一覧

### 1. PDF種別判別・取引先検出

#### エンドポイント
```
POST /api/process/detect
```

#### APIパス定数
```typescript
API_PATHS.PROCESS.DETECT
```

#### 機能
- アップロードされたPDFファイル名から種別（見積書/請求書/注文請書/納品書）を判別
- ファイル名から取引先を判別（ネクストビッツ: `TRR-`、オフビートワークス: `offbeat-to-terra`）
- 事前チェック（ファイル形式、サイズ、取引先混在）を実行

#### Request
```typescript
// multipart/form-data
{
  files: File[];              // PDFファイル（複数可）
  existingSlots?: PdfSlot[];  // 既存のスロット状態（追加アップロード時）
}
```

#### Response (成功)
```typescript
interface DetectionResult {
  company: Company | null;    // 判別された取引先
  pdfSlots: PdfSlot[];        // 4種類のスロット状態
  preCheck: PreCheckResult;   // 事前チェック結果
  needsExcel: boolean;        // 初回処理でExcel必要か
}

interface PdfSlot {
  type: 'estimate' | 'invoice' | 'order_confirmation' | 'delivery';
  file: File | null;
  status: 'empty' | 'uploaded' | 'error';
  errorMessage?: string;
}

interface PreCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  missingTypes: PdfType[];
}
```

#### Response (エラー)
```typescript
{
  error: string;
  code: 'COMPANY_MISMATCH' | 'UNDETECTABLE_COMPANY' | 'INVALID_FILE';
}
```

#### エラーケース
| コード | 説明 |
|--------|------|
| `COMPANY_MISMATCH` | 異なる取引先のファイルが混在 |
| `UNDETECTABLE_COMPANY` | 取引先を判別できないファイル |
| `INVALID_FILE` | PDFファイルではない、またはサイズ超過 |

---

### 2. 個別スロットへのPDFアップロード

#### エンドポイント
```
POST /api/process/upload-single
```

#### APIパス定数
```typescript
API_PATHS.PROCESS.UPLOAD_SINGLE
```

#### 機能
- 特定のスロット（見積書/請求書等）に対して1ファイルをアップロード
- ファイル名と指定スロットの種別一致を検証
- 既存ファイルとの取引先混在チェック

#### Request
```typescript
// multipart/form-data
{
  file: File;                   // PDFファイル
  targetType: PdfType;          // 対象スロット種別
  existingSlots: PdfSlot[];     // 既存のスロット状態
}
```

#### Response
```typescript
// DetectionResult（1と同じ形式）
```

---

### 3. Excelテンプレートアップロード（初回処理用）

#### エンドポイント
```
POST /api/process/upload-excel
```

#### APIパス定数
```typescript
API_PATHS.PROCESS.UPLOAD_EXCEL
```

#### 機能
- 初回処理時にExcelテンプレートをアップロード
- ファイル名から取引先を検証（ネクストビッツ/オフ・ビート・ワークス）
- テンプレートをDBに保存

#### Request
```typescript
// multipart/form-data
{
  file: File;           // Excelファイル (.xlsx, .xls)
  companyId: string;    // 取引先ID
}
```

#### Response (成功)
```typescript
{
  success: true;
  message: string;      // 例: "テンプレート「xxx.xlsx」をアップロードしました"
}
```

#### Response (エラー)
```typescript
{
  error: string;
  code: 'INVALID_FORMAT' | 'COMPANY_MISMATCH' | 'MISSING_COMPANY_NAME';
}
```

#### エラーケース
| コード | 説明 |
|--------|------|
| `INVALID_FORMAT` | Excelファイルではない |
| `COMPANY_MISMATCH` | ファイル名の取引先と選択された取引先が不一致 |
| `MISSING_COMPANY_NAME` | ファイル名に取引先名が含まれていない |

---

### 4. PDF処理実行

#### エンドポイント
```
POST /api/process/execute
```

#### APIパス定数
```typescript
API_PATHS.PROCESS.EXECUTE
```

#### 機能
- 4つのPDFからデータを抽出
- Excelテンプレートにデータを転記
- 注文書PDF・検収書PDFを生成
- 処理結果をDBに保存

#### Request
```typescript
{
  companyId: string;
  slots: PdfSlot[];     // アップロード済みの4つのPDF
}
```

#### Response (成功)
```typescript
interface ProcessResult {
  excelFilename: string;        // 例: "テラ【株式会社ネクストビッツ御中】注文検収書_2512.xlsx"
  orderPdfFilename: string;     // 例: "注文書_2512.pdf"
  inspectionPdfFilename: string; // 例: "検収書_2512.pdf"
  companyName: string;          // ZIP用
  yearMonth: string;            // ZIP用（YYMM形式）
  processId: string;            // 処理ID（DBレコードID）
}
```

#### 処理フロー
```
1. PDFを解析中...           (10%)
2. 見積書からデータを抽出中... (25%)
3. 請求書からデータを抽出中... (40%)
4. 注文請書からデータを抽出中... (55%)
5. 納品書からデータを抽出中... (70%)
6. Excelを編集中...          (80%)
7. PDFを生成中...            (90%)
8. 処理完了                  (100%)
```

---

### 5. 処理結果ファイルダウンロード

#### エンドポイント
```
GET /api/process/download/:processId/:fileType
```

#### APIパス定数
```typescript
API_PATHS.PROCESS.DOWNLOAD(processId, fileType)
```

#### パラメータ
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| processId | string | 処理ID |
| fileType | 'excel' \| 'order_pdf' \| 'inspection_pdf' | ファイル種別 |

#### Response
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="xxx.xlsx"
```

---

### 6. 処理結果ZIPダウンロード

#### エンドポイント
```
GET /api/process/download-zip/:processId
```

#### APIパス定数
```typescript
API_PATHS.PROCESS.DOWNLOAD_ZIP(processId)
```

#### 機能
- Excel + 注文書PDF + 検収書PDFを1つのZIPにまとめてダウンロード
- ZIP名: `{取引先名}_{YYMM}.zip`（例: `ネクストビッツ_2512.zip`）

#### Response
```
Content-Type: application/zip
Content-Disposition: attachment; filename="ネクストビッツ_2512.zip"
```

---

## 📝 型定義

### PdfType
```typescript
type PdfType = 'estimate' | 'invoice' | 'order_confirmation' | 'delivery'
```

| 値 | 日本語 | 判別キーワード |
|----|--------|--------------|
| estimate | 見積書 | 「見積」 |
| invoice | 請求書 | 「請求」 |
| order_confirmation | 注文請書 | 「請書」（優先） |
| delivery | 納品書 | 「納品」 |

### ProcessState
```typescript
type ProcessState =
  | 'initial'         // 初期状態（PDFドロップゾーン）
  | 'uploading'       // アップロード中
  | 'detecting'       // 取引先判別中
  | 'detected'        // 判別完了・事前チェック完了
  | 'incomplete'      // 不足ファイルあり
  | 'excel_required'  // Excelアップロード要求（初回のみ）
  | 'ready'           // 処理実行可能
  | 'processing'      // 処理中
  | 'completed'       // 処理完了
  | 'error'           // エラー
```

---

## 🏢 取引先判別ルール

### ネクストビッツ様
- **判別条件**: ファイル名が `TRR-` で始まる
- **命名規則**: `TRR-YY-MMM_種別.pdf`
- **例**: `TRR-25-011_お見積書.pdf`

### オフビートワークス様
- **判別条件**: ファイル名に `offbeat-to-terra` を含む
- **命名規則**: 種別ごとに異なる
- **例**: `1951030見積-offbeat-to-terra-202511.pdf`

---

## 🔗 関連ファイル

| ファイル | 用途 |
|----------|------|
| `frontend/src/services/mock/processService.ts` | モックサービス（Phase 7で置き換え） |
| `frontend/src/pages/process/ProcessPage.tsx` | P-002ページコンポーネント |
| `backend/src/controllers/processController.ts` | 処理コントローラー（Phase 7で作成） |
| `backend/src/routes/process.ts` | 処理ルート（Phase 7で作成） |
| `backend/python/pdf_parser.py` | PDF解析（Phase 7で作成） |
| `backend/python/excel_editor.py` | Excel編集（Phase 7で作成） |
| `backend/python/pdf_generator.py` | PDF生成（Phase 7で作成） |

---

## 📊 データベーステーブル

### processed_files（処理済みファイル）
```sql
CREATE TABLE processed_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  process_date DATE NOT NULL,

  -- 入力ファイル（BYTEA型）
  input_estimate_pdf BYTEA,
  input_invoice_pdf BYTEA,
  input_order_confirmation_pdf BYTEA,
  input_delivery_pdf BYTEA,

  -- 出力ファイル（BYTEA型）
  excel_file BYTEA NOT NULL,
  excel_filename TEXT NOT NULL,
  order_pdf BYTEA NOT NULL,
  order_pdf_filename TEXT NOT NULL,
  inspection_pdf BYTEA NOT NULL,
  inspection_pdf_filename TEXT NOT NULL,

  -- 処理情報
  status TEXT CHECK (status IN ('success', 'error')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
