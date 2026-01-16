import { useState, useEffect } from 'react'

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
import { useNavigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { supabase } from '@/lib/supabase'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSessionReady, setIsSessionReady] = useState(false)

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // ハッシュフラグメントにエラーがあるかチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')

        if (errorCode) {
          if (errorCode === 'otp_expired') {
            setError('招待リンクの有効期限が切れています。管理者に再度招待を依頼してください。')
          } else {
            setError(errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : '無効な招待リンクです。')
          }
          setIsLoading(false)
          return
        }

        // Supabaseがセッションを確立するのを待つ
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('セッションの取得に失敗しました。')
          setIsLoading(false)
          return
        }

        if (session?.user) {
          setEmail(session.user.email || '')
          setIsSessionReady(true)
          setIsLoading(false)
        } else {
          // セッションがまだない場合、認証状態の変化を監視
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('Auth event:', event)
              if (session?.user) {
                setEmail(session.user.email || '')
                setIsSessionReady(true)
                setIsLoading(false)
                subscription.unsubscribe()
              }
            }
          )

          // 3秒待ってもセッションが確立されない場合はエラー
          setTimeout(() => {
            setIsLoading(false)
            if (!isSessionReady) {
              setError('招待リンクが無効です。管理者に再度招待を依頼してください。')
              subscription.unsubscribe()
            }
          }, 3000)
        }
      } catch (err) {
        console.error('Error initializing session:', err)
        setError('招待リンクの処理中にエラーが発生しました。')
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // バリデーション
    if (!password) {
      setError('パスワードを入力してください。')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。')
      return
    }

    // 半角英字を含むかチェック
    if (!/[a-zA-Z]/.test(password)) {
      setError('パスワードには英字を含めてください。')
      return
    }

    // 半角数字を含むかチェック
    if (!/[0-9]/.test(password)) {
      setError('パスワードには数字を含めてください。')
      return
    }

    // 半角英数字以外が含まれていないかチェック（全角文字や記号を除外）
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      setError('パスワードは半角の英字・数字のみで入力してください。')
      return
    }

    if (!confirmPassword) {
      setError('パスワード（確認）を入力してください。')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    setIsLoading(true)

    try {
      // モック認証の場合
      if (import.meta.env.VITE_SUPABASE_URL === 'https://mock-project.supabase.co') {
        console.log('Mock invitation acceptance')
        await new Promise(resolve => setTimeout(resolve, 500))

        navigate('/login', {
          state: { message: 'パスワードが設定されました。\nログインしてください。' }
        })
        return
      }

      // パスワードを設定
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // profilesテーブルにユーザーを登録
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'user',
          is_deleted: false,
          created_at: new Date().toISOString()
        })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // プロファイル作成に失敗してもパスワード設定は成功しているので続行
        }
      }

      // ログアウトしてログインページへ
      await supabase.auth.signOut()

      navigate('/login', {
        state: { message: 'パスワードが設定されました。\nログインしてください。' }
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '招待の受諾に失敗しました。'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // ローディング中
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-4 sm:mb-6">
              招待受諾・パスワード設定
            </h2>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">招待リンクを確認中...</p>
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // エラー状態（セッションが確立されなかった場合）
  if (error && !isSessionReady) {
    return (
      <PublicLayout>
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-4 sm:mb-6">
              招待受諾・パスワード設定
            </h2>
            <div role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
              {error}
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              ログインページへ
            </button>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-4 sm:mb-6">
            招待受諾・パスワード設定
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* メールアドレス表示（変更不可） */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="text"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* パスワード設定 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                パスワード（英字・数字を含む8文字以上）
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'invitation-error' : undefined}
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

            {/* パスワード確認入力 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                パスワード（確認）
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'invitation-error' : undefined}
                  className="w-full px-4 py-2 pr-10 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div id="invitation-error" role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading || !isSessionReady}
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '設定中...' : 'パスワードを設定'}
            </button>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}
