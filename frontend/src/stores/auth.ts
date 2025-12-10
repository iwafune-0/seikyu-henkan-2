import { create } from 'zustand'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'

const AUTH_STORAGE_KEY = 'auth-storage'

// Supabaseエラーメッセージを日本語に変換
const translateAuthError = (message: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
    'Email not confirmed': 'メールアドレスが確認されていません',
    'User not found': 'ユーザーが見つかりません',
    'Invalid email or password': 'メールアドレスまたはパスワードが正しくありません',
    'Too many requests': 'リクエストが多すぎます。しばらく待ってから再試行してください',
    'Email rate limit exceeded': 'メール送信の制限に達しました。しばらく待ってから再試行してください',
  }
  return errorMap[message] || 'ログインに失敗しました。もう一度お試しください'
}

// ストレージヘルパー
const saveAuthState = (state: { user: User | null; isAuthenticated: boolean }, remember: boolean) => {
  const data = JSON.stringify({ state: { user: state.user, isAuthenticated: state.isAuthenticated } })
  if (remember) {
    localStorage.setItem(AUTH_STORAGE_KEY, data)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, data)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

const loadAuthState = (): { user: User | null; isAuthenticated: boolean } | null => {
  const localData = localStorage.getItem(AUTH_STORAGE_KEY)
  const sessionData = sessionStorage.getItem(AUTH_STORAGE_KEY)
  const data = localData || sessionData

  if (!data) return null

  try {
    const parsed = JSON.parse(data)
    return parsed.state
  } catch {
    return null
  }
}

const clearAuthState = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

// 初期状態を復元
const initialState = loadAuthState()

export const useAuthStore = create<AuthState>()((set) => ({
  user: initialState?.user || null,
  isLoading: false,
  isAuthenticated: initialState?.isAuthenticated || false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false
    })
    // ストレージにも保存（remember設定を維持）
    if (user) {
      const hasLocalStorage = localStorage.getItem(AUTH_STORAGE_KEY) !== null
      saveAuthState({ user, isAuthenticated: true }, hasLocalStorage)
    }
  },

  login: async (email: string, password: string, remember: boolean = false) => {
    set({ isLoading: true })
    try {
      // Supabase認証
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(translateAuthError(error.message))
      }

      if (data.user) {
        // profilesテーブルからロール情報を取得
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }

        // SupabaseのユーザーデータをアプリケーションのUser型に変換
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: (profile?.role as 'admin' | 'user') || 'user',
          created_at: data.user.created_at || new Date().toISOString(),
        }
        const authState = {
          user,
          isAuthenticated: true,
          isLoading: false
        }
        set(authState)
        saveAuthState({ user, isAuthenticated: true }, remember)
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
    clearAuthState()
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      // Supabase認証チェック
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // profilesテーブルからロール情報を取得
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: (profile?.role as 'admin' | 'user') || 'user',
          created_at: session.user.created_at || new Date().toISOString(),
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('checkAuth error:', error)
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },
}))
