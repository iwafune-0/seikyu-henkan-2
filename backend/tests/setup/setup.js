/**
 * Jest統合テスト用セットアップファイル
 *
 * すべての統合テスト実行前に自動的に実行される
 */

// 環境変数を読み込み
require('dotenv').config()

// テストタイムアウトの設定
jest.setTimeout(30000)

// グローバルエラーハンドラ
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// テスト開始メッセージ
console.log('===== 統合テスト開始 =====')
console.log('環境変数:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    ? '✅ 設定済み'
    : '❌ 未設定',
  NODE_ENV: process.env.NODE_ENV || 'test',
})
console.log('==========================\n')
