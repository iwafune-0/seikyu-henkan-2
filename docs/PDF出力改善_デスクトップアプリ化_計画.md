# PDF出力改善 + デスクトップアプリ化 実装計画

**作成日**: 2025-12-26
**ステータス**: Phase 11-3完了（E2Eテスト173/176 Pass）
**関連ドキュメント**: `docs/PDF出力_CubePDF_Electron_検討.md`（検討経緯）

---

## 0. 開発ロードマップ（全体像）

### 開発順序

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Phase 1: Excel直接出力対応（約1.5日）                           │
│  ─────────────────────────────────                              │
│  現在のWebアプリのまま、PDF生成部分をExcel直接出力に変更          │
│  → LibreOffice版は残したまま、環境変数で切り替え可能に            │
│  → ユーザー管理機能のElectron対応も同時実装                      │
│                                                                 │
│                         ↓                                       │
│                                                                 │
│                    動作確認・品質確認                            │
│                    PDF出力品質がLibreOffice版より改善されたか確認 │
│                                                                 │
│                         ↓                                       │
│                                                                 │
│  Phase 2: Electron化（約1.5日）← 配布が必要になったら            │
│  ──────────────────────────                                     │
│  Webアプリを.exeにパッケージング                                 │
│  → 他の社員も使えるように社内配布                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### なぜこの順序か

| 順序 | 理由 |
|------|------|
| Excel直接出力を先に | Electron化しなくても、WSL2からExcel直接出力は呼び出せる |
| Electron化は後で | 配布のためであり、機能実装とは別の話 |
| 段階的に進める | PDF出力の問題を早期に発見できる |

### 現在のシステム構成（Webアプリ）

```
┌─────────────────────────────────────────────────────────────────┐
│  あなたのPC（WSL2環境）                                          │
│                                                                 │
│  ┌─────────────────┐      ┌─────────────────┐                   │
│  │ ブラウザ         │ ←→  │ フロントエンド    │                   │
│  │ (Chrome等)      │      │ localhost:5174  │                   │
│  └─────────────────┘      │ (React + Vite)  │                   │
│                           └────────┬────────┘                   │
│                                    │ API通信                     │
│                                    ↓                            │
│                           ┌─────────────────┐                   │
│                           │ バックエンド      │                   │
│                           │ localhost:3001  │                   │
│                           │ (Node.js)       │                   │
│                           └────────┬────────┘                   │
│                                    │                            │
│                                    ↓                            │
│                           ┌─────────────────┐                   │
│                           │ Python処理       │                   │
│                           │ ・PDF解析        │                   │
│                           │ ・Excel編集      │                   │
│                           │ ・PDF生成 ← ここを変更              │
│                           └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓ インターネット経由
                           ┌─────────────────┐
                           │ Supabase        │
                           │ (データベース)    │
                           └─────────────────┘
```

---

## 1. 背景と目的

### 1.1 現状の問題

現在のシステムはLibreOfficeでExcel→PDF変換を行っているが、出力サイズが小さくなる問題がある。

| 項目 | 目標（Excel直接出力） | LibreOffice（現状） | 差異 |
|------|---------------------|-------------------|------|
| コンテンツ高さ | 25.53cm | 22.17cm | **14%小さい** |
| 文字サイズ | 8.3pt | 6.6pt | **14%小さい** |

※ 当初CubePDFを検討したが、GUI非表示で自動化できないため断念。詳細は`PDF出力_CubePDF_Electron_検討.md`を参照。

### 1.2 目的

- **LibreOffice版を維持**しつつ、**Excel直接出力版を追加**する
- 環境変数（PDF_ENGINE）で切り替え可能にする
- 社内配布時はExcel直接出力、AWS運用時はLibreOfficeを使用

---

## 2. 設計方針

### 2.1 アーキテクチャ

```
pdf_generator.py
├── generate_pdf()              # メイン関数（環境変数で分岐）
├── generate_pdf_libreoffice()  # LibreOffice版（既存・維持）
└── generate_pdf_excel()        # Excel直接出力版（新規追加）
```

### 2.2 環境変数による切り替え

```bash
# .env
PDF_ENGINE=libreoffice  # または excel
```

### 2.3 処理フロー

```
┌─────────────────────────────────────────────────────────┐
│  generate_pdf(excel_path, output_path)                  │
│                                                         │
│  PDF_ENGINE = os.getenv('PDF_ENGINE', 'libreoffice')   │
│                      │                                  │
│         ┌───────────┴───────────┐                       │
│         ▼                       ▼                       │
│  ┌─────────────┐         ┌─────────────┐                │
│  │ libreoffice │         │    excel    │                │
│  └──────┬──────┘         └──────┬──────┘                │
│         ▼                       ▼                       │
│  generate_pdf_          generate_pdf_                   │
│  libreoffice()          excel()                         │
│         │                       │                       │
│         ▼                       ▼                       │
│  ┌─────────────┐         ┌─────────────────┐            │
│  │ LibreOffice │         │ WSL2 → Windows  │            │
│  │ (Linux/WSL) │         │ → PowerShell    │            │
│  └──────┬──────┘         │ → Excel         │            │
│         │                │ → ExportAsFixed │            │
│         │                └──────┬──────────┘            │
│         ▼                       ▼                       │
│      PDF出力                 PDF出力                    │
└─────────────────────────────────────────────────────────┘
```

### 2.4 WSL2からExcel直接出力を呼び出す仕組み

```
┌─────────────────────────────────────────────────────────────────┐
│  WSL2 (Ubuntu) - 開発環境はそのまま                              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │  Node.js    │→ │   Python    │──────────┐                    │
│  │  (API)      │  │ (処理ロジック)│          │                    │
│  └─────────────┘  └─────────────┘          │                    │
│                                            ↓                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                  subprocess.run()               │
│                                  powershell.exe                 │
├────────────────────────────────────────────┼────────────────────┤
│  Windows側                                 │                    │
│                                            ↓                    │
│  ┌─────────────┐  ┌─────────────────────────────┐               │
│  │   Excel     │→ │ ExportAsFixedFormat(0, path)│               │
│  │ (COM経由)   │  │ → PDF直接出力               │               │
│  └─────────────┘  └─────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

**ポイント**: CubePDFは使用しない。Excel標準機能のExportAsFixedFormatでPDF直接出力。

---

## 3. 実装詳細

### 3.1 ディレクトリ構成（変更なし）

```
backend/
├── python/
│   ├── pdf_generator.py      # ← ここに追加実装
│   ├── pdf_parser.py         # 変更なし
│   └── excel_editor.py       # 変更なし
└── src/
    └── ...                   # 変更なし
