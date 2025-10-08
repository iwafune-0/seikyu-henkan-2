/**
 * MUIコンポーネントのカスタマイズ
 * テーマ4: ミニマルエレガント
 *
 * 各コンポーネントのデフォルトスタイルとpropsを定義
 */

import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  // ボタン
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
      outlined: {
        borderWidth: 1.5,
        '&:hover': {
          borderWidth: 1.5,
        },
      },
      sizeLarge: {
        padding: '10px 20px',
        fontSize: '1rem',
      },
      sizeMedium: {
        padding: '8px 16px',
        fontSize: '0.875rem',
      },
      sizeSmall: {
        padding: '6px 12px',
        fontSize: '0.8125rem',
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },

  // カード
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },

  // ペーパー
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      elevation2: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      elevation3: {
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
      },
    },
  },

  // テキストフィールド
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#10b981',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
    defaultProps: {
      variant: 'outlined',
    },
  },

  // アウトラインインプット
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#10b981',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#10b981',
          borderWidth: 2,
        },
      },
    },
  },

  // チップ
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
      },
      filled: {
        '&.MuiChip-colorPrimary': {
          backgroundColor: '#d1fae5',
          color: '#065f46',
        },
        '&.MuiChip-colorSecondary': {
          backgroundColor: '#e5e7eb',
          color: '#374151',
        },
      },
    },
  },

  // アラート
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontSize: '0.875rem',
      },
      standardSuccess: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
      },
      standardError: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
      },
      standardWarning: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
      },
      standardInfo: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
      },
    },
  },

  // テーブル
  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
    },
  },

  // テーブルヘッダーセル
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: '1px solid #e5e7eb',
      },
      head: {
        fontWeight: 600,
        backgroundColor: '#f9fafb',
        color: '#374151',
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
      body: {
        fontSize: '0.875rem',
        color: '#111827',
      },
    },
  },

  // テーブル行
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: '#f9fafb',
        },
        '&:last-child td': {
          borderBottom: 0,
        },
      },
    },
  },

  // ダイアログ
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        padding: 8,
      },
    },
  },

  // ダイアログタイトル
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.25rem',
        fontWeight: 600,
        color: '#111827',
        padding: '16px 24px',
      },
    },
  },

  // ダイアログコンテンツ
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
      },
    },
  },

  // ダイアログアクション
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
      },
    },
  },

  // アップバー
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      colorPrimary: {
        backgroundColor: '#ffffff',
        color: '#111827',
      },
    },
  },

  // ツールバー
  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 64,
        '@media (min-width: 600px)': {
          minHeight: 64,
        },
      },
    },
  },

  // リストアイテムボタン
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&:hover': {
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
          },
        },
      },
    },
  },

  // タブ
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        minHeight: 48,
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },

  // タブインジケーター
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },

  // バッジ
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 600,
        fontSize: '0.75rem',
      },
    },
  },

  // ツールチップ
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#374151',
        fontSize: '0.8125rem',
        borderRadius: 6,
        padding: '6px 12px',
      },
      arrow: {
        color: '#374151',
      },
    },
  },

  // リニアプログレス
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
      bar: {
        borderRadius: 4,
      },
    },
  },

  // サーキュラープログレス
  MuiCircularProgress: {
    styleOverrides: {
      root: {
        color: '#10b981',
      },
    },
  },

  // スイッチ
  MuiSwitch: {
    styleOverrides: {
      root: {
        padding: 8,
      },
      thumb: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
      },
      track: {
        borderRadius: 12,
      },
    },
  },

  // チェックボックス
  MuiCheckbox: {
    styleOverrides: {
      root: {
        color: '#9ca3af',
        '&.Mui-checked': {
          color: '#10b981',
        },
      },
    },
  },

  // ラジオボタン
  MuiRadio: {
    styleOverrides: {
      root: {
        color: '#9ca3af',
        '&.Mui-checked': {
          color: '#10b981',
        },
      },
    },
  },

  // ブレッドクラム
  MuiBreadcrumbs: {
    styleOverrides: {
      separator: {
        color: '#9ca3af',
      },
    },
  },

  // リンク
  MuiLink: {
    styleOverrides: {
      root: {
        color: '#10b981',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
          color: '#059669',
        },
      },
    },
  },
};
