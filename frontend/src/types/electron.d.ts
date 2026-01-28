/**
 * Electron API型定義
 *
 * preload.tsでcontextBridgeを通じて公開されるAPIの型
 */

interface ElectronAPI {
  getAppVersion: () => Promise<string>
  isElectron: boolean
  platform: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
