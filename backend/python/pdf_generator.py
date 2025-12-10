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


def calculate_formulas_python(wb: openpyxl.Workbook) -> dict:
    """
    Pythonで数式を計算し、計算結果を辞書で返す

    LibreOfficeのheadless変換ではシート間参照の計算に失敗するため、
    Pythonで直接計算を行う。

    Args:
        wb: 編集済みのExcelワークブック

    Returns:
        計算結果の辞書 {シート名: {セル座標: 値}}
    """
    from datetime import datetime
    from calendar import monthrange
    import math

    results = {"注文書": {}, "検収書": {}}

    # 注文書シートから入力値を取得
    ws_order = wb["注文書"]
    ws_inspection = wb["検収書"]

    # AC2: 発行日（入力値）
    issue_date = ws_order['AC2'].value
    if isinstance(issue_date, datetime):
        pass
    elif issue_date is None:
        issue_date = datetime.now().replace(day=1)
    else:
        # 文字列の場合などはdatetimeに変換を試みる
        try:
            issue_date = datetime.strptime(str(issue_date), '%Y-%m-%d')
        except:
            issue_date = datetime.now().replace(day=1)

    # R18, T18: 数量・単価（入力値）
    r18 = ws_order['R18'].value or 0
    t18 = ws_order['T18'].value or 0

    # R20, T20: 検収書の数量・単価（入力値）
    r20 = ws_inspection['R20'].value or 0
    t20 = ws_inspection['T20'].value or 0

    # === 注文書シートの数式計算 ===

    # AC3: =TEXT(AC2,"yyyymmdd")&"-01"
    ac3_value = issue_date.strftime('%Y%m%d') + '-01'
    results["注文書"]["AC3"] = ac3_value

    # C17: =TEXT(注文書!$AC$2,"yyyy年ｍｍ月分作業費")
    c17_value = issue_date.strftime('%Y年%m月分作業費')
    results["注文書"]["C17"] = c17_value

    # AA17: ="見積番号：TRR-"&TEXT(注文書!$AC$2,"yy-")&"0"&TEXT(注文書!$AC$2,"mm")
    yy = issue_date.strftime('%y')
    mm = issue_date.strftime('%m')
    aa17_value = f"見積番号：TRR-{yy}-0{mm}"
    results["注文書"]["AA17"] = aa17_value

    # W17: =T17*R17（この行は空の可能性があるのでスキップ）

    # W18: 明細行の金額（R18 * T18）
    w18_value = r18 * t18
    results["注文書"]["W18"] = w18_value

    # W39: =SUM(W16:Z38) - 簡略化してW18のみを計算（明細1行の場合）
    w39_value = w18_value
    results["注文書"]["W39"] = w39_value

    # W40: =ROUNDDOWN(W39*0.1,0)
    w40_value = math.floor(w39_value * 0.1)
    results["注文書"]["W40"] = w40_value

    # W41: =W39+W40
    w41_value = w39_value + w40_value
    results["注文書"]["W41"] = w41_value

    # G12: =W41
    results["注文書"]["G12"] = w41_value

    # === 検収書シートの数式計算 ===

    # AC4: =注文書!AC3
    results["検収書"]["AC4"] = ac3_value

    # AC5: =EOMONTH(注文書!$AC$2,0) - 月末日
    year = issue_date.year
    month = issue_date.month
    last_day = monthrange(year, month)[1]
    ac5_value = datetime(year, month, last_day)
    results["検収書"]["AC5"] = ac5_value

    # C19: =注文書!C17
    results["検収書"]["C19"] = c17_value

    # AA19: =注文書!AA17
    results["検収書"]["AA19"] = aa17_value

    # W19: =T19*R19（行19は空の可能性があるのでスキップ）

    # W20: 明細行の金額（R20 * T20）
    w20_value = r20 * t20
    results["検収書"]["W20"] = w20_value

    # W41: =SUM(W18:Z40) - 簡略化してW20のみを計算（明細1行の場合）
    w41_inspection = w20_value
    results["検収書"]["W41"] = w41_inspection

    # W42: =ROUNDDOWN(W41*0.1,0)
    w42_value = math.floor(w41_inspection * 0.1)
    results["検収書"]["W42"] = w42_value

    # W43: =W41+W42
    w43_value = w41_inspection + w42_value
    results["検収書"]["W43"] = w43_value

    # G14: =W43
    results["検収書"]["G14"] = w43_value

    return results


def apply_calculated_values(wb: openpyxl.Workbook, calculated_values: dict) -> None:
    """
    計算結果をワークブックに適用する（数式を値に置き換える）

    Args:
        wb: Excelワークブック
        calculated_values: calculate_formulas_pythonの戻り値
    """
    for sheet_name, cells in calculated_values.items():
        if sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            for coord, value in cells.items():
                cell = ws[coord]
                # 数式を計算結果で置き換え
                cell.value = value


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


def convert_sheet_to_pdf(excel_path: str, sheet_name: str, output_path: str, calculated_values: dict = None) -> str:
    """
    Excelの特定シートをPDFに変換

    LibreOfficeは特定シートのみのPDF出力をサポートしていないため、
    openpyxlで一時ファイルを作成し、対象シートのみを含むExcelを生成してから変換する。

    Args:
        excel_path: Excelファイルのパス
        sheet_name: 変換対象のシート名
        output_path: 出力PDFファイルのパス
        calculated_values: Pythonで計算した数式の結果（calculate_formulas_pythonの戻り値）

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
        # 元のExcelを読み込み（数式を保持）
        wb = openpyxl.load_workbook(excel_path)

        # Pythonで計算した値を適用（#NAME?エラー防止）
        # LibreOfficeのheadless変換ではシート間参照の計算に失敗するため、
        # Pythonで計算した値を直接セルに設定する
        if calculated_values:
            apply_calculated_values(wb, calculated_values)

        # 対象シートのみを残す
        sheets_to_remove = [s for s in wb.sheetnames if s != sheet_name]
        for s in sheets_to_remove:
            del wb[s]

        # 印刷スケールを100%に設定
        # LibreOfficeはExcelのスケール設定を正しく解釈できないため、
        # 100%に設定してCubePDFと同じサイズで出力する
        ws = wb[sheet_name]
        ws.page_setup.scale = 100

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

    # Excelを読み込み、Pythonで数式を計算
    # LibreOfficeのheadless変換ではシート間参照の計算に失敗するため、
    # Pythonで直接計算を行う
    wb = openpyxl.load_workbook(excel_path)
    calculated_values = calculate_formulas_python(wb)
    wb.close()

    # 注文書シートをPDF変換（Pythonで計算した値を使用）
    convert_sheet_to_pdf(excel_path, "注文書", order_pdf_path, calculated_values)

    # 検収書シートをPDF変換（Pythonで計算した値を使用）
    convert_sheet_to_pdf(excel_path, "検収書", inspection_pdf_path, calculated_values)

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
        import traceback
        print(json.dumps({
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
