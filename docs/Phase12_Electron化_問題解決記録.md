# Phase 12 Electron化 - PDF処理エラー解決記録

**作成日**: 2026-02-06
**ステータス**: 解決済み

---

## 問題の概要

### 症状
- Electronアプリ（.exe）でPDF処理を実行すると「ファイルにアクセスできませんでした」エラーが発生
- WSL開発環境（localhost:5174）では正常に動作
- Windows exe版でのみ失敗

### エラーメッセージ
```
ファイルにアクセスできませんでした
```

Excel COM経由でファイルを開く際に発生。

---

## 原因分析

### 根本原因
PowerShellスクリプト内でファイルパスをダブルクォートでエスケープしていたため、バックスラッシュが二重エスケープされていた。

**問題のあったコード例**:
```python
ps_script = f'''
$workbook = $excel.Workbooks.Open("{excel_escaped}")
'''
```

これにより、パスが `C:\\\\Users\\\\IWAFUN~1\\\\...` のように二重エスケープされ、Excel COMがファイルを見つけられなかった。

### 追加の問題
- PyInstallerはPythonをバイトコードにコンパイルするため、`_internal`フォルダの`.py`ファイルを編集しても反映されない
- WSL環境でビルドしたものをそのままWindows exeで使用すると、パス関連の問題が発生しやすい

---

## 解決策

### 1. PowerShellスクリプトでシングルクォートを使用

**修正対象ファイル**:
- `backend/python/excel_validator.py`
- `backend/python/pdf_generator.py`

**修正内容**:

ダブルクォートでのエスケープをやめ、シングルクォートを使用してパスをリテラルとして渡す。

**修正前**:
```python
excel_escaped = win_excel_path.replace("'", "''")
ps_script = f'''
$workbook = $excel.Workbooks.Open("{excel_escaped}")
'''
```

**修正後**:
```python
ps_script = f'''
$excelPath = '{win_excel_path}'
$workbook = $excel.Workbooks.Open($excelPath)
'''
```

### 2. ネイティブWindows環境でPyInstallerビルド

WSLのパスを経由せず、純粋なWindows環境でビルドすることで、パス変換の問題を回避。

**手順**:

```cmd
# 1. Pythonファイルをネイティブ Windows にコピー
mkdir C:\temp\python-build
copy \\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\backend\python\*.py C:\temp\python-build\

# 2. PyInstallerビルド用バッチファイル作成
cd C:\temp\python-build
echo pyinstaller --onedir --name pdf_processor --add-data "pdf_parser.py;." --add-data "excel_editor.py;." --add-data "excel_validator.py;." --add-data "pdf_generator.py;." --hidden-import pdfplumber --hidden-import openpyxl --hidden-import pypdf --hidden-import dateutil --hidden-import PIL --noconfirm --clean main.py > build.bat

# 3. ビルド実行
build.bat

# 4. ビルド結果をWSLにコピー
xcopy /E /I /Y dist\pdf_processor \\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\build\python\pdf_processor
```

### 3. Electronアプリのリビルド

```cmd
# 1. ファイルをWindowsにコピー
\\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\copy-files.bat

# 2. Electronビルド
cd C:\temp\electron-build
\\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\build-electron.bat
```

---

## 最終的なビルド手順（まとめ）

### 前提条件
- Python 3.11 + 必要なライブラリがWindowsにインストール済み
- Node.js 20 がWindowsにインストール済み
- WSL環境でフロントエンド・バックエンドがビルド済み

### 完全なビルドフロー

```cmd
# Step 1: Python処理エンジンをネイティブWindowsでビルド
mkdir C:\temp\python-build
copy \\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\backend\python\*.py C:\temp\python-build\
cd C:\temp\python-build
echo pyinstaller --onedir --name pdf_processor --add-data "pdf_parser.py;." --add-data "excel_editor.py;." --add-data "excel_validator.py;." --add-data "pdf_generator.py;." --hidden-import pdfplumber --hidden-import openpyxl --hidden-import pypdf --hidden-import dateutil --hidden-import PIL --noconfirm --clean main.py > build.bat
build.bat

# Step 2: ビルド結果をWSLにコピー
xcopy /E /I /Y dist\pdf_processor \\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\build\python\pdf_processor

# Step 3: Electronビルド用にファイルをコピー
\\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\copy-files.bat

# Step 4: Electronアプリをビルド
cd C:\temp\electron-build
\\wsl$\Ubuntu\home\iwafune-hiroko\seikyu-henkan-2\build-electron.bat

# Step 5: 生成されたexeを起動
release\win-unpacked\月次処理自動化システム.exe
```

---

## 生成物

| ファイル | パス |
|---------|------|
| Portable版 exe | `C:\temp\electron-build\release\月次処理自動化システム-1.0.0-portable.exe` |
| 展開版フォルダ | `C:\temp\electron-build\release\win-unpacked\` |

---

## 教訓・ベストプラクティス

1. **PowerShellでのパス渡しはシングルクォートを使用**
   - ダブルクォートはエスケープ問題を引き起こしやすい
   - シングルクォートはリテラル文字列として扱われる

2. **PyInstallerビルドはネイティブ環境で実行**
   - WSL経由でWindows exeを作成すると、パス変換の問題が発生する可能性がある
   - ビルドはターゲット環境（Windows）で直接行うのが確実

3. **PyInstallerの変更反映**
   - `.py`ファイルを編集してもexe内のバイトコードは更新されない
   - 変更後は必ず`--clean`オプション付きで再ビルドが必要

---

## 関連ファイル

- `backend/python/excel_validator.py` - Excel検証（COM使用）
- `backend/python/pdf_generator.py` - PDF生成（Excel COM使用）
- `build-python.bat` - PyInstallerビルドスクリプト
- `build-electron.bat` - Electronビルドスクリプト
- `copy-files.bat` - ファイルコピースクリプト

---

**更新履歴**:
- 2026-02-06: 初版作成（PDF処理エラー解決）
