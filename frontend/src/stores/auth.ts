import { create } from 'zustand'
import type { User } from '@/types'
import { supabase } from '@/lib/supabase'

const AUTH_STORAGE_KEY = 'auth-storage'

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
  },

  login: async (email: string, password: string, remember: boolean = false) => {
        console.log('auth store login called:', { email })
        set({ isLoading: true })
        try {
          // モック認証（開発用）
          console.log('Checking Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
          if (import.meta.env.VITE_SUPABASE_URL === 'https://mock-project.supabase.co') {
            console.log('Using mock authentication')
            // 開発用のモックユーザー
            const mockUsers: Record<string, User> = {
              'admin@example.com': {
                id: 'mock-admin-id',
                email: 'admin@example.com',
                role: 'admin',
                created_at: new Date().toISOString(),
              },
              'admin2@example.com': {
                id: 'mock-admin2-id',
                email: 'admin2@example.com',
                role: 'admin',
                created_at: new Date().toISOString(),
              },
              'user@example.com': {
                id: 'mock-user-id',
                email: 'user@example.com',
                role: 'user',
                created_at: new Date().toISOString(),
              },
            }

            // 簡単なパスワードチェック（開発用）
            if (password.length < 8) {
              console.error('Password too short')
              throw new Error('パスワードは8文字以上で入力してください')
            }

            const user = mockUsers[email]
            if (!user) {
              console.error('User not found:', email)
              throw new Error('ユーザーが見つかりません')
            }

            console.log('Mock user found:', user)
            // 少し遅延を入れて実際の認証のような動作をシミュレート
            await new Promise(resolve => setTimeout(resolve, 500))

            console.log('Setting authenticated user')
            const authState = {
              user,
              isAuthenticated: true,
              isLoading: false
            }
            set(authState)
            saveAuthState({ user, isAuthenticated: true }, remember)
            console.log('Mock login successful')
            return
          }

          // 本番用のSupabase認証
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          if (data.user) {
            // SupabaseのユーザーデータをアプリケーションのUser型に変換
            const user: User = {
              id: data.user.id,
              email: data.user.email || '',
              role: (data.user.user_metadata?.role as 'admin' | 'user') || 'user',
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
    console.log('checkAuth called')
    set({ isLoading: true })
    try {
      // モック認証の場合は、既存のstateを維持
      if (import.meta.env.VITE_SUPABASE_URL === 'https://mock-project.supabase.co') {
        console.log('Mock mode: preserving existing auth state')
        const currentState = useAuthStore.getState()
        console.log('Current state:', { user: currentState.user, isAuthenticated: currentState.isAuthenticated })
        set({ isLoading: false })
        return
      }

      // 本番用のSupabase認証チェック
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as 'admin' | 'user') || 'user',
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
