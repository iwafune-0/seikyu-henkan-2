import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { useAuthStore } from '@/stores/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 他のページからのメッセージを表示
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message)
      // メッセージ表示後、stateをクリア
      window.history.replaceState({}, document.title)
    }
  }, [location])

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
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">ログイン</h2>

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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
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
                className="text-sm text-primary hover:underline"
              >
                パスワードをお忘れですか？
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}