```

### 3.2 pdf_generator.py の変更

#### 3.2.1 メイン関数（分岐処理）

```python
import os
import subprocess
from pathlib import Path

def generate_pdf(excel_path: str, output_path: str) -> dict:
    """
    Excel→PDF変換のメイン関数
    環境変数 PDF_ENGINE で使用エンジンを切り替え

    Args:
        excel_path: 入力Excelファイルのパス
        output_path: 出力PDFファイルのパス

    Returns:
        dict: {"success": bool, "message": str, "output_path": str}
    """
    engine = os.getenv('PDF_ENGINE', 'libreoffice').lower()

    if engine == 'excel':
        return generate_pdf_excel(excel_path, output_path)
    else:
        return generate_pdf_libreoffice(excel_path, output_path)
```

#### 3.2.2 LibreOffice版（既存コード維持）

```python
def generate_pdf_libreoffice(excel_path: str, output_path: str) -> dict:
    """
    LibreOfficeでExcel→PDF変換
    Linux環境（WSL2、AWS Lambda）で使用
    """
    # 既存のコードをそのまま維持
    # ...
    pass
```

#### 3.2.3 Excel直接出力版（新規追加）

```python
def generate_pdf_excel(excel_path: str, output_path: str) -> dict:
    """
    ExcelのExportAsFixedFormatでPDF直接出力
    WSL2からWindows側のExcelを呼び出し

    前提条件:
    - Windows側にMicrosoft Excelがインストール済み
    """
    try:
        # WSL2パスをWindowsパスに変換
        win_excel_path = convert_wsl_to_windows_path(excel_path)
        win_output_path = convert_wsl_to_windows_path(output_path)

        # PowerShellスクリプトを生成
        ps_script = generate_excel_export_script(win_excel_path, win_output_path)

        # PowerShell実行
        result = subprocess.run(
            ['powershell.exe', '-ExecutionPolicy', 'Bypass', '-Command', ps_script],
            capture_output=True,
            text=True,
            timeout=120  # 2分タイムアウト
        )

        if result.returncode != 0:
            return {
                "success": False,
                "message": f"Excel PDF出力エラー: {result.stderr}",
                "output_path": None
            }

        # 出力ファイルの存在確認
        if not Path(output_path).exists():
            return {
                "success": False,
                "message": "PDFファイルが生成されませんでした",
                "output_path": None
            }

        return {
            "success": True,
            "message": "PDF生成成功（Excel ExportAsFixedFormat）",
            "output_path": output_path
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "message": "タイムアウト: PDF生成に時間がかかりすぎました",
            "output_path": None
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"エラー: {str(e)}",
            "output_path": None
        }
```

#### 3.2.4 ユーティリティ関数

```python
def convert_wsl_to_windows_path(wsl_path: str) -> str:
    """
    WSL2パスをWindowsパスに変換

    例:
    /home/user/file.xlsx → \\\\wsl$\\Ubuntu\\home\\user\\file.xlsx
    /mnt/c/Users/... → C:\\Users\\...
    """
    path = Path(wsl_path).resolve()
    path_str = str(path)

    # /mnt/c/... 形式の場合
    if path_str.startswith('/mnt/'):
        drive = path_str[5].upper()
        rest = path_str[6:].replace('/', '\\')
        return f"{drive}:{rest}"

    # WSL内部パスの場合
    # WSLディストリビューション名を取得
    distro = get_wsl_distro_name()
    return f"\\\\wsl$\\{distro}{path_str.replace('/', '\\')}"


def get_wsl_distro_name() -> str:
    """WSLディストリビューション名を取得"""
    try:
        result = subprocess.run(
            ['wslpath', '-w', '/'],
            capture_output=True,
            text=True
        )
        # \\wsl$\Ubuntu\ のような形式から抽出
        win_path = result.stdout.strip()
        parts = win_path.split('\\')
        for i, part in enumerate(parts):
            if part == 'wsl$' and i + 1 < len(parts):
                return parts[i + 1]
    except:
        pass
    return 'Ubuntu'  # デフォルト


def generate_excel_export_script(excel_path: str, output_path: str) -> str:
    """
    ExcelのExportAsFixedFormatでPDF出力するPowerShellスクリプトを生成

    処理フロー:
    1. Excelを開く
    2. ExportAsFixedFormat (xlTypePDF=0) でPDF直接出力
    3. Excelを閉じる

    ※ CubePDFはGUI非表示での実行が困難なため、Excel標準機能を使用
    """
    # Excel操作スクリプト（ExportAsFixedFormat使用）
    excel_script = f'''
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {{
    $workbook = $excel.Workbooks.Open("{excel_path}")

    # ExportAsFixedFormat でPDF出力
    # Type 0 = xlTypePDF
    $workbook.ExportAsFixedFormat(0, "{output_path}")

    $workbook.Close($false)
}} finally {{
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}}
'''

    return excel_script
```

---

## 4. 環境要件

### 4.1 LibreOffice版（既存）

| 項目 | 要件 |
|------|------|
| OS | Linux (Ubuntu 20.04+) / WSL2 |
| LibreOffice | 7.0+ |
| Python | 3.11+ |

### 4.2 Excel直接出力版（新規）

| 項目 | 要件 | 確認済み |
|------|------|---------|
| OS | Windows 10/11 + WSL2 | ✅ |
| Microsoft Excel | 2016以降 | ✅ Office16確認済み |
| Python | 3.11+（WSL2内） | ✅ |
| PowerShell | 5.1+（Windows標準） | ✅ |

**※ CubePDFは不要**: CubePDFはGUI非表示での実行が困難なため、ExcelのExportAsFixedFormat機能を使用

### 4.3 環境確認コマンド

```bash
# WSL2から確認（全て確認済み）
# PowerShell
which powershell.exe
# → /mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0//powershell.exe

# Excel
ls "/mnt/c/Program Files/Microsoft Office/root/Office16/"
# → EXCEL.EXE 等が存在
```

---

## 5. 設定ファイル

### 5.1 .env（開発環境）

```bash
# PDF出力エンジン
# libreoffice: LibreOffice使用（Linux/AWS Lambda）
# excel: Excel ExportAsFixedFormat使用（Windows/社内配布）
PDF_ENGINE=excel

