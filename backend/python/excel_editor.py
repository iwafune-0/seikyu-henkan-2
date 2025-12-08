#!/usr/bin/env python3
"""
Excel編集スクリプト（openpyxl使用）

テンプレートExcelにPDF解析データを転記し、新しいExcelファイルを生成します。
数式は保持され、自動計算されます。

使用法:
    python3 excel_editor.py <company_name> <template_path> <output_path> <data_json>

引数:
    company_name: 取引先名（ネクストビッツ or オフ・ビート・ワークス）
    template_path: テンプレートExcelファイルのパス
    output_path: 出力Excelファイルのパス
    data_json: PDF解析データ（JSON文字列）

出力:
    編集済みExcelファイルのパス（標準出力）

処理ルール（2025-12-08確定）:
    ネクストビッツ:
        注文書シート:
            - AC2: 発行日（1ヶ月加算して当月1日）
            - R17: 数量（見積書から）
            - T17: 単価（見積書から）
        検収書シート:
            - R19: 数量（見積書から）
            - T19: 単価（見積書から）

    オフ・ビート・ワークス:
        注文書シート:
            - AC2: 発行日（注文請書の発行日）
            - R17~: 明細行（請求書から、複数行対応）
            - T17~: 単価（請求書から）
            - AC17~: 摘要（見積書番号）
        検収書シート:
            - R19~: 明細行（請求書から）
            - T19~: 単価（請求書から）
"""

import sys
import json
import openpyxl
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import Dict, Any, List


def edit_nextbits_excel(wb: openpyxl.Workbook, data: Dict[str, Any]) -> None:
    """
    ネクストビッツ様のExcel編集

    実際のExcel構造（テラ【株式会社ネクストビッツ御中】注文検収書_YYMM.xlsx）:
    - シート: 注文書, 検収書

    注文書シート:
    - AC2: 発行日（編集: 見積書ファイル名から処理対象月を抽出し、当月1日を入力）
    - AC3: 注文番号（数式: 自動計算）
    - R18: 数量（編集: 見積書から）
    - T18: 単価（編集: 見積書から）
    - W18: 金額（数式: 自動計算）
    - AA17: 摘要（数式: 自動計算）

    検収書シート:
    - AC4: 検収番号（数式: 自動計算）
    - AC5: 検収日（数式: 自動計算）
    - R20: 数量（編集: 見積書から）
    - T20: 単価（編集: 見積書から）
    - W20: 金額（数式: 自動計算）
    - AA19: 摘要（数式: 自動計算）
    """
    ws_order = wb["注文書"]
    ws_inspection = wb["検収書"]

    # 見積書データを取得
    estimate_data = data.get('estimate', {})
    quantity = estimate_data.get('quantity', 1)
    unit_price = estimate_data.get('unit_price', 0)

    # === 注文書シート編集 ===

    # 発行日: 見積書ファイル名から処理対象月を抽出（TRR-YY-MMM → 20YY年MM月1日）
    # estimate_filenameはprocessServiceから渡される
    estimate_filename = data.get('estimate_filename', '')
    issue_date = None

    if estimate_filename:
        # ファイル名パターン: TRR-YY-MMM_お見積書.pdf（例: TRR-25-007 → 2025年7月1日）
        import re
        match = re.search(r'TRR-(\d{2})-(\d{3})', estimate_filename)
        if match:
            year = 2000 + int(match.group(1))  # YY → 20YY
            month = int(match.group(2))  # MMM → MM（007 → 7）
            issue_date = datetime(year, month, 1)

    if not issue_date:
        # ファイル名から取得できない場合は今月の1日
        issue_date = datetime.now().replace(day=1)

    # 発行日を更新
    ws_order['AC2'] = issue_date

    # 数量を更新（R18）
    ws_order['R18'] = quantity

    # 単価を更新（T18）
    ws_order['T18'] = unit_price

    # === 検収書シート編集 ===
    # 注: 検収書のAC4, AC5, AA19は注文書シートを参照する数式なので自動更新される

    # 数量を更新（R20）
    ws_inspection['R20'] = quantity

    # 単価を更新（T20）
    ws_inspection['T20'] = unit_price


