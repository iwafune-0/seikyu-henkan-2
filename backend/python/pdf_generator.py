#!/usr/bin/env python3
"""
PDF生成スクリプト（LibreOffice使用）

ExcelファイルをPDFに変換します。
LibreOfficeのコマンドラインツール（soffice）を使用します。

使用法:
    python3 pdf_generator.py <excel_path> <output_dir>

引数:
    excel_path: ExcelファイルのパスGithub
    output_dir: 出力ディレクトリのパス

出力:
    生成されたPDFファイルのパス（標準出力）
"""

import sys
import json
import subprocess
import os
from pathlib import Path


def check_libreoffice() -> bool:
    """
    LibreOfficeがインストールされているかチェック

    Returns:
        インストール済みならTrue、未インストールならFalse
    """
    try:
        # soffice --version でバージョン情報が取得できるかチェック
        result = subprocess.run(
            ['soffice', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def convert_excel_to_pdf(excel_path: str, output_dir: str) -> str:
    """
    ExcelファイルをPDFに変換

    Args:
        excel_path: ExcelファイルのパスGithub
        output_dir: 出力ディレクトリのパス

    Returns:
        生成されたPDFファイルのパス

    Raises:
        RuntimeError: LibreOffice未インストールまたは変換失敗時
    """
    # LibreOfficeチェック
    if not check_libreoffice():
        raise RuntimeError(
            "LibreOfficeがインストールされていません。\n"
            "ローカル開発環境ではモック動作となります。\n"
            "本番環境（AWS Lambda Docker Image）ではLibreOfficeを含むイメージを使用してください。"
        )

    try:
        # soffice --headless --convert-to pdf --outdir <output_dir> <excel_path>
        result = subprocess.run(
            [
                'soffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', output_dir,
                excel_path
            ],
            capture_output=True,
            text=True,
            timeout=60  # 60秒タイムアウト
        )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice変換エラー: {result.stderr}")

        # 生成されたPDFファイルのパスを推測
        excel_filename = Path(excel_path).stem
        pdf_path = os.path.join(output_dir, f"{excel_filename}.pdf")

        if not os.path.exists(pdf_path):
            raise RuntimeError(f"PDFファイルが生成されませんでした: {pdf_path}")

        return pdf_path

    except subprocess.TimeoutExpired:
        raise RuntimeError("PDF変換がタイムアウトしました（60秒以内に完了しませんでした）")
    except Exception as e:
        raise RuntimeError(f"PDF変換エラー: {str(e)}") from e


def main():
    """
    メイン関数

    コマンドライン引数からExcelパスを受け取り、PDF変換結果のパスを標準出力に返す。
    """
    if len(sys.argv) != 3:
        print(json.dumps({
            "error": "引数が不足しています",
            "usage": "python3 pdf_generator.py <excel_path> <output_dir>"
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    excel_path = sys.argv[1]
    output_dir = sys.argv[2]

    try:
        # PDF生成
        pdf_path = convert_excel_to_pdf(excel_path, output_dir)

        # 成功時は出力パスをJSON形式で返す
        print(json.dumps({
            "success": True,
            "pdf_path": pdf_path
        }, ensure_ascii=False))

    except Exception as e:
        # エラー時はエラー情報をJSON形式で返す
        print(json.dumps({
            "error": str(e),
            "error_type": type(e).__name__
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
