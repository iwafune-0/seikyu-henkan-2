import { useState, useEffect } from 'react'
import { API_PATHS, type AppMode } from '@/types'

// 目のアイコン（パスワード表示）
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

// 目を閉じたアイコン（パスワード非表示）
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
)
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { useAuthStore } from '@/stores/auth'

// 管理者連絡先（ハードコード）
const ADMIN_CONTACT = {
  name: '岩船',
  email: 'iwafune-hiroko@terracom.co.jp',
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // アプリモード（web | electron）
  const [appMode, setAppMode] = useState<AppMode>('web')
  // 管理者連絡先ダイアログ
  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  // アプリモード取得（認証不要の公開API）
  useEffect(() => {
    const fetchAppMode = async () => {
      try {
        const response = await fetch(`http://localhost:3001${API_PATHS.PUBLIC.APP_MODE}`)
        if (response.ok) {
          const data = await response.json()
          setAppMode(data.mode)
        }
      } catch (err) {
        // エラー時はデフォルト（web）のまま
        console.warn('アプリモード取得に失敗しました:', err)
      }
    }
    fetchAppMode()
  }, [])

  // 他のページからのメッセージを表示
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message)
      // メッセージ表示後、stateをクリア
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // パスワードをお忘れですか？クリック
  const handleForgotPassword = (e: React.MouseEvent) => {
    if (appMode === 'electron') {
      e.preventDefault()
      setContactDialogOpen(true)
    }
    // web版はLink遷移（デフォルト動作）
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // バリデーション
    if (!email) {
      setError('メールアドレスを入力してください。')
      return
    }

    if (!email.includes('@')) {
      setError('有効なメールアドレスを入力してください。')
      return
    }

    if (!password) {
      setError('パスワードを入力してください。')
      return
    }

    setIsLoading(true)

    console.log('ログイン開始:', { email, password, remember })

    try {
      await login(email, password, remember)
      console.log('ログイン成功')
      navigate('/process')
    } catch (err: any) {
      console.error('ログインエラー:', err)
      setError(err?.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-4 sm:mb-6">ログイン</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="example@email.com"
              />
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="w-full px-4 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            {/* ログイン状態保持チェックボックス */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
              />
              <label htmlFor="remember" className="ml-2 text-sm">
                ログイン状態を保持する
              </label>
            </div>

            {/* 成功メッセージ */}
            {success && (
              <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-md p-3 whitespace-pre-line">
                {success}
              </div>
            )}

            {/* エラーメッセージ */}
            {error && (
              <div id="login-error" role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>

            {/* パスワードリセットリンク */}
            <div className="text-center">
              <Link
                to="/reset-password"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                パスワードをお忘れですか？
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* 管理者連絡先ダイアログ（Electron版用） */}
      {contactDialogOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setContactDialogOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-lg p-6 m-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">パスワードをお忘れの方へ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              パスワードをお忘れの場合は、管理者にご連絡ください。
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              ※ パスワードを覚えている場合は、ログイン後に変更できます。
            </p>
            <div className="bg-muted/50 rounded-md p-4 mb-4">
              <p className="text-sm">
                <span className="text-muted-foreground">担当:</span>{' '}
                <span className="font-medium">{ADMIN_CONTACT.name}</span>
              </p>
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">メール:</span>{' '}
                <span className="font-medium select-all">{ADMIN_CONTACT.email}</span>
              </p>
            </div>
            <button
              onClick={() => setContactDialogOpen(false)}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}