# 既存の設定
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
# ...
```

### 5.2 .env.production（本番：AWS Lambda）

```bash
PDF_ENGINE=libreoffice
```

### 5.3 .env.local（社内配布）

```bash
PDF_ENGINE=excel
```

---

## 6. テスト計画

### 6.1 単体テスト

| テストケース | 内容 | 期待結果 |
|-------------|------|----------|
| UT-001 | WSLパス→Windowsパス変換 | 正しく変換される |
| UT-002 | PowerShellスクリプト生成 | 有効なスクリプトが生成される |
| UT-003 | PDF生成（Excel ExportAsFixedFormat） | PDFファイルが生成される |
| UT-004 | エラーハンドリング | 適切なエラーメッセージ |

### 6.2 結合テスト

| テストケース | 内容 | 期待結果 |
|-------------|------|----------|
| IT-001 | ネクストビッツ処理（Excel出力） | PDF品質が期待通り |
| IT-002 | オフ・ビート・ワークス処理（Excel出力） | PDF品質が期待通り |
| IT-003 | 環境変数切り替え | libreoffice/excelが正しく切り替わる |

### 6.3 品質比較テスト

| 項目 | LibreOffice版 | Excel直接出力版 | 目標 |
|------|--------------|----------------|------|
| コンテンツ高さ | 22.17cm | ? | 25.53cm以上 |
| 文字サイズ | 6.6pt | ? | 8.3pt以上 |
| レイアウト崩れ | なし | なし | 崩れなし |

---

## 7. Step 1: Excel直接出力対応 実装スケジュール（詳細タスク）

---

### Phase 1-1: 基盤実装（1日）

#### 1-1-1. 環境変数による分岐処理の追加（30分）

**対象ファイル**: `backend/python/pdf_generator.py`

| タスク | 詳細 |
|--------|------|
| 環境変数読み込み | `os.getenv('PDF_ENGINE', 'libreoffice')` |
| メイン関数の分岐 | `convert_excel_sheets_to_pdf()` 内で分岐 |
| LibreOffice版のリネーム | 既存コードを `convert_excel_sheets_to_pdf_libreoffice()` に |

```python
# 変更イメージ
def convert_excel_sheets_to_pdf(excel_path: str, output_dir: str) -> Dict[str, str]:
    engine = os.getenv('PDF_ENGINE', 'libreoffice').lower()

    if engine == 'excel':
        return convert_excel_sheets_to_pdf_excel(excel_path, output_dir)
    else:
        return convert_excel_sheets_to_pdf_libreoffice(excel_path, output_dir)
```

#### 1-1-2. WSL2パス変換ユーティリティ実装（1時間）

**対象ファイル**: `backend/python/pdf_generator.py`（または新規 `utils.py`）

| タスク | 詳細 |
|--------|------|
| `convert_wsl_to_windows_path()` | WSLパス → Windowsパス変換 |
| `get_wsl_distro_name()` | WSLディストリビューション名取得 |
| `/mnt/c/...` 形式対応 | `C:\...` に変換 |
| WSL内部パス対応 | `\\wsl$\Ubuntu\...` に変換 |

```python
# テストケース
/home/user/file.xlsx → \\wsl$\Ubuntu\home\user\file.xlsx
/mnt/c/Users/test.xlsx → C:\Users\test.xlsx
/tmp/output.pdf → \\wsl$\Ubuntu\tmp\output.pdf
```

#### 1-1-3. PowerShellスクリプト生成実装（2時間）

**対象ファイル**: `backend/python/pdf_generator.py`

| タスク | 詳細 |
|--------|------|
| `generate_excel_export_script()` | PowerShellスクリプト生成 |
| Excel COM操作 | ワークブック開く→ExportAsFixedFormat→閉じる |
| シート別出力 | 注文書シート、検収書シートを別々にPDF化 |

```powershell
# 生成されるスクリプトのイメージ
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open("C:\path\to\file.xlsx")

# ExportAsFixedFormat でPDF出力
# Type 0 = xlTypePDF
$workbook.ExportAsFixedFormat(0, "C:\path\to\output.pdf")

$workbook.Close($false)
$excel.Quit()
```

#### 1-1-4. Excel直接出力版メイン関数実装（2時間）

**対象ファイル**: `backend/python/pdf_generator.py`

| タスク | 詳細 |
|--------|------|
| `convert_excel_sheets_to_pdf_excel()` | Excel直接出力版のメイン関数 |
| PowerShell実行 | `subprocess.run(['powershell.exe', ...])` |
| 出力ファイル確認 | PDF生成の成功確認 |
| エラーハンドリング | タイムアウト、実行エラー |

```python
def convert_excel_sheets_to_pdf_excel(excel_path: str, output_dir: str) -> Dict[str, str]:
    """Excel ExportAsFixedFormatでPDF変換（WSL2からWindows呼び出し）"""
    # 1. WSLパス → Windowsパス変換
    # 2. PowerShellスクリプト生成
    # 3. subprocess.run()で実行
    # 4. 出力ファイル確認
    # 5. 結果を返す
