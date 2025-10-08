import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PublicLayout } from '@/components/layouts/PublicLayout'
import { supabase } from '@/lib/supabase'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // URLからトークンとメールアドレスを取得
    const tokenFromUrl = searchParams.get('token')
    const emailFromUrl = searchParams.get('email')

    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }

    if (!tokenFromUrl) {
      setError('無効な招待リンクです。')
    }
  }, [searchParams])

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
      const token = searchParams.get('token')
      if (!token) {
        throw new Error('トークンが見つかりません。')
      }

      // モック認証の場合
      if (import.meta.env.VITE_SUPABASE_URL === 'https://mock-project.supabase.co') {
        console.log('Mock invitation acceptance')
        // モック環境では単純に成功とする
        await new Promise(resolve => setTimeout(resolve, 500))

        navigate('/login', {
          state: { message: 'パスワードが設定されました。\nログインしてください。' }
        })
        return
      }

      // 本番用のSupabase招待受諾処理
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // 成功したらログインページへ
      navigate('/login', {
        state: { message: 'パスワードが設定されました。\nログインしてください。' }
      })
    } catch (err: any) {
      setError(err.message || '招待の受諾に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'invitation-error' : undefined}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            {/* パスワード確認入力 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'invitation-error' : undefined}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
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
              disabled={isLoading}
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
