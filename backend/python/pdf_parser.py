#!/usr/bin/env python3
"""
PDF解析スクリプト（pdfplumber使用）

4種類のPDF（見積書・請求書・注文請書・納品書）からデータを抽出し、JSON形式で出力します。

使用法:
    python3 pdf_parser.py <company_name> <pdf_type> <pdf_path>

引数:
    company_name: 取引先名（ネクストビッツ or オフ・ビート・ワークス）
    pdf_type: PDF種別（estimate/invoice/order_confirmation/delivery）
    pdf_path: PDFファイルのパス

出力:
    JSON形式の抽出データ（標準出力）

処理ルール（2025-12-08確定）:
    ネクストビッツ:
        - 見積書: 見積番号（No.TRR-XX-XXX）・数量・単価を抽出
        - 請求書: 合計金額のチェック用
        - 注文請書・納品書: 保存のみ（データ抽出なし）

    オフ・ビート・ワークス:
        - 見積書: 見積書番号を抽出
        - 請求書: 明細（品目・数量・単価）・合計金額を抽出
        - 注文請書: 発行日を抽出
        - 納品書: 保存のみ（データ抽出なし）
"""

import sys
import json
import pdfplumber
import re
from typing import Dict, Any, List


def extract_nextbits_estimate(pdf_path: str) -> Dict[str, Any]:
    """
    ネクストビッツ様の見積書からデータ抽出

    実際のPDF構造（TRR-25-007_お見積書.pdf等）:
    - No.TRR-25-007 （見積番号）
    - 件名：2025年07月作業：Telemasシステム改修作業等
    - □システム改修作業費  1式  600,000  600,000
    - 合計金額  600,000

    抽出項目:
    - estimate_number: 見積番号（TRR-25-007）
    - subject: 件名（yyyy年mm月作業：Telemasシステム改修作業等）
    - quantity: 数量（1）
    - unit_price: 単価（600000）
    """
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()

        # 見積番号抽出（例: "No.TRR-25-007" → "TRR-25-007"）
        estimate_no_match = re.search(r'No\.(TRR-\d{2}-\d{3})', text)
        estimate_number = estimate_no_match.group(1) if estimate_no_match else ""

        # 件名抽出（例: "件名：2025年07月作業：Telemasシステム改修作業等"）
        subject_match = re.search(r'件名[：:]\s*(.+)', text)
        subject = subject_match.group(1).strip() if subject_match else ""

        # 数量抽出（"1式" → 1）
        # 明細行のパターン: □システム改修作業費  1式  600,000  600,000
        quantity_match = re.search(r'(\d+)式', text)
        quantity = int(quantity_match.group(1)) if quantity_match else 1

        # 単価抽出（明細行の単価部分: 1式の後の金額）
        # パターン: "1式 600,000 600,000" の最初の金額が単価
        unit_price_match = re.search(r'\d+式\s+([\d,]+)', text)
        unit_price = int(unit_price_match.group(1).replace(',', '')) if unit_price_match else 0

        return {
            "estimate_number": estimate_number,
            "subject": subject,
            "quantity": quantity,
            "unit_price": unit_price
        }


def extract_nextbits_invoice(pdf_path: str) -> Dict[str, Any]:
    """
    ネクストビッツ様の請求書からデータ抽出（チェック用）

    実際のPDF構造（TRR-25-007_請求書.pdf等）:
    - No.TRR-25-007
    - 消費税10%対象  600,000
    - 消費税(10%)  60,000
    - 合計金額  660,000

    抽出項目:
    - total: 合計金額（税込）
    - subtotal: 小計（消費税10%対象）
    - tax: 消費税
    """
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()

        # 合計金額抽出（税込）
        total_match = re.search(r'合計金額\s*([\d,]+)', text)
        total = int(total_match.group(1).replace(',', '')) if total_match else 0

        # 小計抽出（消費税10%対象）
        subtotal_match = re.search(r'消費税10%対象\s*([\d,]+)', text)
        subtotal = int(subtotal_match.group(1).replace(',', '')) if subtotal_match else 0

        # 消費税抽出
        tax_match = re.search(r'消費税\(10%\)\s*([\d,]+)', text)
        tax = int(tax_match.group(1).replace(',', '')) if tax_match else 0

        return {
            "total": total,
            "subtotal": subtotal,
            "tax": tax
        }


def extract_offbeat_estimate(pdf_path: str) -> Dict[str, Any]:
    """
    オフ・ビート・ワークス様の見積書からデータ抽出

    実際のPDF構造（*-見積-offbeat-to-terra-*.pdf）:
    - 見積書番号: 1951020（ヘッダー部分）

    抽出項目:
    - estimate_number: 見積書番号
    """
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()

        # 見積書番号抽出（ファイル名から取得する方が確実な場合もある）
        # PDFテキストから「見積書番号」または番号パターンを探す
        estimate_no_match = re.search(r'見積書番号[：:\s]*(\d+)', text)
        if not estimate_no_match:
            # 別パターン: 数字7桁のパターン
            estimate_no_match = re.search(r'(\d{7})', text)
        estimate_number = estimate_no_match.group(1) if estimate_no_match else ""

        return {
            "estimate_number": estimate_number
        }


