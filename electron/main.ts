/**
 * Electronメインプロセス
 *
 * アプリケーションのライフサイクル管理、ウィンドウ作成、
 * バックエンドサーバーの起動を担当
 */

import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import dotenv from 'dotenv'
import { startBackendServer, stopBackendServer } from './backend-runner'

// 環境変数読み込み
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env.production')
  : path.join(__dirname, '../backend/.env')
dotenv.config({ path: envPath })

// Electron時のデフォルト設定
process.env.PDF_ENGINE = process.env.PDF_ENGINE || 'excel'
process.env.APP_MODE = 'electron'
process.env.NODE_ENV = app.isPackaged ? 'production' : 'development'

let mainWindow: BrowserWindow | null = null
const isDev = !app.isPackaged

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: '月次処理自動化システム',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: !isDev, // 開発時はsandbox無効（localhost接続のため）
    },
  })

  // メニューバー非表示
  mainWindow.setMenuBarVisibility(false)

  // DevTools（開発時のみ）
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // フロントエンド読み込み
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5174')
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, '../frontend/dist/index.html')
    )
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 外部URLへのナビゲーションをブロック
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.host !== 'localhost') {
      event.preventDefault()
    }
  })

  // 新規ウィンドウのオープンをブロック
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
}

// IPC ハンドラー
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

app.whenReady().then(async () => {
  try {
    // バックエンドサーバー起動
    await startBackendServer(isDev)

    // ウィンドウ作成
    await createWindow()
  } catch (error) {
    dialog.showErrorBox(
      '起動エラー',
      `アプリケーションの起動に失敗しました:\n${error instanceof Error ? error.message : '不明なエラー'}`
    )
    app.quit()
  }
})

app.on('window-all-closed', async () => {
  await stopBackendServer()
  app.quit()
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow()
  }
})

// グレースフルシャットダウン
app.on('before-quit', async () => {
  await stopBackendServer()
})