```

**※ CubePDFは使用しない**: CubePDFはGUI非表示での実行が困難なため、ExcelのExportAsFixedFormat機能を使用

---

### Phase 1-2: 動作確認・デバッグ（0.5日）

#### 1-2-1. 単体テスト（1時間）

| テスト | 内容 |
|--------|------|
| パス変換テスト | WSLパス → Windowsパス変換が正しいか |
| PowerShell実行テスト | WSL2からPowerShellが呼び出せるか |
| Excel COM テスト | Excelが起動・終了するか |

```bash
# テストコマンド
cd backend/python
python3 -c "from pdf_generator import convert_wsl_to_windows_path; print(convert_wsl_to_windows_path('/tmp/test.xlsx'))"
```

#### 1-2-2. 結合テスト - ネクストビッツ（1時間）

| テスト | 内容 |
|--------|------|
| 入力 | ネクストビッツのテンプレートExcel |
| 処理 | Excel ExportAsFixedFormatでPDF生成 |
| 確認 | 注文書PDF、検収書PDFが生成されるか |
| 品質確認 | 期待通りのPDF品質か |

#### 1-2-3. 結合テスト - オフ・ビート・ワークス（1時間）

| テスト | 内容 |
|--------|------|
| 入力 | オフ・ビート・ワークスのテンプレートExcel |
| 処理 | Excel ExportAsFixedFormatでPDF生成 |
| 確認 | 注文書PDF、検収書PDFが生成されるか |
| 品質確認 | 期待通りのPDF品質か |

#### 1-2-4. 切り替えテスト（30分）

| テスト | 内容 |
|--------|------|
| `PDF_ENGINE=libreoffice` | LibreOffice版が動作するか |
| `PDF_ENGINE=excel` | Excel直接出力版が動作するか |
| 環境変数なし | デフォルト（LibreOffice）で動作するか |

---

### Phase 1-3: 統合・調整（0.5日）

#### 1-3-1. エラーハンドリング強化（1時間）

| エラーケース | 対応 |
|-------------|------|
| Excel未インストール | 分かりやすいエラーメッセージ |
| PowerShell実行エラー | stderr内容をログ出力 |
| タイムアウト | 2分でタイムアウト、リトライなし |
| 出力ファイル不存在 | 生成失敗を検知 |

#### 1-3-2. ログ出力追加（30分）

| ログ | 内容 |
|------|------|
| INFO | PDF生成開始、使用エンジン |
| INFO | PDF生成完了、出力パス |
| DEBUG | PowerShellスクリプト内容 |
| ERROR | エラー詳細、stderr |

#### 1-3-3. .env設定追加（30分）

**対象ファイル**: `backend/.env`、`backend/.env.example`

```bash
# 追加する設定
PDF_ENGINE=excel  # または libreoffice
```

#### 1-3-4. Node.js側の対応確認（1時間）

**対象ファイル**: `backend/src/services/` 内のPDF生成呼び出し箇所

| 確認項目 | 内容 |
|---------|------|
| 環境変数の受け渡し | Python実行時に`PDF_ENGINE`が渡るか |
| エラーハンドリング | Python側のエラーが正しく伝播するか |
| 出力パスの処理 | WSLパスで返ってきても問題ないか |

---

### Phase 1-4: ドキュメント・仕上げ（0.5日）

#### 1-4-1. CLAUDE.md更新（30分）

| 追加内容 |
|---------|
| PDF_ENGINE環境変数の説明 |
| Excel直接出力版の前提条件 |
| 切り替え方法 |

#### 1-4-2. README更新（30分）

| 追加内容 |
|---------|
| Excel直接出力版のセットアップ手順 |
| 環境要件（Excel） |
| トラブルシューティング |

#### 1-4-3. コードコメント追加（30分）

| 対象 |
|------|
| 新規追加した関数のdocstring |
| 複雑な処理の説明コメント |

#### 1-4-4. 動作確認チェックリスト作成（30分）

| チェック項目 |
|-------------|
| LibreOffice版が動作する |
| Excel直接出力版が動作する |
| 環境変数で切り替えできる |
| エラー時に分かりやすいメッセージが出る |
| 生成されたPDFの品質が期待通り |

---

### Step 1 タスクサマリー

| Phase | タスク数 | 工数 |
|-------|---------|------|
| 1-1: 基盤実装 | 4タスク | 1日 |
| 1-2: 動作確認 | 4タスク | 0.5日 |
| 1-3: 統合・調整 | 4タスク | 0.5日 |
| 1-4: ドキュメント | 4タスク | 0.5日 |
| **合計** | **16タスク** | **2.5日** |

---

### 事前調査が必要な項目

| 項目 | 内容 | 優先度 |
|------|------|--------|
| シート別PDF出力 | Excelで特定シートのみExportAsFixedFormatする方法 | 中 |
| WSL2 → Windows COM | WSL2からWindows COMが呼べるか | 中 |

**※ CubePDF関連の調査は不要**: CubePDFはGUI非表示での実行が困難なため、ExcelのExportAsFixedFormat機能を使用

**Step 1 合計: 約2.5日**

---

## 8. Step 2: Electron化（社内配布）

**前提**: Step 1（Excel直接出力対応）の動作確認が完了していること

### 8.1 なぜElectron化が必要か

| 現状（Webアプリ） | Electron化後 |
|------------------|-------------|
| ブラウザで `localhost:5174` にアクセス | .exeをダブルクリックで起動 |
| `npm run dev` でサーバー起動が必要 | サーバー起動不要 |
| Node.js/Python環境が必要 | 環境構築不要（全部入り） |
| あなたのPCでしか動かない | 他の社員のPCでも動く |

### 8.2 Electron化の概要

```
現在のWebアプリ
┌─────────────────────────────────────────┐
│  ブラウザ ←→ Node.js API ←→ Python     │
│  (別々に起動)                           │
└─────────────────────────────────────────┘
                    ↓ Electron化
┌─────────────────────────────────────────┐
│  請求変換システム.exe（1ファイル）        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ React   │  │ Node.js │  │ Python  │  │
│  │ (画面)  │  │ (API)   │  │+Excel   │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│  全部1つのアプリに内蔵                   │
└─────────────────────────────────────────┘
```

### 8.3 配布方法

| 項目 | 内容 |
|------|------|
| 配布形式 | Portable版（.exe、インストール不要） |
| 配布場所 | 社内ファイルサーバー `\\server\apps\` |
| 使い方 | .exeをダブルクリックするだけ |
| 更新方法 | 新しい.exeを配置、ユーザーがダウンロード |
| 管理者権限 | 不要 |

### 8.4 Step 2: Electron化 実装スケジュール（詳細タスク）

---

#### Phase 2-1: Electron基盤構築（1日）

##### 2-1-1. Electronプロジェクト初期化（1時間）

| タスク | 詳細 |
|--------|------|
| electron, electron-builder インストール | `npm install electron electron-builder --save-dev` |
| プロジェクト構造作成 | `electron/` フォルダ作成 |
| package.json 更新 | mainエントリーポイント設定 |

```
プロジェクト構造
seikyu-henkan-2/
├── electron/
│   ├── main.ts          # Electronメインプロセス
│   ├── preload.ts       # プリロードスクリプト
│   └── tsconfig.json    # Electron用TypeScript設定
├── frontend/            # 既存（変更なし）
├── backend/             # 既存（変更なし）
└── package.json         # ルート（Electron設定追加）
```

##### 2-1-2. メインプロセス実装（2時間）

**対象ファイル**: `electron/main.ts`

| タスク | 詳細 |
|--------|------|
| BrowserWindow作成 | ウィンドウサイズ、タイトル設定 |
| フロントエンド読み込み | 開発時: localhost、本番: ローカルHTML |
| バックエンド起動 | 内蔵APIサーバー起動 |
| アプリ終了処理 | プロセス終了時のクリーンアップ |

```typescript
// electron/main.ts イメージ
import { app, BrowserWindow } from 'electron'
import { startBackendServer } from './backend-runner'

let mainWindow: BrowserWindow | null = null

