/**
 * E2Eテストユーザー クリーンアップスクリプト
 *
 * 使用方法:
 *   npx tsx tests/e2e/helpers/cleanup-e2e-users.ts [--dry-run]
 *
 * オプション:
 *   --dry-run  実際には削除せず、対象を表示するのみ
 *
 * 削除対象:
 *   - 孤立ユーザー（auth.usersにいるがprofilesにいない）
 *   - テストユーザー（パターンにマッチするメール）
 *     - e2e-で始まる
 *     - test-またはtest_で始まる
 *     - @example.comで終わる
 *     - newadmin_test_で始まる
 *     - newuser_test_で始まる
 *     - deleted@で始まる
 */

import {
  dryRunE2ECleanup,
  comprehensiveE2ECleanup,
} from './supabase-admin'

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')

  console.log('========================================')
  console.log('E2Eテストユーザー クリーンアップ')
  console.log('========================================')
  console.log()

  if (isDryRun) {
    console.log('モード: ドライラン（削除しません）')
    console.log()
    await dryRunE2ECleanup()
  } else {
    console.log('モード: 実行（削除します）')
    console.log()
    const result = await comprehensiveE2ECleanup()

    if (result.errors.length > 0) {
      console.log('\nエラー:')
      result.errors.forEach((e) => console.log(`  - ${e}`))
    }

    console.log('\n========================================')
    console.log('完了')
    console.log('========================================')
  }
}

main().catch(console.error)
