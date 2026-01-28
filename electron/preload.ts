/**
 * プリロードスクリプト
 *
 * レンダラープロセスとメインプロセス間の安全な通信を提供
 * contextIsolation: true のもとで動作
 */

import { contextBridge, ipcRenderer } from 'electron'

// 安全なAPIをレンダラーに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // アプリ情報
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  isElectron: true,

  // プラットフォーム情報
  platform: process.platform,
})

// TypeScript用の型定義
declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>
      isElectron: boolean
      platform: string
    }
  }
}
