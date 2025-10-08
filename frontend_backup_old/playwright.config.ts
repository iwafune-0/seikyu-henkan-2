import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // 並列実行設定（ローカルは並列、CIは直列）
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // 失敗時の動作
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // レポート設定
  reporter: 'html',

  use: {
    // ベースURL
    baseURL: 'http://localhost:5174',

    // トレース設定（失敗時のみ）
    trace: 'on-first-retry',

    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',

    // タイムアウト設定
    actionTimeout: 10000,
  },

  // テストプロジェクト設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 開発サーバー設定（テスト実行時に自動起動）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
