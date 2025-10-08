/**
 * タイポグラフィ設定
 * テーマ4: ミニマルエレガント
 *
 * 可読性とエレガンスを両立したフォント設定
 */

import type { ThemeOptions } from '@mui/material/styles';

export const typography: ThemeOptions['typography'] = {
  // フォントファミリー
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Noto Sans JP"',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),

  // 基本フォントサイズ
  fontSize: 14,

  // フォントウェイト
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,

  // 見出し1: ページタイトル
  h1: {
    fontSize: '2rem',      // 32px
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    color: '#111827',
  },

  // 見出し2: セクションタイトル
  h2: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.005em',
    color: '#111827',
  },

  // 見出し3: サブセクションタイトル
  h3: {
    fontSize: '1.25rem',   // 20px
    fontWeight: 600,
    lineHeight: 1.4,
    color: '#111827',
  },

  // 見出し4: カードタイトルなど
  h4: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 600,
    lineHeight: 1.4,
    color: '#111827',
  },

  // 見出し5: 小見出し
  h5: {
    fontSize: '1rem',      // 16px
    fontWeight: 600,
    lineHeight: 1.5,
    color: '#111827',
  },

  // 見出し6: 最小見出し
  h6: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 600,
    lineHeight: 1.5,
    color: '#111827',
  },

  // 本文1: 主要な本文
  body1: {
    fontSize: '1rem',      // 16px
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#111827',
  },

  // 本文2: 補助的な本文
  body2: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#6b7280',
  },

  // ボタン
  button: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.5,
    textTransform: 'none',  // 自動大文字化を無効
    letterSpacing: '0.01em',
  },

  // キャプション: 補足説明など
  caption: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#6b7280',
  },

  // オーバーライン: ラベルなど
  overline: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 600,
    lineHeight: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6b7280',
  },

  // サブタイトル1
  subtitle1: {
    fontSize: '1rem',      // 16px
    fontWeight: 500,
    lineHeight: 1.5,
    color: '#111827',
  },

  // サブタイトル2
  subtitle2: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.5,
    color: '#6b7280',
  },
};
