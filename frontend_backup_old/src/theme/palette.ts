/**
 * カラーパレット定義
 * テーマ4: ミニマルエレガント - エメラルドグリーン
 *
 * 業務ツールとしての使いやすさと長時間作業でも疲れにくい配色
 */

import type { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light',

  // プライマリカラー: エメラルドグリーン
  primary: {
    main: '#10b981',      // メインカラー
    light: '#34d399',     // ホバー時など
    dark: '#059669',      // アクティブ状態
    contrastText: '#ffffff',
  },

  // セカンダリカラー: ダークエメラルド
  secondary: {
    main: '#059669',
    light: '#10b981',
    dark: '#047857',
    contrastText: '#ffffff',
  },

  // エラー
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },

  // 警告
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#ffffff',
  },

  // 情報
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    contrastText: '#ffffff',
  },

  // 成功
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },

  // グレースケール（背景・テキスト）
  grey: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // 背景色
  background: {
    default: '#f9fafb',    // ページ全体の背景
    paper: '#ffffff',      // カード・パネルの背景
  },

  // テキストカラー
  text: {
    primary: '#111827',    // 主要テキスト
    secondary: '#6b7280',  // 補助テキスト
    disabled: '#9ca3af',   // 無効状態
  },

  // 区切り線
  divider: '#e5e7eb',

  // アクション
  action: {
    active: '#10b981',
    hover: 'rgba(16, 185, 129, 0.04)',
    selected: 'rgba(16, 185, 129, 0.08)',
    disabled: '#9ca3af',
    disabledBackground: '#f3f4f6',
    focus: 'rgba(16, 185, 129, 0.12)',
  },
};