def edit_offbeat_excel(wb: openpyxl.Workbook, data: Dict[str, Any]) -> None:
    """
    オフ・ビート・ワークス様のExcel編集

    実際のExcel構造（テラ【株式会社オフ・ビート・ワークス御中】注文検収書_YYMM.xlsx）:
    - シート: 注文書, 検収書

    注文書シート:
    - AC2: 発行日（編集: 注文請書の発行日）
    - AC3: 注文番号（数式: 自動計算）
    - AA17: 摘要（編集: 見積書番号を「見積番号：NNNNNNN」形式で入力）
    - C18~: 件名（編集: 請求書の品目、先頭に「・」を付ける）
    - R18~: 数量（編集: 請求書の明細から、複数行対応）
    - T18~: 単価（編集: 請求書の明細から）

    検収書シート:
    - AC4: 検収番号（数式: 自動計算）
    - AC5: 検収日（数式: 自動計算）
    - AA19: 摘要（数式: =注文書!AA17 で自動計算）
    - C20~: 件名（編集: 請求書の品目、先頭に「・」を付ける）
    - R20~: 数量（編集: 請求書の明細から）
    - T20~: 単価（編集: 請求書の明細から）
    """
    ws_order = wb["注文書"]
    ws_inspection = wb["検収書"]

    # 各PDFからのデータを取得
    estimate_data = data.get('estimate', {})
    invoice_data = data.get('invoice', {})
    order_confirmation_data = data.get('order_confirmation', {})

    # === 注文書シート編集 ===

    # 発行日（注文請書の発行日から）
    issue_date_str = order_confirmation_data.get('issue_date', '')
    if issue_date_str:
        try:
            issue_date = datetime.strptime(issue_date_str, '%Y-%m-%d')
            ws_order['AC2'] = issue_date
        except ValueError:
            pass  # パースエラーの場合は元の値を保持

    # 見積書番号（摘要用）: 「見積番号：NNNNNNN」形式で入力
    estimate_number = estimate_data.get('estimate_number', '')
    if estimate_number:
        ws_order['AA17'] = f"見積番号：{estimate_number}"

    # 明細行（請求書から）
    items: List[Dict[str, Any]] = invoice_data.get('items', [])

    if items:
        # 明細行を編集（最大行数は適宜調整）
        for i, item in enumerate(items):
            row_order = 18 + i  # 注文書の明細開始行（R18, C18から）
            row_inspection = 20 + i  # 検収書の明細開始行（R20, C20から）

            # 注文書シート
            ws_order.cell(row=row_order, column=18).value = item.get('quantity', 1)  # R列（18列目）
            ws_order.cell(row=row_order, column=20).value = item.get('unit_price', 0)  # T列（20列目）

            # 件名（品目に「・」を付ける）
            item_name = item.get('name', '')
            if item_name and not item_name.startswith('・'):
                item_name = '・' + item_name
            ws_order.cell(row=row_order, column=3).value = item_name  # C列（3列目）

            # 検収書シート
            ws_inspection.cell(row=row_inspection, column=18).value = item.get('quantity', 1)  # R列
            ws_inspection.cell(row=row_inspection, column=20).value = item.get('unit_price', 0)  # T列

            # 件名（品目に「・」を付ける）
            ws_inspection.cell(row=row_inspection, column=3).value = item_name  # C列

        # 明細最終行の次の行に「以下、余白」を入力
        last_row_order = 18 + len(items)
        last_row_inspection = 20 + len(items)
        ws_order.cell(row=last_row_order, column=3).value = "以下、余白"
        ws_inspection.cell(row=last_row_inspection, column=3).value = "以下、余白"

    else:
        # 明細がない場合（単一明細の場合）
        # 請求書の合計から単一明細として処理
        subtotal = invoice_data.get('subtotal', 0)
        if subtotal > 0:
            ws_order['R18'] = 1
            ws_order['T18'] = subtotal

            ws_inspection['R20'] = 1
            ws_inspection['T20'] = subtotal

            # 「以下、余白」を入力
            ws_order['C19'] = "以下、余白"
            ws_inspection['C21'] = "以下、余白"


def validate_totals(wb: openpyxl.Workbook, data: Dict[str, Any], company_name: str) -> Dict[str, Any]:
    """
    Excel計算結果と請求書の金額を照合

    Returns:
        検証結果（一致/不一致、差分情報）
    """
    invoice_data = data.get('invoice', {})
    invoice_total = invoice_data.get('total', 0)
    invoice_subtotal = invoice_data.get('subtotal', 0)
    invoice_tax = invoice_data.get('tax', 0)

    # Excel側の合計を取得（openpyxlは数式の計算結果を取得できないため、
    # 実際の検証はLibreOfficeでPDF生成時に行う）

    return {
        "invoice_total": invoice_total,
        "invoice_subtotal": invoice_subtotal,
        "invoice_tax": invoice_tax,
        "note": "数式の計算結果はLibreOfficeでPDF生成時に検証"
    }


def edit_excel(company_name: str, template_path: str, output_path: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Excelテンプレートにデータを転記

    Args:
        company_name: 取引先名
        template_path: テンプレートExcelファイルのパス
        output_path: 出力Excelファイルのパス
        data: PDF解析データ（辞書型）

    Returns:
        編集結果（パス、検証結果を含む）
    """
    try:
        # テンプレートExcelを読み込み
        wb = openpyxl.load_workbook(template_path)

        # 取引先ごとの編集処理
        if company_name == "ネクストビッツ":
            edit_nextbits_excel(wb, data)
        elif company_name == "オフ・ビート・ワークス":
            edit_offbeat_excel(wb, data)
        else:
            raise ValueError(f"未対応の取引先: {company_name}")

        # 金額の検証
        validation = validate_totals(wb, data, company_name)

        # 編集済みExcelを保存
        wb.save(output_path)

        return {
            "success": True,
            "output_path": output_path,
            "validation": validation
        }

    except Exception as e:
        raise RuntimeError(f"Excel編集エラー: {str(e)}") from e


def main():
    """
    メイン関数

    コマンドライン引数からExcel情報を受け取り、編集結果のパスを標準出力に返す。
    """
    if len(sys.argv) != 5:
        print(json.dumps({
            "error": "引数が不足しています",
            "usage": "python3 excel_editor.py <company_name> <template_path> <output_path> <data_json>"
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    company_name = sys.argv[1]
    template_path = sys.argv[2]
    output_path = sys.argv[3]
    data_json = sys.argv[4]

    try:
        # JSON文字列をパース
        data = json.loads(data_json)

        # Excel編集
        result = edit_excel(company_name, template_path, output_path, data)

        # 成功時は結果をJSON形式で返す
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        # エラー時はエラー情報をJSON形式で返す
        print(json.dumps({
            "error": str(e),
            "error_type": type(e).__name__
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
