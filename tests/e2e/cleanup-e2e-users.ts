/**
 * E2Eテストで作成された残留ユーザーを一括削除するスクリプト
 *
 * 使用方法: npx tsx tests/e2e/cleanup-e2e-users.ts
 */
import { cleanupAllE2ETestUsers } from './helpers/supabase-admin'

async function main() {
  console.log('E2Eテストユーザーのクリーンアップを開始...')
  const result = await cleanupAllE2ETestUsers()
  console.log('削除されたユーザー:', result.deleted.length, '件')
  result.deleted.forEach(email => console.log('  - ' + email))
  if (result.errors.length > 0) {
    console.log('エラー:', result.errors)
  }
  console.log('クリーンアップ完了')
}

main().catch(console.error)