app.whenReady().then(async () => {
  // バックエンドサーバー起動
  await startBackendServer()

  // ウィンドウ作成
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  // フロントエンド読み込み
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
  }
})
```

##### 2-1-3. プリロードスクリプト実装（1時間）

**対象ファイル**: `electron/preload.ts`

| タスク | 詳細 |
|--------|------|
| contextBridge設定 | フロントエンド↔メインプロセス通信 |
| API公開 | 必要なNode.js APIを安全に公開 |

##### 2-1-4. 開発用スクリプト設定（1時間）

**対象ファイル**: `package.json`

```json
{
  "scripts": {
    "electron:dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\" \"wait-on http://localhost:5174 && electron .\"",
    "electron:build": "npm run build --prefix frontend && npm run build --prefix backend && electron-builder"
  }
}
```

---

#### Phase 2-2: フロントエンド統合（0.5日）

##### 2-2-1. Viteビルド設定調整（1時間）

**対象ファイル**: `frontend/vite.config.ts`

| タスク | 詳細 |
|--------|------|
| base設定 | Electron用に相対パスに変更 |
| outDir設定 | ビルド出力先を調整 |

```typescript
export default defineConfig({
  base: './',  // Electron用
  build: {
    outDir: 'dist'
  }
})
```

##### 2-2-2. API URL設定（1時間）

**対象ファイル**: `frontend/src/lib/api.ts` など

| タスク | 詳細 |
|--------|------|
| 開発時 | `http://localhost:3001` |
| Electron時 | `http://localhost:3001`（内蔵サーバー） |

---

#### Phase 2-3: バックエンド統合（0.5日）

##### 2-3-1. バックエンドサーバー起動処理（1時間）

**対象ファイル**: `electron/backend-runner.ts`

| タスク | 詳細 |
|--------|------|
| Express起動 | Electron内でAPIサーバー起動 |
| ポート設定 | 3001番ポート使用 |
| 終了処理 | アプリ終了時にサーバー停止 |

##### 2-3-2. Python実行パス調整（1時間）

**対象ファイル**: `backend/src/services/` 内

| タスク | 詳細 |
|--------|------|
| 開発時 | `python3` コマンド使用 |
| Electron時 | 同梱したPython実行ファイルを使用 |
| パス解決 | `app.getPath('exe')` から相対パス |

---

#### Phase 2-4: Python同梱（0.5日）

##### 2-4-1. PyInstallerでPython処理をexe化（2時間）

**対象ファイル**: `backend/python/`

```bash
# ビルドコマンド
cd backend/python
pip install pyinstaller
pyinstaller --onefile --name pdf_processor main.py
```

| タスク | 詳細 |
|--------|------|
| エントリーポイント作成 | 全Python処理を1つのexeにまとめる |
| 依存ライブラリ同梱 | openpyxl, pdfplumber等 |
| 動作確認 | 単体でexeが動作するか |

##### 2-4-2. electron-builder設定（1時間）

**対象ファイル**: `package.json` または `electron-builder.yml`

```yaml
# electron-builder.yml
appId: com.company.seikyu-henkan
productName: 請求変換システム
directories:
  output: release
files:
  - dist/**/*
  - electron/**/*
  - node_modules/**/*
extraResources:
  - from: backend/python/dist/pdf_processor.exe
    to: python/pdf_processor.exe
win:
  target:
    - target: portable
      arch: x64
portable:
  artifactName: ${productName}-${version}-portable.exe
```

---

#### Phase 2-5: ビルド・テスト（0.5日）

##### 2-5-1. 開発モードテスト（1時間）

| テスト | 内容 |
|--------|------|
| `npm run electron:dev` | 開発モードで起動するか |
| フロントエンド表示 | 画面が正しく表示されるか |
| API通信 | バックエンドと通信できるか |
| PDF生成 | Excel ExportAsFixedFormatでPDFが生成されるか |

##### 2-5-2. ビルドテスト（1時間）

| テスト | 内容 |
|--------|------|
| `npm run electron:build` | ビルドが成功するか |
| 出力ファイル確認 | `release/` に.exeが生成されるか |
| ファイルサイズ確認 | 100-200MB程度か |

##### 2-5-3. 配布テスト（1時間）

| テスト | 内容 |
|--------|------|
| 別フォルダで起動 | .exeを別の場所に移動して起動 |
| 初回起動 | Windows Defender警告の確認 |
| PDF生成 | 実際の処理が動作するか |
| ログイン | Supabase認証が動作するか |

---

### Step 2 タスクサマリー

| Phase | タスク数 | 工数 |
|-------|---------|------|
| 2-1: Electron基盤 | 4タスク | 1日 |
| 2-2: フロントエンド統合 | 2タスク | 0.5日 |
| 2-3: バックエンド統合 | 2タスク | 0.5日 |
| 2-4: Python同梱 | 2タスク | 0.5日 |
| 2-5: ビルド・テスト | 3タスク | 0.5日 |
| **合計** | **13タスク** | **3日** |

---

### 8.5 前提条件

- [ ] Step 1（Excel直接出力対応）が完了していること
- [ ] Excel ExportAsFixedFormatでのPDF出力品質が確認済みであること
- [ ] 各社員のPCにExcelがインストールされていること

---

### 8.6 配布後の運用

#### ユーザー向け手順書に含める内容

| 項目 | 内容 |
|------|------|
| 事前準備 | Excelのインストール確認 |
| 初回起動 | Windows Defender警告の対処方法 |
| 使い方 | .exeダブルクリック → ログイン → 処理実行 |
| トラブル | よくあるエラーと対処法 |

#### アップデート方法

```
1. 新しい.exeを社内サーバーに配置
2. ユーザーに通知
3. ユーザーが新しい.exeをダウンロードして使用
4. 古い.exeは削除してOK
```

---

## 9. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| Excel COMエラー | 処理中断 | リトライ処理、タイムアウト設定 |
| WSL2↔Windows通信遅延 | 処理時間増加 | 非同期処理、進捗表示 |
| Windows Defender警告 | ユーザー混乱 | 社内除外設定、手順書作成 |

---

## 10. 参考情報

### 10.1 関連ドキュメント

- `docs/PDF出力_CubePDF_Electron_検討.md` - 初期検討内容（CubePDF断念の経緯）
- `docs/requirements.md` - システム要件定義

### 10.2 技術参考

- WSL2からWindowsアプリ呼び出し: https://docs.microsoft.com/ja-jp/windows/wsl/interop
- Excel COM API: https://docs.microsoft.com/ja-jp/office/vba/api/overview/excel
- Excel ExportAsFixedFormat: https://docs.microsoft.com/ja-jp/office/vba/api/excel.workbook.exportasfixedformat
- Electron: https://www.electronjs.org/
- electron-builder: https://www.electron.build/

---

---

## 11. 調査経緯と決定事項（2025-12-26）

