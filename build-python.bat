@echo off
echo === Building Python ===

pyinstaller --onedir --name pdf_processor --distpath build\python --add-data "backend\python\pdf_parser.py;." --add-data "backend\python\excel_editor.py;." --add-data "backend\python\excel_validator.py;." --add-data "backend\python\pdf_generator.py;." --hidden-import pdfplumber --hidden-import openpyxl --hidden-import pypdf --hidden-import dateutil --hidden-import PIL --noconfirm --clean backend\python\main.py

echo === Build Complete ===
pause
