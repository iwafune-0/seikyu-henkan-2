/**
 * バックエンドサーバー起動モジュール
 *
 * Electron内でExpressサーバーを起動・管理
 * 開発時: 外部プロセスに依存（concurrentlyで別途起動）
 * 本番時: メインプロセス内でrequire()して起動
 *   - spawn('node', ...) ではなくrequire()を使用
 *   - 配布先PCにNode.jsが不要
 *   - asar内のモジュール解決が自動的に行われる
 */

import path from 'path'
import http from 'http'
import { app } from 'electron'

let serverStarted = false

/**
 * APIサーバーの起動を待機
 */
async function waitForServer(
  url: string,
  timeout: number = 30000
): Promise<void> {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const check = (): void => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            retry()
          }
        })
        .on('error', () => retry())

      function retry(): void {
        if (Date.now() - startTime > timeout) {
          reject(new Error('サーバー起動タイムアウト'))
        } else {
          setTimeout(check, 500)
        }
      }
    }

    check()
  })
}

/**
 * バックエンドサーバーを起動
 */
export async function startBackendServer(isDev: boolean): Promise<void> {
  if (serverStarted) return

  const PORT = process.env.PORT || '3001'
  const healthUrl = `http://localhost:${PORT}/health`

  if (isDev) {
    // 開発時: 外部で起動されているサーバーを待機
    console.log('[Backend] 開発サーバーに接続中...')
    await waitForServer(healthUrl, 60000)
    console.log('[Backend] 開発サーバーに接続しました')
  } else {
    // 本番時: メインプロセス内でサーバーを起動
    console.log('[Backend] サーバーを起動中...')

    // Python実行パスを設定（extraResourcesに同梱されたpdf_processor.exe）
    const pythonDir = path.join(process.resourcesPath, 'python')
    process.env.PYTHON_EXECUTABLE = path.join(pythonDir, 'pdf_processor.exe')

    // 環境変数を設定（server.ts内のdotenv.config()は既存の値を上書きしない）
    process.env.PORT = PORT
    process.env.NODE_ENV = 'production'
    process.env.PDF_ENGINE = 'excel'
    process.env.APP_MODE = 'electron'

    // バックエンドサーバーをrequire()で読み込み・起動
    // extraResourcesに配置されるため、process.resourcesPath経由でアクセス
    // server.tsはモジュール読み込み時にstartServer()を呼び出しListenを開始する
    const backendPath = path.join(process.resourcesPath, 'backend', 'dist', 'server.js')
    require(backendPath)

    // サーバー起動待機
    await waitForServer(healthUrl)
    console.log('[Backend] サーバー起動完了')
  }

  serverStarted = true
}

/**
 * バックエンドサーバーを停止
 *
 * メインプロセス内で動作しているため、
 * Electronアプリ終了時にプロセスごと停止する。
 * 明示的な停止処理は不要。
 */
export async function stopBackendServer(): Promise<void> {
  serverStarted = false
}
