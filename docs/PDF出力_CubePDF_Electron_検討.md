# PDF出力問題とCubePDF/Electron化の検討まとめ

**作成日**: 2025-12-12
**ステータス**: 検討完了・後日対応オプション

---

## 1. 現状の問題

### LibreOffice出力とCubePDF出力の差異

| 項目 | CubePDF（目標） | LibreOffice（現状） | 差異 |
|------|----------------|-------------------|------|
| コンテンツ高さ | 25.53cm | 22.17cm | **14%小さい** |
| コンテンツ幅 | 17.23cm | 17.22cm | ほぼ同じ |
| 文字サイズ | 8.3pt | 6.6pt | **14%小さい** |
| 文字縦横比 | 1.00 | 1.00 | 同じ（正常） |

### 原因

- CubePDFとLibreOfficeで「1ページに収める」機能の解釈が異なる
- CubePDF: 横幅を基準にスケーリング（縦方向はあまり縮小しない）
- LibreOffice: 縦横均等にスケーリング（両方向を同比率で縮小）
- **これはPDF変換エンジンの仕様差であり、コード側での完全な解決は不可能**

### 試行した解決策（全て不可）

| 試行内容 | 結果 |
|----------|------|
| openpyxlでスケール100%に設定 | 効果なし（fitToPageが優先される） |
| XML直接編集でfitToPage削除 | 8ページに分割（コンテンツがA4超過） |
| 印刷範囲（Print_Area）設定 | 8→4ページに改善するが不十分 |
| LibreOffice UNO APIでスケール調整 | 効果なし |
| pypdfでPDF後処理（縦方向のみ拡大） | サイズは近くなるが文字が縦長に変形 |
| pypdfでPDF後処理（縦横同比率拡大） | 右端がA4からはみ出す |
| 行高さ・列幅を拡大 | LibreOfficeがさらに縮小するだけ |

---

## 2. 解決策の選択肢

### 選択肢A: LibreOffice版で運用（現状）

**メリット:**
- 追加開発不要
- Linux環境（AWS Lambda）で動作
- 月額費用$0

**デメリット:**
- PDF出力がCubePDFより14%小さい
- 印刷すれば読めるが、見た目の差がある

### 選択肢B: CubePDF版を追加開発

**必要な作業:**
- CubePDF版のPDF生成コード追加（2-3時間）
- 環境変数での切り替えロジック（30分）
- Windows環境での動作確認

**メリット:**
- CubePDFと同じ出力が得られる

**デメリット:**
- Windows環境が必要
- AWS Lambda（Linux）では使えない

### 選択肢C: Electron化してデスクトップアプリ配布

**必要な作業:**
- Electron化（1-2日）
- CubePDF版のPDF生成コード追加（2-3時間）
- Windows環境での動作確認

**メリット:**
- 各ユーザーのWindows PCで完結
- CubePDFが使える
- サーバー不要（Supabaseのみ）
- 社内配布で外部アクセス不可

**デメリット:**
- 開発工数がかかる
- 各PCにCubePDFインストールが必要
- アップデート時に再配布が必要

---

## 3. デプロイ先による制約

| デプロイ先 | OS | CubePDF | 費用 |
|-----------|-----|---------|------|
| AWS Lambda + Amplify | Linux | ❌ 使えない | $0（無料枠） |
| 社内Windows PC | Windows | ✅ 使える | $0 |
| レンタルVPS（Linux） | Linux | ❌ 使えない | 月500-1000円 |
| レンタルVPS（Windows） | Windows | ✅ 使える | 月2000-5000円 |
| Electron配布 | Windows | ✅ 使える | $0 |

---

## 4. 推奨方針

### 現時点での推奨

**LibreOffice版で完成させて運用開始する**

理由:
- PDF出力の差（14%小さい）が業務上問題になるか、実際に使ってみないと判断できない
- データは正しく出力されている
- 印刷すれば問題なく読める

### 後から対応が必要になった場合

1. **PDF出力の差が問題になった場合** → CubePDF版を追加
2. **社内配布が必要になった場合** → Electron化を検討
3. **両方必要な場合** → CubePDF版 + Electron化

---

## 5. CubePDF版の実装方針（後日対応時）

### 設計

```
backend/python/pdf_generator.py
├── generate_pdf()          # メイン関数（環境変数で分岐）
├── generate_pdf_libreoffice()  # LibreOffice版（既存）
└── generate_pdf_cubepdf()      # CubePDF版（新規）
```

### 環境変数

```bash
# .env
PDF_ENGINE=libreoffice  # または cubepdf
```

### CubePDF版の処理フロー

1. Excelファイルを一時保存
2. PowerShell/COM経由でExcelを開く
3. 印刷ダイアログでCubePDFを選択してPDF出力
4. 出力されたPDFを取得

### 必要な前提条件（Windows環境）

- Microsoft Excel インストール済み
- CubePDF インストール済み（無料）
- CubePDFをデフォルトプリンターに設定、または印刷時に指定

---

## 6. Electron化の実装方針（後日対応時）

### アーキテクチャ

```
electron-app/
├── main.js           # Electronメインプロセス
├── preload.js        # プリロードスクリプト
├── package.json
├── frontend/         # React（既存コードを流用）
└── backend/          # Node.js + Python（既存コードを流用）
```

### 主な変更点

1. フロントエンド: Viteの出力をElectronに読み込ませる
2. バックエンド: Express APIをElectronプロセス内で起動
3. Python: pkg等でバンドル、またはPython同梱

### ビルド

```bash
# WSL2でWindows用exeをクロスコンパイル
npm run build:win
```

---

## 7. 費用まとめ

| 項目 | 費用 |
|------|------|
| LibreOffice | 無料 |
| CubePDF | 無料 |
| Electron | 無料 |
| Supabase | 無料枠内 |
| AWS Lambda + Amplify | 無料枠内 |

**どの選択肢でも月額$0で運用可能**

---

## 8. 次のステップ

1. ✅ LibreOffice版で Phase 8（API統合）完了
2. ⏳ Phase 9: E2Eテスト実施
3. ⏳ Phase 10: デプロイ（AWS Lambda + Amplify）
4. ⏳ 運用開始後、PDF出力の差が問題になるか評価
5. ⏳ 必要に応じてCubePDF版/Electron化を追加

---

## 付録: 技術的な発見事項

### LibreOfficeのfitToPage動作

- `fitToPage="1"`が設定されている場合、`scale`属性は無視される
- LibreOfficeは独自にスケールを計算して1ページに収める
- fitToPageを削除すると、コンテンツがA4サイズを超過してはみ出す

### テンプレートExcelの構造

- dimension（XML）: `B2:AS47`（45列）
- 実データの最大列: AC列（29列目）
- コンテンツ幅: 22.83cm > A4幅21cm（100%スケールでははみ出す）
- 印刷範囲（Print_Area）: 未設定

### CubePDFの動作推測

- 横幅を基準にスケーリングし、縦方向は可能な限り維持
- または、Windows GDIの印刷処理が異なる解釈をしている
