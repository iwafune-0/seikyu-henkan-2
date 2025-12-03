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
  type SelectChangeEvent,
} from '@mui/material'
import { PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'
import { UsersService } from '@/services/mock/usersService'
import { useAuthStore } from '@/stores/auth'
import type { User, UserRole } from '@/types'

export function UsersPage() {
  const { user: currentUser, setUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 招待モーダル
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('user')

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

  useEffect(() => {
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
            onClick={handleOpenInviteModal}
            disabled={loading}
            sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 2, sm: 3 },
              whiteSpace: 'nowrap'
            }}
          >
            新規ユーザーを招待
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
                    <TableCell align="right" sx={{ width: 100 }}></TableCell>
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
                        <Button
                          color="error"
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDeleteModal(user)}
                          disabled={loading}
                        >
                          削除
                        </Button>
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

        {/* 削除確認モーダル */}
        <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal} maxWidth="sm" fullWidth>
          <DialogTitle>ユーザーの削除</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>以下のユーザーを削除してもよろしいですか？</Typography>
            <Typography sx={{ fontWeight: 'bold', mb: 2 }}>{deleteTarget?.email}</Typography>
            <Alert severity="error">この操作は取り消せません</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteModal}>キャンセル</Button>
            <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={loading}>
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
