/**
 * バックエンドサーバー起動モジュール
 *
 * Electron内でExpressサーバーを起動・管理
 * 開発時: 外部プロセスに依存
 * 本番時: 内蔵サーバーを起動
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'
import { app } from 'electron'

let serverProcess: ChildProcess | null = null
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
    // 本番時: サーバープロセスを起動
    console.log('[Backend] サーバーを起動中...')

    const backendDir = path.join(app.getAppPath(), 'backend/dist')
    const serverPath = path.join(backendDir, 'server.js')

    // Python実行パスを設定
    const pythonDir = path.join(process.resourcesPath, 'python')
    process.env.PYTHON_EXECUTABLE = path.join(pythonDir, 'pdf_processor.exe')

    serverProcess = spawn('node', [serverPath], {
      cwd: backendDir,
      env: {
        ...process.env,
        PORT,
        NODE_ENV: 'production',
        PDF_ENGINE: 'excel',
        APP_MODE: 'electron',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    serverProcess.stdout?.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`)
    })

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`)
    })

    serverProcess.on('error', (error) => {
      console.error('[Backend] プロセスエラー:', error)
    })

    serverProcess.on('exit', (code) => {
      console.log(`[Backend] プロセス終了: code=${code}`)
      serverProcess = null
      serverStarted = false
    })

    // サーバー起動待機
    await waitForServer(healthUrl)
    console.log('[Backend] サーバー起動完了')
  }

  serverStarted = true
}

/**
 * バックエンドサーバーを停止
 */
export async function stopBackendServer(): Promise<void> {
  if (serverProcess) {
    console.log('[Backend] サーバーを停止中...')
    serverProcess.kill('SIGTERM')

    // 強制終了のタイムアウト
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill('SIGKILL')
        }
        resolve()
      }, 5000)

      serverProcess?.on('exit', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    serverProcess = null
    serverStarted = false
    console.log('[Backend] サーバー停止完了')
  }
}
