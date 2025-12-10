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


def calculate_formulas_with_libreoffice(excel_path: str, output_path: str) -> str:
    """
    LibreOfficeを使ってExcelの数式を計算し、計算結果を含むExcelを生成

    openpyxlは数式の計算ができないため、LibreOfficeで開いて保存することで
    数式を計算させる。

    Args:
        excel_path: 入力Excelファイルのパス
        output_path: 出力Excelファイルのパス

    Returns:
        計算済みExcelファイルのパス

    Raises:
        RuntimeError: LibreOffice変換失敗時
    """
    output_dir = os.path.dirname(output_path)

    # 元のファイルを保護するため、一時ファイルにコピーしてから変換
    # LibreOfficeは--outdirで指定したディレクトリに元のファイル名で出力するため、
    # 元のファイルが上書きされないように別のディレクトリで変換する
    import tempfile
    with tempfile.TemporaryDirectory() as temp_dir:
        # 一時ディレクトリに入力ファイルをコピー
        temp_input = os.path.join(temp_dir, "input_for_calc.xlsx")
        shutil.copy2(excel_path, temp_input)

        # LibreOfficeでxlsx形式に再保存（数式が計算される）
        result = subprocess.run(
            [
                'soffice',
                '--headless',
                '--convert-to', 'xlsx',
                '--outdir', temp_dir,
                temp_input
            ],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice計算エラー: {result.stderr}")

        # 変換後のファイルを出力パスに移動
        generated_path = os.path.join(temp_dir, "input_for_calc.xlsx")
        if os.path.exists(generated_path):
            shutil.copy2(generated_path, output_path)
        else:
            raise RuntimeError(f"LibreOffice変換後のファイルが見つかりません: {generated_path}")

    return output_path


def resolve_cross_sheet_formulas(wb: openpyxl.Workbook, source_sheet_name: str) -> None:
    """
    シート間参照の数式を、参照元の値で置き換える

    検収書シートは注文書シートを参照する数式を持っているため、
    注文書シートを削除する前に、これらの数式を値に置き換える必要がある。

    Args:
        wb: Excelワークブック
        source_sheet_name: 参照元シート名（削除されるシート）

    Note:
        - 数式内に「シート名!」が含まれるセルを検出
        - 参照元シートの該当セルの値を取得して置き換え
    """
    import re

    source_ws = wb[source_sheet_name] if source_sheet_name in wb.sheetnames else None
    if not source_ws:
        return

    for sheet_name in wb.sheetnames:
        if sheet_name == source_sheet_name:
            continue

        ws = wb[sheet_name]
        for row in ws.iter_rows():
            for cell in row:
                if cell.data_type == 'f' and cell.value:
                    formula = str(cell.value)
                    # シート参照を含む数式を検出（例: =注文書!C17, =EOMONTH(注文書!$AC$2,0)）
                    if f'{source_sheet_name}!' in formula:
                        # 参照先の値を取得して置き換え
                        # 単純な参照の場合（例: =注文書!C17）
                        simple_ref_match = re.match(rf'^={source_sheet_name}!\$?([A-Z]+)\$?(\d+)$', formula)
                        if simple_ref_match:
                            col = simple_ref_match.group(1)
                            row_num = int(simple_ref_match.group(2))
                            ref_cell = source_ws[f'{col}{row_num}']
                            cell.value = ref_cell.value
                            cell.data_type = ref_cell.data_type if ref_cell.data_type != 'f' else 'n'


def convert_sheet_to_pdf(excel_path: str, sheet_name: str, output_path: str, calculated_excel_path: str = None) -> str:
    """
    Excelの特定シートをPDFに変換

    LibreOfficeは特定シートのみのPDF出力をサポートしていないため、
    openpyxlで一時ファイルを作成し、対象シートのみを含むExcelを生成してから変換する。

    Args:
        excel_path: Excelファイルのパス
        sheet_name: 変換対象のシート名
        output_path: 出力PDFファイルのパス
        calculated_excel_path: 計算済みExcelファイルのパス（シート間参照の値取得用）

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
        # 計算済みExcelから値を読み込む（data_only=Trueで数式の計算結果を取得）
        # 注意: openpyxlのdata_only=Trueは、LibreOfficeで保存されたファイルでないと
        # 計算結果が取得できない場合がある
        if calculated_excel_path and os.path.exists(calculated_excel_path):
            wb_calc = openpyxl.load_workbook(calculated_excel_path, data_only=True)
        else:
            wb_calc = None

        # 元のExcelを読み込み（数式を保持）
        wb = openpyxl.load_workbook(excel_path)

        # すべての数式を計算済みの値に置き換える（#NAME?エラー防止）
        # これにより、シート間参照やTEXT関数などがPDFで正しく表示される
        if wb_calc:
            for ws_name in wb.sheetnames:
                if ws_name in wb_calc.sheetnames:
                    ws = wb[ws_name]
                    ws_calc = wb_calc[ws_name]

                    for row in ws.iter_rows():
                        for cell in row:
                            # 数式セルを計算結果で置き換え
                            if cell.data_type == 'f' and cell.value:
                                calc_cell = ws_calc[cell.coordinate]
                                if calc_cell.value is not None:
                                    cell.value = calc_cell.value

        if wb_calc:
            wb_calc.close()

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

    # まずLibreOfficeで数式を計算させた一時Excelを生成
    # これにより、TEXT関数やEOMONTH関数などの計算結果を取得できる
    calculated_excel_path = os.path.join(output_dir, f"calculated_{os.getpid()}.xlsx")

    try:
        # LibreOfficeで計算済みExcelを生成
        calculate_formulas_with_libreoffice(excel_path, calculated_excel_path)

        # 注文書シートをPDF変換（計算済みExcelから値を取得）
        convert_sheet_to_pdf(excel_path, "注文書", order_pdf_path, calculated_excel_path)

        # 検収書シートをPDF変換（計算済みExcelから値を取得）
        convert_sheet_to_pdf(excel_path, "検収書", inspection_pdf_path, calculated_excel_path)

        return {
            "order_pdf_path": order_pdf_path,
            "inspection_pdf_path": inspection_pdf_path
        }
    finally:
        # 計算済み一時Excelを削除
        if os.path.exists(calculated_excel_path):
            os.remove(calculated_excel_path)


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
        import traceback
        print(json.dumps({
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
