import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { API_PATHS } from '@/types'

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // セッションからアクセストークンを取得
  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setAccessToken(session?.access_token || null)
    }
    if (open) {
      getToken()
    }
  }, [open])

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setError('')
    setSuccess('')
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    // バリデーション
    if (!currentPassword) {
      setError('現在のパスワードを入力してください。')
      return
    }

    if (!newPassword) {
      setError('新しいパスワードを入力してください。')
      return
    }

    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください。')
      return
    }

    // 英数字のみ許可
    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
      setError('新しいパスワードは英数字のみ使用できます。')
      return
    }

    // 英字と数字の両方を含むかチェック
    const hasLetter = /[a-zA-Z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    if (!hasLetter || !hasNumber) {
      setError('新しいパスワードは英字と数字の両方を含めてください。')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません。')
      return
    }

    if (currentPassword === newPassword) {
      setError('新しいパスワードは現在のパスワードと異なる必要があります。')
      return
    }

    setIsLoading(true)

    try {
      if (!accessToken) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        return
      }

      const response = await fetch(`http://localhost:3001${API_PATHS.CHANGE_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'パスワードの変更に失敗しました。')
      }

      setSuccess('パスワードを変更しました。新しいパスワードで再ログインしてください。')
      // 成功後、ログアウトしてログイン画面へ
      setTimeout(async () => {
        await logout()
        navigate('/login', { state: { message: 'パスワードを変更しました。\n新しいパスワードでログインしてください。' } })
      }, 1500)
    } catch (err: any) {
      console.error('パスワード変更エラー:', err)
      setError(err?.message || 'パスワードの変更に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>パスワード変更</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* 成功メッセージ */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 現在のパスワード */}
          <TextField
            label="現在のパスワード"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showCurrentPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 新しいパスワード */}
          <TextField
            label="新しいパスワード"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            helperText="英数字のみ、英字・数字を両方含む8文字以上"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showNewPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 新しいパスワード（確認） */}
          <TextField
            label="新しいパスワード（確認）"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: isMobile ? 'column-reverse' : 'row',
          gap: isMobile ? 1 : 0,
          '& > button': isMobile ? { width: '100%' } : {},
        }}
      >
        <Button onClick={handleClose} fullWidth={isMobile} disabled={isLoading}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          fullWidth={isMobile}
        >
          {isLoading ? '変更中...' : 'パスワードを変更'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
