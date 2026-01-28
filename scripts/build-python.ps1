# Python処理をexe化するビルドスクリプト
#
# 使用法:
#   pwsh scripts/build-python.ps1
#
# 前提条件:
#   - Python 3.11以降がインストールされていること
#   - pip が利用可能であること

$ErrorActionPreference = "Stop"

Write-Host "=== Python処理のビルド開始 ===" -ForegroundColor Cyan

# ディレクトリ設定
$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonDir = Join-Path $projectRoot "backend/python"
$outputDir = Join-Path $projectRoot "build/python"

Write-Host "プロジェクトルート: $projectRoot"
Write-Host "Python処理ディレクトリ: $pythonDir"
Write-Host "出力ディレクトリ: $outputDir"

# 出力ディレクトリ作成
if (Test-Path $outputDir) {
    Write-Host "既存の出力ディレクトリを削除中..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $outputDir
}
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# 依存パッケージインストール
Write-Host "`n[1/4] 依存パッケージのインストール..." -ForegroundColor Yellow
pip install pyinstaller pdfplumber openpyxl python-dateutil pypdf --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: 依存パッケージのインストールに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "依存パッケージのインストール完了" -ForegroundColor Green

# PyInstallerでexe化
Write-Host "`n[2/4] PyInstallerでビルド中..." -ForegroundColor Yellow

$entryPoint = Join-Path $pythonDir "main.py"
$workPath = Join-Path $outputDir "_work"
$specPath = Join-Path $outputDir "_spec"

# PyInstaller引数
$pyinstallerArgs = @(
    "--onedir",
    "--name", "pdf_processor",
    "--distpath", $outputDir,
    "--workpath", $workPath,
    "--specpath", $specPath,
    "--add-data", "${pythonDir}/pdf_parser.py;.",
    "--add-data", "${pythonDir}/excel_editor.py;.",
    "--add-data", "${pythonDir}/excel_validator.py;.",
    "--add-data", "${pythonDir}/pdf_generator.py;.",
    "--hidden-import", "pdfplumber",
    "--hidden-import", "openpyxl",
    "--hidden-import", "pypdf",
    "--hidden-import", "dateutil",
    "--hidden-import", "PIL",
    "--noconfirm",
    "--clean",
    $entryPoint
)

Write-Host "PyInstaller実行中..."
pyinstaller @pyinstallerArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: PyInstallerビルドに失敗しました" -ForegroundColor Red
    exit 1
}
Write-Host "PyInstallerビルド完了" -ForegroundColor Green

# クリーンアップ
Write-Host "`n[3/4] クリーンアップ..." -ForegroundColor Yellow
if (Test-Path $workPath) {
    Remove-Item -Recurse -Force $workPath -ErrorAction SilentlyContinue
}
if (Test-Path $specPath) {
    Remove-Item -Recurse -Force $specPath -ErrorAction SilentlyContinue
}
Write-Host "クリーンアップ完了" -ForegroundColor Green

# 動作確認
Write-Host "`n[4/4] 動作確認..." -ForegroundColor Yellow
$exePath = Join-Path $outputDir "pdf_processor/pdf_processor.exe"

if (Test-Path $exePath) {
    Write-Host "実行ファイル: $exePath" -ForegroundColor Cyan

    # ヘルプを表示して動作確認
    Write-Host "`nヘルプ表示テスト:"
    & $exePath --help

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n=== ビルド完了 ===" -ForegroundColor Green
        Write-Host "出力: $outputDir/pdf_processor/"
        Write-Host "実行ファイル: pdf_processor.exe"
    } else {
        Write-Host "WARNING: 動作確認でエラーが発生しました" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: 実行ファイルが見つかりません: $exePath" -ForegroundColor Red
    exit 1
}
