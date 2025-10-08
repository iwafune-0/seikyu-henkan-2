/**
 * メインテーマファイル
 * テーマ4: ミニマルエレガント - エメラルドグリーン
 *
 * Material-UI v6テーマの統合設定
 * このファイルをインポートしてThemeProviderに適用する
 */

import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { components } from './components';

/**
 * カスタムテーマオブジェクトの作成
 *
 * @example
 * // App.tsxでの使用例
 * import { ThemeProvider } from '@mui/material/styles';
 * import CssBaseline from '@mui/material/CssBaseline';
 * import theme from './theme/theme';
 *
 * function App() {
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <CssBaseline />
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 */
const theme = createTheme({
  // カラーパレット
  palette,

  // タイポグラフィ
  typography,

  // コンポーネントのカスタマイズ
  components,

  // シェイプ（角丸の設定）
  shape: {
    borderRadius: 8,
  },

  // スペーシング（8pxベース）
  spacing: 8,

  // ブレークポイント（レスポンシブ対応）
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  // Z-インデックス
  zIndex: {
    appBar: 1200,
    drawer: 1100,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },

  // トランジション
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  // シャドウのカスタマイズ
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
    '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
    '0 25px 50px rgba(0, 0, 0, 0.12), 0 12px 18px rgba(0, 0, 0, 0.08)',
  ],
});

export default theme;