def extract_offbeat_invoice(pdf_path: str) -> Dict[str, Any]:
    """
    オフ・ビート・ワークス様の請求書からデータ抽出

    実際のPDF構造（*-請求_offbeat-to-terra-*.pdf）:
    - 明細行（複数行あり得る）
    - 合計金額

    抽出項目:
    - items: 明細行リスト（品目、数量、単価）
    - total: 合計金額（税込）
    - subtotal: 小計
    - tax: 消費税
    """
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()

        # 明細行の抽出（品目・数量・単価）
        # オフ・ビート・ワークスの請求書は複数行の明細がある場合がある
        items: List[Dict[str, Any]] = []

        # 明細行パターン: 品目名  数量  単価  金額
        # 例: "SES業務 2025年7月分  1  150,000  150,000"
        item_pattern = re.compile(r'([^\d\n]+?)\s+(\d+)\s+([\d,]+)\s+([\d,]+)')
        for match in item_pattern.finditer(text):
            item_name = match.group(1).strip()
            # ヘッダー行やフッター行を除外
            if item_name and '品目' not in item_name and '合計' not in item_name:
                items.append({
                    "name": item_name,
                    "quantity": int(match.group(2)),
                    "unit_price": int(match.group(3).replace(',', '')),
                    "amount": int(match.group(4).replace(',', ''))
                })

        # 合計金額抽出（税込）
        total_match = re.search(r'合計金額\s*([\d,]+)', text)
        if not total_match:
            total_match = re.search(r'合計\s*([\d,]+)', text)
        total = int(total_match.group(1).replace(',', '')) if total_match else 0

        # 小計抽出
        subtotal_match = re.search(r'小計\s*([\d,]+)', text)
        subtotal = int(subtotal_match.group(1).replace(',', '')) if subtotal_match else 0

        # 消費税抽出
        tax_match = re.search(r'消費税[（(]?10%[）)]?\s*([\d,]+)', text)
        if not tax_match:
            tax_match = re.search(r'消費税\s*([\d,]+)', text)
        tax = int(tax_match.group(1).replace(',', '')) if tax_match else 0

        return {
            "items": items,
            "total": total,
            "subtotal": subtotal,
            "tax": tax
        }


def extract_offbeat_order_confirmation(pdf_path: str) -> Dict[str, Any]:
    """
    オフ・ビート・ワークス様の注文請書からデータ抽出

    実際のPDF構造（請書_offbeat-to-terra-*.pdf）:
    - 発行日

    抽出項目:
    - issue_date: 発行日（YYYY-MM-DD形式）
    """
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()

        # 発行日抽出（複数パターンに対応）
        # パターン1: "2025年7月15日"
        date_match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', text)
        if date_match:
            year = date_match.group(1)
            month = date_match.group(2).zfill(2)
            day = date_match.group(3).zfill(2)
            issue_date = f"{year}-{month}-{day}"
        else:
            # パターン2: "2025/7/15"
            date_match = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', text)
            if date_match:
                year = date_match.group(1)
                month = date_match.group(2).zfill(2)
                day = date_match.group(3).zfill(2)
                issue_date = f"{year}-{month}-{day}"
            else:
                issue_date = ""

        return {
            "issue_date": issue_date
        }


def parse_pdf(company_name: str, pdf_type: str, pdf_path: str) -> Dict[str, Any]:
    """
    PDFファイルを解析してデータを抽出

    Args:
        company_name: 取引先名（ネクストビッツ or オフ・ビート・ワークス）
        pdf_type: PDF種別（estimate/invoice/order_confirmation/delivery）
        pdf_path: PDFファイルのパス

    Returns:
        抽出データのJSON（辞書型）
    """
    try:
        # ネクストビッツ様
        if company_name == "ネクストビッツ":
            if pdf_type == "estimate":
                return extract_nextbits_estimate(pdf_path)
            elif pdf_type == "invoice":
                return extract_nextbits_invoice(pdf_path)
            else:
                # 注文請書・納品書は保存のみ（データ抽出なし）
                return {"note": "保存のみ（データ抽出なし）"}

        # オフ・ビート・ワークス様
        elif company_name == "オフ・ビート・ワークス":
            if pdf_type == "estimate":
                return extract_offbeat_estimate(pdf_path)
            elif pdf_type == "invoice":
                return extract_offbeat_invoice(pdf_path)
            elif pdf_type == "order_confirmation":
                return extract_offbeat_order_confirmation(pdf_path)
            else:
                # 納品書は保存のみ（データ抽出なし）
                return {"note": "保存のみ（データ抽出なし）"}

        else:
            raise ValueError(f"未対応の取引先: {company_name}")

    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }


def main():
    """
    メイン関数

    コマンドライン引数からPDF情報を受け取り、解析結果をJSON形式で標準出力に返す。
    """
    if len(sys.argv) != 4:
        print(json.dumps({
            "error": "引数が不足しています",
            "usage": "python3 pdf_parser.py <company_name> <pdf_type> <pdf_path>"
        }), file=sys.stderr)
        sys.exit(1)

    company_name = sys.argv[1]
    pdf_type = sys.argv[2]
    pdf_path = sys.argv[3]

    result = parse_pdf(company_name, pdf_type, pdf_path)

    # JSON形式で出力
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # エラーがあれば終了コード1
    if "error" in result:
        sys.exit(1)


if __name__ == "__main__":
    main()