### 11.1 CubePDFの制限事項（断念理由）

公式FAQを調査した結果、重要な制限が判明：

| 項目 | 結果 | 出典 |
|------|------|------|
| **GUIを非表示にできるか** | ❌ できない | [公式FAQ](https://clown.cube-soft.jp/entry/cubepdf/faq/basic) |
| **コマンドラインから使えるか** | ❌ 困難 | GUIアプリとして設計 |
| **サイレント自動出力** | ❌ CubePDF単体では不可能 | 公式FAQ |

### 11.2 CubeVP方式（公式推奨の代替手段）

公式が提案している解決策：

| ツール | 説明 |
|--------|------|
| **CubeVP** | 仮想プリンター構築システム、個人利用無料 |
| **CubePDF Lite** | GUI非表示版CubePDF（サンプルプログラム） |

**複雑な点**:
- CubeVPのインストールが必要
- CubePDF Liteのダウンロード/ビルドが必要
- カスタム仮想プリンターの登録が必要
- 出力先を動的に変えるにはレジストリ or JSONを毎回書き換え

**参考リンク**:
- https://www.cube-soft.jp/cubevp/
- https://clown.cube-soft.jp/entry/cubevp/tutorial
- https://github.com/cube-soft/Cube.Vp.Docs

### 11.3 新しい選択肢：Excel直接PDF出力

**CubeVPより遥かにシンプルな方法を発見**

ExcelにはPDF直接出力機能（`ExportAsFixedFormat`）が内蔵されている。

```powershell
# PowerShellでの実装例
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open("C:\path\to\file.xlsx")

# 注文書シートをPDF出力
$workbook.Worksheets.Item("注文書").ExportAsFixedFormat(
    0,                          # 0 = PDF形式
    "C:\output\order.pdf"       # 出力先（自由に指定可能）
)

$workbook.Close($false)
$excel.Quit()
```

**メリット**:
- 追加インストール不要（Excel既存機能）
- 仮想プリンター不要
- 出力先を引数で直接指定可能
- シート別出力が簡単

### 11.4 実機テスト結果

**テスト日時**: 2025-12-26

**テスト内容**: WSL2からPowerShell経由でExcel直接PDF出力

**入力ファイル**: `source/ネクストビッツ/テラ【株式会社ネクストビッツ御中】注文検収書_2507.xlsx`

**結果**:

| 出力ファイル | サイズ | 状態 |
|-------------|--------|------|
| `test_excel_direct.pdf`（注文書） | 186KB | ✅ 生成成功 |
| `test_inspection_direct.pdf`（検収書） | 186KB | ✅ 生成成功 |

**確認場所**: プロジェクトルートに `test_excel_direct.pdf`, `test_inspection_direct.pdf` を配置

### 11.5 方式比較（更新版）

| 項目 | CubeVP方式 | Excel直接出力 | LibreOffice（現状） |
|------|-----------|--------------|-------------------|
| **追加インストール** | CubeVP + CubePDF Lite | なし | LibreOffice |
| **仮想プリンター** | 必要 | 不要 | 不要 |
| **出力先指定** | レジストリ/JSON書き換え | 引数で直接指定 ✅ | 引数で指定 |
| **シート別出力** | 要検証 | 簡単 ✅ | 可能 |
| **実装の複雑さ** | 高 | **低** ✅ | 低 |
| **PDF品質** | CubePDF相当 | **要確認** | 14%縮小問題あり |
| **動作環境** | Windowsのみ | Windowsのみ | Linux/WSL2 |

### 11.6 決定事項

**採用方式**: Excel直接出力（ExportAsFixedFormat）

**決定理由**:
- CubePDFはGUI非表示での実行が困難
- CubeVP方式は追加インストールと複雑な設定が必要
- Excel直接出力は追加インストール不要、引数で出力先指定可能、実装がシンプル
- 実機テストで正常動作確認済み

---

---

## 12. 開発プロンプト（AI駆動開発用）

### 12.1 概要

現在LibreOfficeで行っているExcel→PDF変換を、Excel直接出力（ExportAsFixedFormat）に切り替え可能にする。
その後、社内配布用にElectron化（.exe）を行う。

### 12.2 重要な前提

- LibreOffice版は削除せず、環境変数で切り替え可能にする
- 問題発生時はPDF_ENGINE=libreofficeに戻すことで即座にロールバック可能
- Excel直接出力はWSL2環境でのみ動作（AWS Lambdaでは引き続きLibreOffice使用）
- **Electron版ではユーザー招待/パスワードリセットのメール送信が使えないため、管理者が直接操作する方式に切り替える**

### 12.2.1 環境変数による機能切り替え

| 環境変数 | 値 | 用途 |
|---------|-----|------|
| `PDF_ENGINE` | `libreoffice` / `excel` | PDF出力方式の切り替え |
| `APP_MODE` | `web` / `electron` | ユーザー管理機能の切り替え |

| APP_MODE | ユーザー追加 | パスワードリセット |
|----------|-------------|-------------------|
| `web` | 招待メール送信 | リセットメール送信 |
| `electron` | 管理者が直接追加 | 管理者が直接リセット |

---

### 12.3 Phase 1: PDF出力エンジン切り替え対応 + Electron版機能準備

#### 1-1. 基盤実装（PDF出力切り替え）
**依存**: なし（最初に着手）

**タスク**:
- 環境変数分岐（PDF_ENGINE=libreoffice|excel）
- WSLパス→Windowsパス変換ユーティリティ
- PowerShellスクリプト生成（Excel COM + ExportAsFixedFormat使用）
- 既存LibreOffice版を関数分離（後方互換性維持）
- Excel直接出力版を新規追加

**対象ファイル**:
- backend/python/pdf_generator.py（メイン変更）
- backend/.env（PDF_ENGINE追加）
- backend/.env.example（PDF_ENGINE追加）

**成功基準**:
- [ ] PDF_ENGINE=excel で Excel直接出力関数が呼ばれる
- [ ] PDF_ENGINE=libreoffice で 既存LibreOffice関数が呼ばれる
- [ ] 環境変数未設定時は libreoffice がデフォルト

---

#### 1-2. ユーザー管理機能のElectron対応
**依存**: 1-1完了後（PDF出力とは独立した機能のため、1-1の後すぐに着手可能）

**背景**:
Electron版ではメール送信が使えないため、ユーザー管理機能を以下のように切り替える必要がある：
- 招待メール送信 → 管理者が直接ユーザー追加
- パスワードリセットメール → 管理者が直接パスワード設定

**タスク**:

**フロントエンド（P-004 ユーザー管理ページ）**:
- 環境変数 `APP_MODE` による UI切り替え実装
- 「ユーザー追加」ダイアログ新規作成（メール + 初期パスワード入力）
- 「パスワードリセット」ダイアログ新規作成（新パスワード入力）
- 既存UIとのデザイン統一（MUI Dialog, TextField, Button）

**バックエンド**:
- ユーザー直接追加API実装（Supabase Admin API使用）
- パスワード直接リセットAPI実装（Supabase Admin API使用）
- 環境変数 `APP_MODE` の追加

**対象ファイル**:
- frontend/src/pages/users.tsx（UI切り替え、新ダイアログ追加）
- backend/src/routes/users.ts（新API追加）
- backend/src/controllers/userController.ts（新API実装）
- backend/.env（APP_MODE追加）
- backend/.env.example（APP_MODE追加）

**UIイメージ**:

```
【ユーザー追加ダイアログ（Electron版）】
┌─────────────────────────────┐
│ ユーザー追加                 │
├─────────────────────────────┤
│ メールアドレス: [          ] │
│ 初期パスワード: [          ] │
│ ロール: ○管理者 ○一般      │
│                             │
│ [追加] [キャンセル]          │
└─────────────────────────────┘

【パスワードリセットダイアログ（Electron版）】
┌─────────────────────────────┐
│ パスワードリセット           │
├─────────────────────────────┤
│ 対象: user@example.com      │
│ 新パスワード: [            ] │
│                             │
│ [リセット] [キャンセル]      │
└─────────────────────────────┘
```

**成功基準**:
- [ ] APP_MODE=web で従来の招待メール機能が動作する
- [ ] APP_MODE=electron で直接追加/リセット機能が動作する
- [ ] ユーザー追加後、DBにユーザーが登録される
- [ ] パスワードリセット後、新パスワードでログインできる
- [ ] UIが既存のP-004と統一されている

---

#### 1-3. 動作確認・デバッグ
**依存**: 1-1, 1-2完了後（全機能実装後に確認）

**タスク**:
- 単体テスト（パス変換、PowerShell実行）
- 結合テスト（ネクストビッツ用Excel → PDF）
- 結合テスト（オフ・ビート・ワークス用Excel → PDF）
- 環境変数切り替えテスト（PDF_ENGINE: libreoffice ↔ excel）
- 環境変数切り替えテスト（APP_MODE: web ↔ electron）
- PDF品質確認（LibreOffice版との比較）
- ユーザー管理機能の動作確認（直接追加、パスワードリセット）

**テスト用ファイル**:
- source/ネクストビッツ/ 内のテンプレートExcel
- source/オフ・ビート・ワークス/ 内のテンプレートExcel

**成功基準**:
- [x] ネクストビッツ: 注文書PDF + 検収書PDF が生成される ✅ 2026-01-19確認
- [x] オフ・ビート・ワークス: 注文書PDF + 検収書PDF が生成される ✅ 2026-01-15確認
- [x] 生成PDFの品質が手動Excel→PDF出力と同等 ✅ 2026-01-15確認（縮小問題解消）
- [x] APP_MODE=electron でユーザー直接追加が動作する ✅ 2026-01-15確認
- [x] APP_MODE=electron でパスワード直接リセットが動作する ✅ 2026-01-15確認

---

#### 1-4. 統合・調整
**依存**: 1-3完了後

**タスク**:
- エラーハンドリング強化（Excel未インストール、タイムアウト等）
- ログ出力追加（使用エンジン、処理時間、エラー詳細）
- .env / .env.example 更新（PDF_ENGINE、APP_MODE）
- Node.js側の動作確認（processService.tsからの呼び出し）

**対象ファイル**:
- backend/python/pdf_generator.py
- backend/.env
- backend/.env.example
- backend/src/services/processService.ts（確認のみ、変更なしの想定）

**成功基準**:
- [ ] Excelが起動しない場合に明確なエラーメッセージ
- [ ] タイムアウト（2分）で適切にエラー終了
- [ ] ログに使用エンジン（libreoffice/excel）が記録される
- [ ] フロントエンドからの処理実行が正常動作

---

#### 1-5. ドキュメント・仕上げ
**依存**: 1-4完了後

**タスク**:
- CLAUDE.md更新（PDF_ENGINE、APP_MODE設定の説明追加）
- README更新（セットアップ手順、環境要件）
- コードコメント追加（新規関数のdocstring）
- 動作確認チェックリスト作成

**対象ファイル**:
- CLAUDE.md
- README.md
- backend/python/pdf_generator.py（コメント追加）

**成功基準**:
- [ ] 新規開発者がドキュメントを読んで環境構築できる
- [ ] PDF_ENGINE、APP_MODEの切り替え方法が明記されている

---

### 12.4 Phase 2: Electron化（パッケージング作業）

**注意**: Phase 1で機能実装は完了しているため、Phase 2は純粋にパッケージング作業に集中する。

#### 2-1. Electron基盤構築
**依存**: Phase 1完了後（PDF出力が安定してから）

**タスク**:
- プロジェクト初期化（electron, electron-builder インストール）
- electron/ ディレクトリ作成
- メインプロセス実装（BrowserWindow作成、アプリライフサイクル）
- プリロードスクリプト実装（contextBridge設定）
- 開発用スクリプト設定（package.json）

**新規作成ファイル**:
- electron/main.ts
- electron/preload.ts
- electron/tsconfig.json

**成功基準**:
- [ ] npm run electron:dev で Electronウィンドウが起動
- [ ] ウィンドウ内にReactアプリが表示される

---

#### 2-2. フロントエンド統合
**依存**: 2-1完了後
**並列可能**: 2-3と並列作業可

**タスク**:
- Viteビルド設定調整（base: './'）
- API URL設定（環境判定してlocalhost固定）

**対象ファイル**:
- frontend/vite.config.ts
- frontend/src/lib/api.ts（必要に応じて）

**成功基準**:
- [ ] npm run build でElectron用にビルドできる
- [ ] ビルド後のHTMLがElectronから読み込める

---

#### 2-3. バックエンド統合
**依存**: 2-1完了後
**並列可能**: 2-2と並列作業可

**タスク**:
- Expressサーバー起動処理（Electron内で起動）
- Python実行パス調整（開発時/本番時の分岐）
- アプリ終了時のクリーンアップ処理

**新規作成ファイル**:
- electron/backend-runner.ts

**成功基準**:
- [ ] Electron起動時にAPIサーバーが自動起動
- [ ] localhost:3001 でAPIが応答する
- [ ] アプリ終了時にサーバープロセスが終了

---

#### 2-4. Python同梱
**依存**: 2-3完了後

**タスク**:
- PyInstallerでPython処理をexe化
- エントリーポイント作成（全Python処理を統合）
- electron-builder設定（extraResources）
- 動作確認（単体でexeが動作するか）

**対象ファイル**:
- backend/python/（PyInstaller対象）
- package.json または electron-builder.yml

**成功基準**:
- [ ] pdf_processor.exe が単体で動作する
- [ ] electron-builderの設定でexeが同梱される

---

#### 2-5. ビルド・テスト
**依存**: 2-4完了後

**タスク**:
- 開発モードテスト（全機能動作確認）
- 本番ビルドテスト（npm run electron:build）
- 配布テスト（別フォルダで起動、ログイン、PDF生成）
- Windows Defender警告の確認・対処

**成功基準**:
- [ ] release/ に .exe が生成される
- [ ] .exe をダブルクリックでアプリ起動
- [ ] ログイン → PDF処理 → ダウンロード が動作
- [ ] 別フォルダに移動しても動作する

---

### 12.5 依存関係図

```
Phase 1: PDF出力エンジン切り替え + Electron版機能準備
─────────────────────────────────────────────────────
1-1 基盤実装（PDF出力切り替え）
    ↓
1-2 ユーザー管理機能のElectron対応（PDF出力と独立、1-1の後すぐ着手可）
    ↓
1-3 動作確認（全機能実装後にまとめて確認）
    ↓
1-4 統合・調整（エラーハンドリング、ログ）
    ↓
1-5 ドキュメント
    ↓
─────────────────────────────────────────────────────
Phase 2: Electron化（パッケージング作業）
─────────────────────────────────────────────────────
2-1 Electron基盤
    ↓
    ├── 2-2 フロントエンド統合（並列可）
    └── 2-3 バックエンド統合（並列可）
            ↓
        2-4 Python同梱
            ↓
        2-5 ビルド・テスト
```

---

### 12.6 ロールバック手順

#### PDF出力で問題発生時
```bash
# backend/.env
PDF_ENGINE=libreoffice  # excel → libreoffice に変更

# バックエンド再起動
cd backend && npm run dev
```
即座にLibreOffice版に戻る。コード変更不要。

#### ユーザー管理機能で問題発生時
```bash
# backend/.env
APP_MODE=web  # electron → web に変更

# バックエンド再起動
cd backend && npm run dev
```
即座に招待メール方式に戻る。コード変更不要。

#### Electron化で問題発生時
Webアプリ版（localhost:5174 + localhost:3001）は引き続き動作。
Electron化は独立した追加機能のため、既存機能に影響なし。

---

### 12.7 環境要件

#### 開発環境（WSL2）
- Node.js 20+
- Python 3.11+
- LibreOffice 7.0+（既存）

#### Excel直接出力に必要（Windows側）
- Microsoft Excel 2016以降
- PowerShell 5.1+（Windows標準）

#### Electron配布に必要（利用者PC）
- Windows 10/11
- Microsoft Excel 2016以降

---

### 12.8 AI駆動開発での時間見積もり

| Phase | 従来見積 | AI駆動見積 | 短縮率 |
|-------|---------|-----------|--------|
| Phase 1: PDF出力切り替え + ユーザー管理対応 | 3.5日 | 1〜1.5日 | 57-71% |
| Phase 2: Electron化（パッケージング） | 3日 | 1〜1.5日 | 50-67% |
| **合計** | 6.5日 | **2〜3日** | 54-69% |

**Phase 1 内訳**:
| タスク | AI駆動見積 |
|--------|-----------|
| 1-1 基盤実装（PDF出力切り替え） | 2〜3時間 |
| 1-2 ユーザー管理機能対応 | 3〜4時間 |
| 1-3 動作確認 | 1〜2時間 |
| 1-4 統合・調整 | 1〜2時間 |
| 1-5 ドキュメント | 1時間 |

---

## 13. その他の修正事項

### 13.1 パスワードリセットリンクの有効期限変更

**現状の問題**:
- パスワードリセットのリンクが24時間以上経っても有効になっている可能性
- セキュリティ上、長すぎる有効期限は推奨されない

**推奨設定**:

| リンク種類 | 現状 | 推奨値 |
|-----------|------|--------|
| パスワードリセット | 要確認 | **1時間（3600秒）** |
| 招待リンク | 24時間 | 24時間（現状維持でOK） |

**対応手順**:
1. Supabase Dashboard → Authentication → Providers → Email
2. 「OTP Expiry」の設定を確認・修正
3. パスワードリセットの有効期限を3600秒（1時間）に設定

**優先度**: 中（セキュリティ改善）

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-12-26 | 1.0 | 初版作成 |
| 2025-12-26 | 1.1 | 開発順序を明確化（Step 1: CubePDF対応 → Step 2: Electron化） |
| 2025-12-26 | 1.2 | CubePDF制限事項の調査結果追加、Excel直接出力方式の発見・テスト結果追加 |
| 2026-01-09 | 1.3 | 開発プロンプト（AI駆動開発用）を追加、依存関係・成功基準・ロールバック手順を明記 |
| 2026-01-13 | 1.4 | パスワードリセットリンクの有効期限変更を追加 |
| 2026-01-14 | 1.5 | Phase 1にユーザー管理機能のElectron対応（1-4）を追加。APP_MODE環境変数による招待/直接追加の切り替え、バックエンドAPI追加を明記 |
| 2026-01-15 | 1.6 | Phase 1のタスク順序を修正。機能実装を先に完了させ、動作確認・統合を後にする論理的な順序に変更 |
| 2026-01-15 | 1.7 | CubePDF参照をExcel直接出力（ExportAsFixedFormat）に全面更新。CubePDFはGUI非表示不可のため断念、調査経緯はSection 11に記録として保持 |
| 2026-01-15 | 1.8 | Phase 1のタスク番号を振り直し（1-1→1-2→1-3→1-4→1-5の順序に統一） |
| 2026-01-15 | 1.9 | Phase 11-3 動作確認の進捗更新。Excel直接PDF出力（オフ・ビート・ワークス）、ユーザー直接追加、パスワードリセットを確認。PowerShellエンコーディングエラー（cp932）を修正 |
| 2026-01-19 | 2.0 | ネクストビッツ処理の動作確認完了。ログイン後のパスワード変更機能を実装（MUI Dialog統一、バリデーション強化、自動ログアウト）。処理詳細モーダルに閉じるボタン追加。Electron版パスワード忘れダイアログ改善 |

