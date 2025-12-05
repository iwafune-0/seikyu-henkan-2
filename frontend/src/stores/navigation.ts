import { create } from 'zustand'

interface NavigationState {
  /** ナビゲーションをブロックするかどうか */
  isBlocked: boolean
  /** ブロック時に表示するダイアログのコールバック */
  onNavigationAttempt: ((to: string) => void) | null
  /** ブロック状態を設定 */
  setBlocked: (blocked: boolean, onAttempt?: (to: string) => void) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  isBlocked: false,
  onNavigationAttempt: null,
  setBlocked: (blocked, onAttempt) =>
    set({
      isBlocked: blocked,
      onNavigationAttempt: blocked ? (onAttempt ?? null) : null,
    }),
}))
