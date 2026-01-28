#!/usr/bin/env python3
"""
PDF処理統合エントリーポイント

PyInstallerでexe化するためのメインスクリプト。
サブコマンドで各処理を呼び出す。

使用法:
    pdf_processor.exe pdf_parser <company_name> <pdf_type> <pdf_path>
    pdf_processor.exe excel_editor <company_name> <template_path> <output_path> <data_json>
    pdf_processor.exe excel_validator <excel_path> <company_name> <validation_data_json>
    pdf_processor.exe pdf_generator <excel_path> <output_dir>
"""

import sys
import os

# 実行ファイルのディレクトリを基準にパスを設定
if getattr(sys, 'frozen', False):
    # PyInstallerでexe化された場合
    base_dir = sys._MEIPASS
else:
    # 通常のPython実行
    base_dir = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, base_dir)


def main():
    if len(sys.argv) < 2:
        print('使用法: pdf_processor <command> [args...]', file=sys.stderr)
        print('コマンド: pdf_parser, excel_editor, excel_validator, pdf_generator', file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    if command == 'pdf_parser':
        # pdf_parser.py の main 関数を呼び出す
        import pdf_parser
        sys.argv = ['pdf_parser.py'] + args
        pdf_parser.main()

    elif command == 'excel_editor':
        # excel_editor.py の main 関数を呼び出す
        import excel_editor
        sys.argv = ['excel_editor.py'] + args
        excel_editor.main()

    elif command == 'excel_validator':
        # excel_validator.py の main 関数を呼び出す
        import excel_validator
        sys.argv = ['excel_validator.py'] + args
        excel_validator.main()

    elif command == 'pdf_generator':
        # pdf_generator.py の main 関数を呼び出す
        import pdf_generator
        sys.argv = ['pdf_generator.py'] + args
        pdf_generator.main()

    elif command == '--help' or command == '-h':
        print('PDF処理統合ツール')
        print('')
        print('使用法: pdf_processor <command> [args...]')
        print('')
        print('コマンド:')
        print('  pdf_parser        PDF解析（pdfplumber使用）')
        print('  excel_editor      Excel編集（openpyxl使用）')
        print('  excel_validator   Excel検証（数式計算結果の検証）')
        print('  pdf_generator     PDF生成（Excel ExportAsFixedFormat使用）')
        print('')
        print('例:')
        print('  pdf_processor pdf_parser ネクストビッツ estimate /path/to/file.pdf')
        print('  pdf_processor pdf_generator /path/to/excel.xlsx /output/dir')

    else:
        print(f'不明なコマンド: {command}', file=sys.stderr)
        print('使用法: pdf_processor <command> [args...]', file=sys.stderr)
        print('コマンド: pdf_parser, excel_editor, excel_validator, pdf_generator', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
