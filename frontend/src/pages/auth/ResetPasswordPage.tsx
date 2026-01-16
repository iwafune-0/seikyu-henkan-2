import { useState } from 'react'

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
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { supabase } from '@/lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const step = searchParams.get('step') === 'password' ? 'password' : 'email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true)

    try {
      // モック認証の場合
      if (import.meta.env.VITE_SUPABASE_URL === 'https://mock-project.supabase.co') {
        console.log('Mock password reset email')
        await new Promise(resolve => setTimeout(resolve, 500))
        setSuccess('パスワードリセットのメールを送信しました。メールをご確認ください。')
        setIsLoading(false)
        return
      }

      // 本番用のSupabaseパスワードリセット
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?step=password`,
      })

      if (resetError) throw resetError

      setSuccess('パスワードリセットのメールを送信しました。メールをご確認ください。')
    } catch (err: any) {
      setError(err.message || 'メールの送信に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // パスワード検証
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
        console.log('Mock password update')
        await new Promise(resolve => setTimeout(resolve, 500))

        navigate('/login', {
          state: { message: 'パスワードがリセットされました。\n新しいパスワードでログインしてください。' }
        })
        return
      }

      // 本番用のSupabaseパスワード更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // 成功したらログインページへ
      navigate('/login', {
        state: { message: 'パスワードがリセットされました。\n新しいパスワードでログインしてください。' }
      })
    } catch (err: any) {
      setError(err.message || 'パスワードのリセットに失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-4 sm:mb-6">
            パスワードリセット
          </h2>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                登録されているメールアドレスを入力してください。<br />
                パスワードリセット用のリンクを送信します。
              </p>

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
                  aria-describedby={error ? 'reset-email-error' : undefined}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="example@email.com"
                />
              </div>

              {/* 成功メッセージ */}
              {success && (
                <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-md p-3">
                  {success}
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <div id="reset-email-error" role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '送信中...' : 'リセットリンクを送信'}
              </button>

              {/* ログインページに戻る */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-primary hover:underline"
                >
                  ログインページに戻る
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                新しいパスワードを設定してください。
              </p>

              {/* 新しいパスワード */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  新しいパスワード（英字・数字を含む8文字以上）
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'reset-password-error' : undefined}
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

              {/* パスワード確認 */}
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
                    aria-describedby={error ? 'reset-password-error' : undefined}
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
                <div id="reset-password-error" role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '設定中...' : 'パスワードを変更'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
