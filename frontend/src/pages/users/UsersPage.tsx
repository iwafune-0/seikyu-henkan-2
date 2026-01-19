/**
 * P-004: ユーザー管理ページ
 *
 * 管理者専用ページ
 * 機能:
 * - ユーザー一覧表示
 * - 新規ユーザー招待
 * - ユーザー削除（論理削除）
 * - 権限変更
 *
 * 保護機能:
 * - 最終管理者（管理者が1人のみの場合）の削除/降格ブロック
 */

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
} from '@mui/material'
import { PersonAdd as PersonAddIcon, Visibility, VisibilityOff } from '@mui/icons-material'
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'
import { UsersService } from '@/services/usersService'
import { useAuthStore } from '@/stores/auth'
import type { User, UserRole, AppMode } from '@/types'

export function UsersPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { user: currentUser, setUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // アプリモード（web: 招待メール方式、electron: 直接追加方式）
  const [appMode, setAppMode] = useState<AppMode>('web')

  // 招待モーダル（Webモード用）
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('user')

  // 直接追加モーダル（Electronモード用）
  const [createDirectModalOpen, setCreateDirectModalOpen] = useState(false)
  const [createDirectEmail, setCreateDirectEmail] = useState('')
  const [createDirectPassword, setCreateDirectPassword] = useState('')
  const [showCreateDirectPassword, setShowCreateDirectPassword] = useState(false)
  const [createDirectPasswordConfirm, setCreateDirectPasswordConfirm] = useState('')
  const [showCreateDirectPasswordConfirm, setShowCreateDirectPasswordConfirm] = useState(false)
  const [createDirectRole, setCreateDirectRole] = useState<UserRole>('user')

  // パスワードリセットモーダル（Electronモード用）
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null)
  const [resetPasswordNew, setResetPasswordNew] = useState('')
  const [showResetPasswordNew, setShowResetPasswordNew] = useState(false)
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false)

  // 削除モーダル
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  // アラートダイアログ
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // 確認ダイアログ
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmResolver, setConfirmResolver] = useState<((value: boolean) => void) | null>(null)

  // Snackbar（成功通知・軽微なエラー用）
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // アラート表示（重要な警告のみ）
  const showAlert = (message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }

  // Snackbar表示（成功通知・軽微なエラー）
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // 確認ダイアログ表示
  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmMessage(message)
      setConfirmOpen(true)
      setConfirmResolver(() => resolve)
    })
  }

  // 確認ダイアログの応答
  const handleConfirmResponse = (response: boolean) => {
    setConfirmOpen(false)
    if (confirmResolver) {
      confirmResolver(response)
    }
  }

  // ユーザー一覧取得
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await UsersService.getUsers()
      setUsers(response.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // アプリモード取得
  const fetchAppMode = async () => {
    try {
      const response = await UsersService.getAppMode()
      setAppMode(response.mode)
    } catch (err) {
      // アプリモード取得失敗時はデフォルト（web）を使用
      console.warn('アプリモード取得に失敗しました:', err)
    }
  }

  useEffect(() => {
    fetchAppMode()
    fetchUsers()
  }, [])

  // 招待モーダルを開く
  const handleOpenInviteModal = () => {
    setInviteEmail('')
    setInviteRole('user')
    setInviteModalOpen(true)
  }

  // 招待モーダルを閉じる
  const handleCloseInviteModal = () => {
    setInviteModalOpen(false)
  }

  // ユーザー招待
  const handleInviteUser = async () => {
    if (!inviteEmail) {
      showSnackbar('メールアドレスを入力してください', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await UsersService.inviteUser({
        email: inviteEmail,
        role: inviteRole,
      })
      showSnackbar(response.message, 'success')
      handleCloseInviteModal()
      await fetchUsers()
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : '招待に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 削除モーダルを開く
  const handleOpenDeleteModal = (user: User) => {
    // 最終管理者チェック
    const adminCount = users.filter((u) => u.role === 'admin' && !u.is_deleted).length
    if (user.role === 'admin' && adminCount === 1) {
      showAlert('最終管理者のため削除できません。\n\n他のユーザーを管理者に昇格してから削除してください。')
      return
    }

    setDeleteTarget(user)
    setDeleteModalOpen(true)
  }

  // 削除モーダルを閉じる
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false)
    setDeleteTarget(null)
  }

  // ユーザー削除
  const handleDeleteUser = async () => {
    if (!deleteTarget) return

    setLoading(true)
    try {
      await UsersService.deleteUser(deleteTarget.id)
      showSnackbar(`ユーザーを削除しました: ${deleteTarget.email}`, 'success')
      handleCloseDeleteModal()
      await fetchUsers()
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : '削除に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ロール変更
  const handleRoleChange = async (user: User, newRole: UserRole) => {
    if (user.role === newRole) return

    // 自分自身のロール変更は禁止
    if (currentUser && currentUser.id === user.id) {
      showAlert('自分自身のロールは変更できません。\n\n他の管理者に依頼してください。')
      return
    }

    // 最終管理者チェック
    const adminCount = users.filter((u) => u.role === 'admin' && !u.is_deleted).length
    if (user.role === 'admin' && newRole === 'user' && adminCount === 1) {
      showAlert('最終管理者のため降格できません。\n\n他のユーザーを管理者に昇格してから変更してください。')
      return
    }

    const oldRoleName = user.role === 'admin' ? '管理者' : '一般ユーザー'
    const newRoleName = newRole === 'admin' ? '管理者' : '一般ユーザー'
    const confirmed = await showConfirm(`${user.email} のロールを「${newRoleName}」に変更しますか？`)
    if (!confirmed) {
      return
    }

    setLoading(true)
    try {
      await UsersService.updateUserRole(user.id, { role: newRole })
      showSnackbar(`ロールを変更しました: ${user.email} (${oldRoleName} → ${newRoleName})`, 'success')

      // ログイン中のユーザーのロールが変更された場合、認証ストアも更新
      if (currentUser && currentUser.id === user.id) {
        setUser({
          ...currentUser,
          role: newRole,
        })
      }

      await fetchUsers()
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'ロール変更に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // Electronモード用: 直接ユーザー作成
  // ========================================

  // 直接追加モーダルを開く
  const handleOpenCreateDirectModal = () => {
    setCreateDirectEmail('')
    setCreateDirectPassword('')
    setShowCreateDirectPassword(false)
    setCreateDirectPasswordConfirm('')
    setShowCreateDirectPasswordConfirm(false)
    setCreateDirectRole('user')
    setCreateDirectModalOpen(true)
  }

  // 直接追加モーダルを閉じる
  const handleCloseCreateDirectModal = () => {
    setCreateDirectModalOpen(false)
    setCreateDirectPasswordConfirm('')
  }

  // ユーザー直接作成
  const handleCreateUserDirect = async () => {
    if (!createDirectEmail) {
      showSnackbar('メールアドレスを入力してください', 'error')
      return
    }
    if (!createDirectPassword) {
      showSnackbar('パスワードを入力してください', 'error')
      return
    }
    if (createDirectPassword.length < 8) {
      showSnackbar('パスワードは8文字以上で入力してください', 'error')
      return
    }

    // 英数字のみ許可
    if (!/^[a-zA-Z0-9]+$/.test(createDirectPassword)) {
      showSnackbar('パスワードは英数字のみ使用できます', 'error')
      return
    }

    // 英字と数字の両方を含むかチェック
    const hasLetter = /[a-zA-Z]/.test(createDirectPassword)
    const hasNumber = /[0-9]/.test(createDirectPassword)
    if (!hasLetter || !hasNumber) {
      showSnackbar('パスワードは英字と数字の両方を含めてください', 'error')
      return
    }

    // 確認パスワードのチェック
    if (!createDirectPasswordConfirm) {
      showSnackbar('パスワード（確認）を入力してください', 'error')
      return
    }

    if (createDirectPassword !== createDirectPasswordConfirm) {
      showSnackbar('パスワードが一致しません', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await UsersService.createUserDirect({
        email: createDirectEmail,
        password: createDirectPassword,
        role: createDirectRole,
      })
      showSnackbar(response.message, 'success')
      handleCloseCreateDirectModal()
      await fetchUsers()
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'ユーザー作成に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // Electronモード用: パスワード直接リセット
  // ========================================

  // パスワードリセットモーダルを開く
  const handleOpenResetPasswordModal = (user: User) => {
    setResetPasswordTarget(user)
    setResetPasswordNew('')
    setShowResetPasswordNew(false)
    setResetPasswordConfirm('')
    setShowResetPasswordConfirm(false)
    setResetPasswordModalOpen(true)
  }

  // パスワードリセットモーダルを閉じる
  const handleCloseResetPasswordModal = () => {
    setResetPasswordModalOpen(false)
    setResetPasswordTarget(null)
    setResetPasswordNew('')
    setResetPasswordConfirm('')
  }

  // パスワード直接リセット
  const handleResetPasswordDirect = async () => {
    if (!resetPasswordTarget) return
    if (!resetPasswordNew) {
      showSnackbar('新しいパスワードを入力してください', 'error')
      return
    }
    if (resetPasswordNew.length < 8) {
      showSnackbar('パスワードは8文字以上で入力してください', 'error')
      return
    }

    // 英数字のみ許可
    if (!/^[a-zA-Z0-9]+$/.test(resetPasswordNew)) {
      showSnackbar('パスワードは英数字のみ使用できます', 'error')
      return
    }

    // 英字と数字の両方を含むかチェック
    const hasLetterReset = /[a-zA-Z]/.test(resetPasswordNew)
    const hasNumberReset = /[0-9]/.test(resetPasswordNew)
    if (!hasLetterReset || !hasNumberReset) {
      showSnackbar('パスワードは英字と数字の両方を含めてください', 'error')
      return
    }

    // 確認パスワードのチェック
    if (!resetPasswordConfirm) {
      showSnackbar('パスワード（確認）を入力してください', 'error')
      return
    }

    if (resetPasswordNew !== resetPasswordConfirm) {
      showSnackbar('パスワードが一致しません', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await UsersService.resetPasswordDirect(resetPasswordTarget.id, {
        new_password: resetPasswordNew,
      })
      showSnackbar(response.message, 'success')
      handleCloseResetPasswordModal()
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'パスワードリセットに失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // ユーザー追加ボタンのハンドラー（モードにより分岐）
  // ========================================
  const handleOpenAddUserModal = () => {
    if (appMode === 'electron') {
      handleOpenCreateDirectModal()
    } else {
      handleOpenInviteModal()
    }
  }

  return (
    <AuthenticatedLayout>
      <Box>
        {/* ヘッダー */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
            gap: 2
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem', lg: '1.5rem' },
              fontWeight: 600
            }}
          >
            ユーザー管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />}
            onClick={handleOpenAddUserModal}
            disabled={loading}
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 2, sm: 3 },
              whiteSpace: 'nowrap'
            }}
          >
            {appMode === 'electron' ? '新規ユーザーを追加' : '新規ユーザーを招待'}
          </Button>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* デスクトップ（1024px以上）: テーブル表示 */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>メールアドレス</TableCell>
                    <TableCell sx={{ width: 200 }}>ロール</TableCell>
                    <TableCell sx={{ width: 150 }}>登録日</TableCell>
                    <TableCell align="right" sx={{ width: appMode === 'electron' ? 200 : 100 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={user.role}
                            onChange={(e: SelectChangeEvent) => handleRoleChange(user, e.target.value as UserRole)}
                            disabled={loading}
                          >
                            <MenuItem value="admin">管理者</MenuItem>
                            <MenuItem value="user">一般ユーザー</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          {appMode === 'electron' && (
                            <Button
                              color="primary"
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenResetPasswordModal(user)}
                              disabled={loading}
                            >
                              PW変更
                            </Button>
                          )}
                          <Button
                            color="error"
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenDeleteModal(user)}
                            disabled={loading}
                          >
                            削除
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        ユーザーがいません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* モバイル・タブレット（1024px未満）: カードレイアウト */}
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
          {users.length === 0 && !loading ? (
            <Card sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <Typography color="text.secondary">ユーザーがいません</Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {users.map((user) => (
                <Card key={user.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      メールアドレス
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      ロール
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={user.role}
                        onChange={(e: SelectChangeEvent) => handleRoleChange(user, e.target.value as UserRole)}
                        disabled={loading}
                      >
                        <MenuItem value="admin">管理者</MenuItem>
                        <MenuItem value="user">一般ユーザー</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      登録日
                    </Typography>
                    <Typography variant="body2">
                      {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {appMode === 'electron' && (
                      <Button
                        color="primary"
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenResetPasswordModal(user)}
                        disabled={loading}
                        fullWidth
                      >
                        パスワード変更
                      </Button>
                    )}
                    <Button
                      color="error"
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenDeleteModal(user)}
                      disabled={loading}
                      fullWidth
                    >
                      削除
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* 招待モーダル */}
        <Dialog open={inviteModalOpen} onClose={handleCloseInviteModal} maxWidth="sm" fullWidth>
          <DialogTitle>新規ユーザーを招待</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                label="メールアドレス"
                type="email"
                value={inviteEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="user@example.com"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>ロール</InputLabel>
                <Select
                  value={inviteRole}
                  onChange={(e: SelectChangeEvent) => setInviteRole(e.target.value as UserRole)}
                  label="ロール"
                >
                  <MenuItem value="user">一般ユーザー</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseInviteModal}>キャンセル</Button>
            <Button onClick={handleInviteUser} variant="contained" disabled={loading}>
              招待メールを送信
            </Button>
          </DialogActions>
        </Dialog>

        {/* 直接ユーザー作成モーダル（Electronモード用） */}
        <Dialog open={createDirectModalOpen} onClose={handleCloseCreateDirectModal} maxWidth="sm" fullWidth>
          <DialogTitle>新規ユーザーを追加</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                label="メールアドレス"
                type="email"
                value={createDirectEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateDirectEmail(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="user@example.com"
                required
              />
              <TextField
                label="初期パスワード"
                type={showCreateDirectPassword ? 'text' : 'password'}
                value={createDirectPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateDirectPassword(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="英数字のみ、8文字以上"
                required
                helperText="英数字のみ、英字・数字を両方含む8文字以上"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showCreateDirectPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                        onClick={() => setShowCreateDirectPassword(!showCreateDirectPassword)}
                        edge="end"
                      >
                        {showCreateDirectPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="初期パスワード（確認）"
                type={showCreateDirectPasswordConfirm ? 'text' : 'password'}
                value={createDirectPasswordConfirm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateDirectPasswordConfirm(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="もう一度入力してください"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showCreateDirectPasswordConfirm ? 'パスワードを隠す' : 'パスワードを表示'}
                        onClick={() => setShowCreateDirectPasswordConfirm(!showCreateDirectPasswordConfirm)}
                        edge="end"
                      >
                        {showCreateDirectPasswordConfirm ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>ロール</InputLabel>
                <Select
                  value={createDirectRole}
                  onChange={(e: SelectChangeEvent) => setCreateDirectRole(e.target.value as UserRole)}
                  label="ロール"
                >
                  <MenuItem value="user">一般ユーザー</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: isMobile ? 1 : 0,
              '& > button': isMobile ? { width: '100%' } : {},
            }}
          >
            <Button onClick={handleCloseCreateDirectModal} fullWidth={isMobile}>キャンセル</Button>
            <Button onClick={handleCreateUserDirect} variant="contained" disabled={loading} fullWidth={isMobile}>
              ユーザーを追加
            </Button>
          </DialogActions>
        </Dialog>

        {/* パスワードリセットモーダル（Electronモード用） */}
        <Dialog open={resetPasswordModalOpen} onClose={handleCloseResetPasswordModal} maxWidth="sm" fullWidth>
          <DialogTitle>パスワードをリセット</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography sx={{ mb: 2 }}>
                対象ユーザー: <strong>{resetPasswordTarget?.email}</strong>
              </Typography>
              <TextField
                label="新しいパスワード"
                type={showResetPasswordNew ? 'text' : 'password'}
                value={resetPasswordNew}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetPasswordNew(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="英数字のみ、8文字以上"
                required
                helperText="英数字のみ、英字・数字を両方含む8文字以上"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showResetPasswordNew ? 'パスワードを隠す' : 'パスワードを表示'}
                        onClick={() => setShowResetPasswordNew(!showResetPasswordNew)}
                        edge="end"
                      >
                        {showResetPasswordNew ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="新しいパスワード（確認）"
                type={showResetPasswordConfirm ? 'text' : 'password'}
                value={resetPasswordConfirm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetPasswordConfirm(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="もう一度入力してください"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showResetPasswordConfirm ? 'パスワードを隠す' : 'パスワードを表示'}
                        onClick={() => setShowResetPasswordConfirm(!showResetPasswordConfirm)}
                        edge="end"
                      >
                        {showResetPasswordConfirm ? <Visibility /> : <VisibilityOff />}
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
            <Button onClick={handleCloseResetPasswordModal} fullWidth={isMobile}>キャンセル</Button>
            <Button onClick={handleResetPasswordDirect} variant="contained" disabled={loading} fullWidth={isMobile}>
              パスワードをリセット
            </Button>
          </DialogActions>
        </Dialog>

        {/* 削除確認モーダル */}
        <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal} maxWidth="sm" fullWidth>
          <DialogTitle>ユーザーの削除</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>以下のユーザーを削除してもよろしいですか？</Typography>
            <Typography sx={{ fontWeight: 'bold', mb: 2 }}>{deleteTarget?.email}</Typography>
            <Alert severity="error">この操作は取り消せません</Alert>
          </DialogContent>
          <DialogActions
            sx={{
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: isMobile ? 1 : 0,
              '& > button': isMobile ? { width: '100%' } : {},
            }}
          >
            <Button onClick={handleCloseDeleteModal} fullWidth={isMobile}>キャンセル</Button>
            <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={loading} fullWidth={isMobile}>
              削除
            </Button>
          </DialogActions>
        </Dialog>

        {/* アラートダイアログ */}
        <Dialog open={alertOpen} onClose={() => setAlertOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>確認</DialogTitle>
          <DialogContent>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{alertMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAlertOpen(false)} variant="contained">
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* 確認ダイアログ */}
        <Dialog open={confirmOpen} onClose={() => handleConfirmResponse(false)} maxWidth="sm" fullWidth>
          <DialogTitle>確認</DialogTitle>
          <DialogContent>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{confirmMessage}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleConfirmResponse(false)}>キャンセル</Button>
            <Button onClick={() => handleConfirmResponse(true)} variant="contained">
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar（成功通知・軽微なエラー用） */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AuthenticatedLayout>
  )
}
