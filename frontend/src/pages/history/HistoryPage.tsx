/**
 * P-003: 処理履歴・ダウンロードページ
 *
 * 全ユーザー閲覧可能
 * 機能:
 * - 処理履歴一覧表示（レスポンシブ対応）
 * - フィルター機能（取引先、処理者、状態、期間、並び順）
 * - 処理詳細モーダル
 * - エラー詳細モーダル
 * - ファイルダウンロード（個別/ZIP一括）
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
  Typography,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tabs,
  Tab,
  type SelectChangeEvent,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  FolderZip as FolderZipIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'
import { fetchHistory, downloadFile, downloadZip } from '@/services/historyService'
import { fetchCompanies } from '@/services/companiesService'
import { UsersService } from '@/services/usersService'
import type { ProcessedFile, DownloadFileType, Company, User } from '@/types'

interface TabPanelProps {
  children?: React.ReactNode
  value: number
  index: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`detail-tabpanel-${index}`}
      style={{
        height: '220px',
        paddingTop: '16px',
      }}
    >
      {value === index && children}
    </div>
  )
}

export function HistoryPage() {
  const [history, setHistory] = useState<ProcessedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フィルター（company_name, user_emailで直接フィルタリング）
  const [companyFilter, setCompanyFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState<Dayjs | null>(null)
  const [dateToFilter, setDateToFilter] = useState<Dayjs | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // 処理詳細モーダル
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ProcessedFile | null>(null)
  const [detailTabValue, setDetailTabValue] = useState(0)

  // エラー詳細モーダル
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorDetail, setErrorDetail] = useState<ProcessedFile | null>(null)

  // Snackbar（成功通知・軽微なエラー用）
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // Snackbar表示（成功通知・軽微なエラー）
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // 処理履歴取得
  const fetchHistoryData = async () => {
    setLoading(true)
    setError(null)
    try {
      // フィルターなしで全データを取得
      const response = await fetchHistory()

      // クライアント側でフィルタリング
      let filtered = response.history

      if (companyFilter) {
        filtered = filtered.filter((h) => h.company_name === companyFilter)
      }
      if (userFilter) {
        filtered = filtered.filter((h) => h.user_email === userFilter)
      }
      if (statusFilter) {
        filtered = filtered.filter((h) => h.status === statusFilter)
      }
      if (dateFromFilter) {
        const dateFromStr = dateFromFilter.format('YYYY-MM-DD')
        filtered = filtered.filter((h) => h.process_date >= dateFromStr)
      }
      if (dateToFilter) {
        const dateToStr = dateToFilter.format('YYYY-MM-DD')
        filtered = filtered.filter((h) => h.process_date <= dateToStr)
      }

      // 並び順
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })

      setHistory(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : '処理履歴の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistoryData()
  }, [companyFilter, userFilter, statusFilter, dateFromFilter, dateToFilter, sortOrder])

  // 処理詳細モーダルを開く
  const handleOpenDetailModal = (record: ProcessedFile) => {
    setSelectedRecord(record)
    setDetailTabValue(0)
    setDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false)
    setSelectedRecord(null)
  }

  const handleDetailTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setDetailTabValue(newValue)
  }

  // エラー詳細モーダルを開く
  const handleOpenErrorModal = (record: ProcessedFile) => {
    setErrorDetail(record)
    setErrorModalOpen(true)
  }

  const handleCloseErrorModal = () => {
    setErrorModalOpen(false)
    setErrorDetail(null)
  }

  // 個別ファイルダウンロード
  const handleDownloadFile = async (historyId: string, fileType: DownloadFileType) => {
    try {
      await downloadFile(historyId, fileType)
      showSnackbar('ファイルをダウンロードしました', 'success')
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'ダウンロードに失敗しました', 'error')
    }
  }

  // ZIP一括ダウンロード
  const handleDownloadZip = async (historyId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    try {
      await downloadZip(historyId)
      showSnackbar('ZIPファイルをダウンロードしました', 'success')
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'ダウンロードに失敗しました', 'error')
    }
  }

  // ステータスチップ
  const renderStatusChip = (status: string) => {
    if (status === 'success') {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="成功"
          color="success"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      )
    } else {
      return (
        <Chip
          icon={<ErrorIcon />}
          label="エラー"
          color="error"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      )
    }
  }

  // 取引先一覧（companiesServiceから取得）とユーザー一覧（usersServiceから取得）
  const [companies, setCompanies] = useState<Company[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])

  // 取引先が無効かどうかを判定
  const isCompanyInactive = (companyName?: string) => {
    if (!companyName) return false
    const company = companies.find((c) => c.name === companyName)
    return company ? !company.is_active : false
  }

  // 取引先のスタイル（無効の場合グレー表示）
  const getCompanyStyle = (name?: string) => {
    if (isCompanyInactive(name)) {
      return { color: '#9e9e9e', fontStyle: 'italic' }
    }
    return {}
  }

  // 取引先名の表示（無効の場合は「（無効）」を付与）
  const getCompanyDisplayName = (name?: string) => {
    if (!name) return ''
    return isCompanyInactive(name) ? `${name}（無効）` : name
  }

  // ユーザーが削除済みかどうかを判定
  const isUserDeleted = (email?: string) => {
    if (!email) return false
    const user = allUsers.find((u) => u.email === email)
    return user ? user.is_deleted : false
  }

  // ユーザーのスタイル（削除済みの場合グレー表示）
  const getUserStyle = (email?: string) => {
    if (isUserDeleted(email)) {
      return { color: '#9e9e9e', fontStyle: 'italic' }
    }
    return {}
  }

  // ユーザー名の表示（削除済みの場合は「（削除済み）」を付与）
  const getUserDisplayName = (email?: string) => {
    if (!email) return ''
    return isUserDeleted(email) ? `${email}（削除済み）` : email
  }

  // 処理日時のフォーマット（処理日 + 実行時刻）
  const formatProcessDateTime = (record: ProcessedFile) => {
    const time = dayjs(record.created_at).format('HH:mm')
    return `${record.process_date} ${time}`
  }

  // 初回読み込み時に取引先・ユーザー・履歴データを取得
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 取引先マスタから取得（companiesServiceと連携）
        const companiesResponse = await fetchCompanies()
        setCompanies(companiesResponse.companies)

        // ユーザーマスタから取得（削除済みユーザーを含む）
        // 履歴ページでは削除済みユーザーをグレー表示するため、全ユーザーが必要
        const usersResponse = await UsersService.getUsers(true)
        setAllUsers(usersResponse.users)
      } catch (err) {
        console.error('Failed to load initial data:', err)
      }
    }
    loadInitialData()
  }, [])

  // ユーザー一覧（フィルター用）- usersServiceから取得（削除済み含む）
  // フィルターは全ユーザーを表示し、削除済みには「（削除済み）」を付与

  return (
    <AuthenticatedLayout>
      <Box>
        {/* ヘッダー */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem', lg: '1.5rem' },
            fontWeight: 600,
            pt: { xs: 0.5, sm: 1 },
            mb: 3,
          }}
        >
          処理履歴・ダウンロード
        </Typography>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* フィルター */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {/* 取引先フィルター */}
            <FormControl size="small" fullWidth>
              <InputLabel shrink>取引先</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e: SelectChangeEvent) => setCompanyFilter(e.target.value)}
                label="取引先"
                sx={{ cursor: 'pointer' }}
                displayEmpty
                renderValue={(value) => value || 'すべて'}
                notched
              >
                <MenuItem value="">すべて</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.name}>
                    {company.name}
                    {!company.is_active && ' （無効）'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 処理者フィルター */}
            <FormControl size="small" fullWidth>
              <InputLabel shrink>処理者</InputLabel>
              <Select
                value={userFilter}
                onChange={(e: SelectChangeEvent) => setUserFilter(e.target.value)}
                label="処理者"
                sx={{ cursor: 'pointer' }}
                displayEmpty
                renderValue={(value) => value || 'すべて'}
                notched
              >
                <MenuItem value="">すべて</MenuItem>
                {allUsers.map((user) => (
                  <MenuItem key={user.id} value={user.email}>
                    {user.email}
                    {user.is_deleted && '（削除済み）'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 状態フィルター */}
            <FormControl size="small" fullWidth>
              <InputLabel shrink>状態</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                label="状態"
                sx={{ cursor: 'pointer' }}
                displayEmpty
                renderValue={(value) => value === 'success' ? '成功' : value === 'error' ? 'エラー' : 'すべて'}
                notched
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="success">成功</MenuItem>
                <MenuItem value="error">エラー</MenuItem>
              </Select>
            </FormControl>

            {/* 期間（開始） */}
            <DatePicker
              label="期間（開始）"
              value={dateFromFilter}
              onChange={(newValue) => setDateFromFilter(newValue)}
              views={['year', 'month', 'day']}
              localeText={{
                cancelButtonLabel: 'キャンセル',
                okButtonLabel: '決定',
              }}
              slotProps={{
                toolbar: { hidden: true },
                textField: {
                  size: 'small',
                  fullWidth: true,
                  inputProps: {
                    style: { cursor: 'pointer' },
                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                      // すべてのキーボード入力をブロック（カレンダー操作は除く）
                      if (!['Enter', 'Escape', 'Tab'].includes(e.key)) {
                        e.preventDefault()
                      }
                    },
                    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
                      // フォーカス時にテキスト選択を防ぐ
                      e.target.blur()
                      e.target.focus()
                    },
                  },
                },
                field: {
                  clearable: true,
                  onClear: () => setDateFromFilter(null),
                },
              }}
            />

            {/* 期間（終了） */}
            <DatePicker
              label="期間（終了）"
              value={dateToFilter}
              onChange={(newValue) => setDateToFilter(newValue)}
              views={['year', 'month', 'day']}
              localeText={{
                cancelButtonLabel: 'キャンセル',
                okButtonLabel: '決定',
              }}
              slotProps={{
                toolbar: { hidden: true },
                textField: {
                  size: 'small',
                  fullWidth: true,
                  inputProps: {
                    style: { cursor: 'pointer' },
                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                      // すべてのキーボード入力をブロック（カレンダー操作は除く）
                      if (!['Enter', 'Escape', 'Tab'].includes(e.key)) {
                        e.preventDefault()
                      }
                    },
                    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
                      // フォーカス時にテキスト選択を防ぐ
                      e.target.blur()
                      e.target.focus()
                    },
                  },
                },
                field: {
                  clearable: true,
                  onClear: () => setDateToFilter(null),
                },
              }}
            />

            {/* 並び順 */}
            <FormControl size="small" fullWidth>
              <InputLabel>並び順</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e: SelectChangeEvent) => setSortOrder(e.target.value as 'desc' | 'asc')}
                label="並び順"
                sx={{ cursor: 'pointer' }}
              >
                <MenuItem value="desc">新しい順</MenuItem>
                <MenuItem value="asc">古い順</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>

        {/* デスクトップ（1024px以上）: テーブル表示 */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 200 }}>取引先</TableCell>
                    <TableCell sx={{ width: 160 }}>処理日時</TableCell>
                    <TableCell sx={{ width: 250 }}>処理者</TableCell>
                    <TableCell sx={{ width: 100 }}>状態</TableCell>
                    <TableCell sx={{ width: 150 }}>出力ファイル</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record) => (
                    <TableRow
                      key={record.id}
                      hover
                      onClick={() =>
                        record.status === 'success'
                          ? handleOpenDetailModal(record)
                          : handleOpenErrorModal(record)
                      }
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={getCompanyStyle(record.company_name)}>
                        {getCompanyDisplayName(record.company_name)}
                      </TableCell>
                      <TableCell>{formatProcessDateTime(record)}</TableCell>
                      <TableCell sx={getUserStyle(record.user_email)}>
                        {getUserDisplayName(record.user_email)}
                      </TableCell>
                      <TableCell>{renderStatusChip(record.status)}</TableCell>
                      <TableCell>
                        {record.status === 'success' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FolderZipIcon />}
                            onClick={(e) => handleDownloadZip(record.id, e)}
                          >
                            一括DL（ZIP）
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        処理履歴がありません
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
          {history.length === 0 && !loading ? (
            <Card sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
              <Typography color="text.secondary">処理履歴がありません</Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {history.map((record) => (
                <Card
                  key={record.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                  }}
                  onClick={() =>
                    record.status === 'success'
                      ? handleOpenDetailModal(record)
                      : handleOpenErrorModal(record)
                  }
                >
                  {/* ヘッダー */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600, ...getCompanyStyle(record.company_name) }}>
                      {getCompanyDisplayName(record.company_name)}
                    </Typography>
                    {renderStatusChip(record.status)}
                  </Box>

                  {/* ボディ */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      処理日時:
                    </Typography>
                    <Typography variant="body2">{formatProcessDateTime(record)}</Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      処理者:
                    </Typography>
                    <Typography variant="body2" sx={getUserStyle(record.user_email)}>
                      {getUserDisplayName(record.user_email)}
                    </Typography>
                  </Box>

                  {/* フッター */}
                  {record.status === 'success' && (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FolderZipIcon />}
                        onClick={(e) => handleDownloadZip(record.id, e)}
                        fullWidth
                      >
                        一括DL（ZIP）
                      </Button>
                    </Box>
                  )}
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* 処理詳細モーダル */}
        <Dialog
          open={detailModalOpen}
          onClose={handleCloseDetailModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            処理詳細
          </DialogTitle>
          <DialogContent sx={{ pt: 2, px: 3, pb: 3 }}>
            {selectedRecord && (
              <Box>
                {/* 処理情報 */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 60, flexShrink: 0 }}>
                      取引先
                    </Typography>
                    <Typography variant="body1" sx={getCompanyStyle(selectedRecord.company_name)}>
                      {getCompanyDisplayName(selectedRecord.company_name)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 60, flexShrink: 0 }}>
                      処理日時
                    </Typography>
                    <Typography variant="body1">{formatProcessDateTime(selectedRecord)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 60, flexShrink: 0 }}>
                      処理者
                    </Typography>
                    <Typography variant="body1" sx={getUserStyle(selectedRecord.user_email)}>
                      {getUserDisplayName(selectedRecord.user_email)}
                    </Typography>
                  </Box>
                </Box>

                <Tabs
                  value={detailTabValue}
                  onChange={handleDetailTabChange}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 0,
                  }}
                >
                  <Tab label="生成ファイル" />
                  <Tab label="使用したファイル" />
                </Tabs>

                {/* タブ1: 生成ファイル */}
                <TabPanel value={detailTabValue} index={0}>
                  {selectedRecord.excel_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'excel')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.excel_filename}
                      </Typography>
                    </Box>
                  )}
                  {selectedRecord.order_pdf_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'order_pdf')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.order_pdf_filename}
                      </Typography>
                    </Box>
                  )}
                  {selectedRecord.inspection_pdf_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'inspection_pdf')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.inspection_pdf_filename}
                      </Typography>
                    </Box>
                  )}
                </TabPanel>

                {/* タブ2: 使用したファイル */}
                <TabPanel value={detailTabValue} index={1}>
                  {selectedRecord.input_pdf_1_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'input_pdf_1')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.input_pdf_1_filename}
                      </Typography>
                    </Box>
                  )}
                  {selectedRecord.input_pdf_2_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'input_pdf_2')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.input_pdf_2_filename}
                      </Typography>
                    </Box>
                  )}
                  {selectedRecord.input_pdf_3_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'input_pdf_3')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.input_pdf_3_filename}
                      </Typography>
                    </Box>
                  )}
                  {selectedRecord.input_pdf_4_filename && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      onClick={() => handleDownloadFile(selectedRecord.id, 'input_pdf_4')}
                    >
                      <DownloadIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body1">
                        {selectedRecord.input_pdf_4_filename}
                      </Typography>
                    </Box>
                  )}
                </TabPanel>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal} variant="contained">
              閉じる
            </Button>
          </DialogActions>
        </Dialog>

        {/* エラー詳細モーダル */}
        <Dialog open={errorModalOpen} onClose={handleCloseErrorModal} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="error">
                エラー詳細 - {getCompanyDisplayName(errorDetail?.company_name)} {errorDetail?.process_date}
              </Typography>
              <IconButton onClick={handleCloseErrorModal} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {errorDetail && (
              <Box>
                {/* エラー内容 */}
                {errorDetail.error_message && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="error">
                      {errorDetail.error_message}
                    </Alert>
                  </Box>
                )}
                {errorDetail.error_code && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      エラーコード
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                      {errorDetail.error_code}
                    </Typography>
                  </Box>
                )}
                {errorDetail.error_detail && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      詳細
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {errorDetail.error_detail}
                    </Typography>
                  </Box>
                )}
                {errorDetail.error_stacktrace && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      スタックトレース
                    </Typography>
                    <Paper
                      sx={{
                        mt: 0.5,
                        p: 1,
                        backgroundColor: '#f5f5f5',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      {errorDetail.error_stacktrace}
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar（成功通知・軽微なエラー用） */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AuthenticatedLayout>
  )
}
