#!/usr/bin/env python3
"""
PDF生成スクリプト（LibreOffice使用）

Excelファイルの各シートを個別のPDFに変換します。
LibreOfficeのコマンドラインツール（soffice）を使用します。

使用法:
    python3 pdf_generator.py <excel_path> <output_dir>

引数:
    excel_path: Excelファイルのパス
    output_dir: 出力ディレクトリのパス

出力:
    生成されたPDFファイルのパス（JSON形式、標準出力）
    {
        "success": true,
        "order_pdf_path": "/tmp/注文書.pdf",
        "inspection_pdf_path": "/tmp/検収書.pdf"
    }

処理ルール（docs/processing_rules.md）:
    - 注文書シートを「注文書_YYMM.pdf」として出力
    - 検収書シートを「検収書_YYMM.pdf」として出力
"""

import sys
import json
import subprocess
import os
import shutil
from pathlib import Path
import openpyxl
from typing import Dict, Any


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


def convert_sheet_to_pdf(excel_path: str, sheet_name: str, output_path: str) -> str:
    """
    Excelの特定シートをPDFに変換

    LibreOfficeは特定シートのみのPDF出力をサポートしていないため、
    openpyxlで一時ファイルを作成し、対象シートのみを含むExcelを生成してから変換する。

    Args:
        excel_path: Excelファイルのパス
        sheet_name: 変換対象のシート名
        output_path: 出力PDFファイルのパス

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

    # 一時ファイルパスを生成
    output_dir = os.path.dirname(output_path)
    temp_excel_path = os.path.join(output_dir, f"temp_{sheet_name}_{os.getpid()}.xlsx")

    try:
        # 元のExcelを読み込み
        wb = openpyxl.load_workbook(excel_path)

        # 対象シートのみを残す
        sheets_to_remove = [s for s in wb.sheetnames if s != sheet_name]
        for s in sheets_to_remove:
            del wb[s]

        # 一時Excelとして保存
        wb.save(temp_excel_path)
        wb.close()

        # LibreOfficeでPDF変換
        result = subprocess.run(
            [
                'soffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', output_dir,
                temp_excel_path
            ],
            capture_output=True,
            text=True,
            timeout=60  # 60秒タイムアウト
        )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice変換エラー: {result.stderr}")

        # 生成されたPDFファイルのパスを推測（LibreOfficeは元ファイル名.pdfで出力）
        temp_pdf_path = os.path.join(output_dir, f"temp_{sheet_name}_{os.getpid()}.pdf")

        if not os.path.exists(temp_pdf_path):
            raise RuntimeError(f"PDFファイルが生成されませんでした: {temp_pdf_path}")

        # 出力パスにリネーム
        shutil.move(temp_pdf_path, output_path)

        return output_path

    except subprocess.TimeoutExpired:
        raise RuntimeError("PDF変換がタイムアウトしました（60秒以内に完了しませんでした）")
    except Exception as e:
        raise RuntimeError(f"PDF変換エラー: {str(e)}") from e
    finally:
        # 一時ファイル削除
        if os.path.exists(temp_excel_path):
            os.remove(temp_excel_path)


def convert_excel_sheets_to_pdf(excel_path: str, output_dir: str) -> Dict[str, str]:
    """
    Excelファイルの注文書シートと検収書シートをそれぞれPDFに変換

    Args:
        excel_path: Excelファイルのパス
        output_dir: 出力ディレクトリのパス

    Returns:
        生成されたPDFファイルのパス辞書
        {
            "order_pdf_path": "/tmp/order.pdf",
            "inspection_pdf_path": "/tmp/inspection.pdf"
        }

    Raises:
        RuntimeError: 変換失敗時
    """
    # 出力パスを生成
    order_pdf_path = os.path.join(output_dir, f"order_{os.getpid()}.pdf")
    inspection_pdf_path = os.path.join(output_dir, f"inspection_{os.getpid()}.pdf")

    # 注文書シートをPDF変換
    convert_sheet_to_pdf(excel_path, "注文書", order_pdf_path)

    # 検収書シートをPDF変換
    convert_sheet_to_pdf(excel_path, "検収書", inspection_pdf_path)

    return {
        "order_pdf_path": order_pdf_path,
        "inspection_pdf_path": inspection_pdf_path
    }


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
        # PDF生成（注文書・検収書シートをそれぞれPDFに変換）
        result = convert_excel_sheets_to_pdf(excel_path, output_dir)

        # 成功時は出力パスをJSON形式で返す
        print(json.dumps({
            "success": True,
            "order_pdf_path": result["order_pdf_path"],
            "inspection_pdf_path": result["inspection_pdf_path"]
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
