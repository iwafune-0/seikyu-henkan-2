import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Typography,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { CloudUpload, Description } from '@mui/icons-material'
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'
import type { Company } from '@/types'
import {
  fetchCompanies,
  updateCompany,
  uploadTemplate,
  downloadTemplate,
} from '@/services/mock/companiesService'

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
      id={`company-tabpanel-${index}`}
      style={{
        height: '350px',
        overflowY: 'auto',
        paddingTop: '16px',
      }}
    >
      {value === index && children}
    </div>
  )
}

export function CompaniesPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const navigate = useNavigate()

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    is_active: true,
  })
  const [errors, setErrors] = useState({
    name: false,
    display_name: false,
  })

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // Load companies
  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetchCompanies()
      setCompanies(response.companies)
    } catch (error) {
      console.error('Failed to load companies:', error)
      showSnackbar('取引先の読み込みに失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      display_name: company.display_name,
      is_active: company.is_active,
    })
    setErrors({ name: false, display_name: false })
    setTabValue(0)
    setSelectedFile(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedCompany(null)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === 'name' || field === 'display_name') {
      setErrors((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDownloadTemplate = async () => {
    if (!selectedCompany) return

    try {
      await downloadTemplate(selectedCompany.id)
    } catch (error) {
      console.error('Failed to download template:', error)
      showSnackbar('テンプレートのダウンロードに失敗しました', 'error')
    }
  }

  const validateForm = (): boolean => {
    const newErrors = {
      name: !formData.name.trim(),
      display_name: !formData.display_name.trim(),
    }

    setErrors(newErrors)
    return !newErrors.name && !newErrors.display_name
  }

  const handleSave = async () => {
    if (!selectedCompany) return

    // Validation
    if (!validateForm()) {
      showSnackbar('入力エラーがあります', 'error')
      return
    }

    try {
      // Update company info
      await updateCompany(selectedCompany.id, formData)

      // Upload template if file selected
      if (selectedFile) {
        await uploadTemplate(selectedCompany.id, selectedFile)
      }

      // Reload data
      await loadCompanies()

      handleCloseModal()
      showSnackbar('取引先設定を保存しました', 'success')
    } catch (error) {
      console.error('Failed to save company:', error)
      showSnackbar('保存に失敗しました', 'error')
    }
  }

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const handleHistoryRowClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    navigate('/history')
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <Box sx={{ textAlign: 'center', py: 4 }}>読み込み中...</Box>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
          取引先設定
        </Typography>

        {/* Desktop: Table */}
        {!isMobile && (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>取引先名</TableCell>
                    <TableCell>表示名</TableCell>
                    <TableCell>状態</TableCell>
                    <TableCell>最終処理日</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      hover
                      onClick={() => handleRowClick(company)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{company.name}</TableCell>
                      <TableCell>{company.display_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={company.is_active ? '有効' : '無効'}
                          color={company.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {company.last_processed_at || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Mobile: Card Layout */}
        {isMobile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {companies.map((company) => (
              <Card
                key={company.id}
                sx={{ p: 2, cursor: 'pointer' }}
                onClick={() => handleRowClick(company)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                    {company.name}
                  </Typography>
                  <Chip
                    label={company.is_active ? '有効' : '無効'}
                    color={company.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    表示名
                  </Typography>
                  <Typography variant="body2">{company.display_name}</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    最終処理日
                  </Typography>
                  <Typography variant="body2">
                    {company.last_processed_at || '-'}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {/* Company Detail Modal */}
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: isMobile ? '500px' : '600px',
              maxHeight: isMobile ? '95vh' : '90vh',
            },
          }}
        >
          <DialogTitle>
            取引先詳細 - {selectedCompany?.name}
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mb: 2,
                '& .MuiTab-root': {
                  fontSize: isMobile ? '0.75rem' : '0.9375rem',
                  minWidth: isMobile ? 'auto' : 100,
                  flex: isMobile ? 1 : 'none',
                },
              }}
            >
              <Tab label="基本情報" />
              <Tab label="テンプレート" />
              <Tab label="処理ルール" />
              <Tab label="処理履歴" />
            </Tabs>

            {/* Tab 1: Basic Info */}
            <TabPanel value={tabValue} index={0}>
              <TextField
                label="取引先名"
                fullWidth
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={errors.name}
                helperText={errors.name ? '取引先名を入力してください' : ''}
                sx={{ mb: 2 }}
              />
              <TextField
                label="表示名（Excel宛名）"
                fullWidth
                value={formData.display_name}
                onChange={(e) =>
                  handleFormChange('display_name', e.target.value)
                }
                error={errors.display_name}
                helperText={
                  errors.display_name ? '表示名を入力してください' : ''
                }
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      handleFormChange('is_active', e.target.checked)
                    }
                  />
                }
                label={formData.is_active ? '有効' : '無効'}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  最終処理日: {selectedCompany?.last_processed_at || '-'}
                </Typography>
              </Box>
            </TabPanel>

            {/* Tab 2: Template */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  現在のファイル
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {selectedCompany?.template_filename || 'なし'}
                  </Typography>
                  {selectedCompany?.template_filename && (
                    <Button
                      size="small"
                      onClick={handleDownloadTemplate}
                    >
                      ダウンロード
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  更新日時
                </Typography>
                <Typography variant="body1">
                  {selectedCompany?.template_updated_at
                    ? new Date(
                        selectedCompany.template_updated_at
                      ).toLocaleString('ja-JP')
                    : '-'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  更新者
                </Typography>
                <Typography variant="body1">
                  {selectedCompany?.template_updated_by || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  テンプレート更新
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed #e0e0e0',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: selectedFile ? '#e8f5e9' : 'transparent',
                    borderColor: selectedFile ? '#2e7d32' : '#e0e0e0',
                    '&:hover': {
                      borderColor: '#1976d2',
                    },
                  }}
                  onClick={() => document.getElementById('template-upload')?.click()}
                >
                  <input
                    id="template-upload"
                    type="file"
                    accept=".xlsx"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  {selectedFile ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Description color="success" />
                      <Typography variant="body2">{selectedFile.name}</Typography>
                    </Box>
                  ) : (
                    <>
                      <CloudUpload sx={{ fontSize: 32, color: '#9e9e9e' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        クリックしてファイルを選択
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </TabPanel>

            {/* Tab 3: Processing Rules */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="subtitle2" gutterBottom>
                処理ルール（読み取り専用）
              </Typography>
              <Box
                sx={{
                  bgcolor: '#fafafa',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: '#424242',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedCompany?.id === '1'
                  ? `注文番号: yyyymmdd-01 形式
注文書明細タイトル: yyyy年mm月作業費
発行日: 前回+1ヶ月の1日
発注金額: 請求書の合計金額
件名: 見積書の件名（パターン変換）
数量: 見積書の数量（1式→1に変換）
単価: 見積書の単価
小計・消費税・合計: 請求書と一致チェック
宛名: 株式会社ネクストビッツ 御中
明細の締め: 以下、余白

※ MVP版では読み取り専用。変更はコード修正が必要です。`
                  : `※ オフビートワークス様の処理ルールはネクストビッツ様と異なります。

発行日: 前回+1ヶ月の1日
発注金額: 請求書の合計金額
件名: 見積書の件名
数量: 見積書の数量
単価: 見積書の単価
宛名: 株式会社オフビートワークス 御中

※ MVP版では読み取り専用。変更はコード修正が必要です。`}
              </Box>
            </TabPanel>

            {/* Tab 4: Process History */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="subtitle2" gutterBottom>
                処理履歴（最新3件）
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                ※ クリックするとP-003（処理履歴ページ）に遷移します
              </Typography>
              <Card>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>処理日</TableCell>
                        <TableCell>処理者</TableCell>
                        <TableCell>状態</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCompany?.id === '1' ? (
                        <>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleHistoryRowClick}>
                            <TableCell>2025-10-10</TableCell>
                            <TableCell>admin@example.com</TableCell>
                            <TableCell>
                              <Chip label="成功" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleHistoryRowClick}>
                            <TableCell>2025-09-10</TableCell>
                            <TableCell>user@example.com</TableCell>
                            <TableCell>
                              <Chip label="成功" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleHistoryRowClick}>
                            <TableCell>2025-08-10</TableCell>
                            <TableCell>admin@example.com</TableCell>
                            <TableCell>
                              <Chip label="成功" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleHistoryRowClick}>
                            <TableCell>2025-10-08</TableCell>
                            <TableCell>user@example.com</TableCell>
                            <TableCell>
                              <Chip label="成功" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleHistoryRowClick}>
                            <TableCell>2025-09-08</TableCell>
                            <TableCell>admin@example.com</TableCell>
                            <TableCell>
                              <Chip label="成功" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                          <TableRow hover sx={{ cursor: 'pointer' }} onClick={handleHistoryRowClick}>
                            <TableCell>2025-08-08</TableCell>
                            <TableCell>user@example.com</TableCell>
                            <TableCell>
                              <Chip label="成功" color="success" size="small" />
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </TabPanel>
          </DialogContent>
          <DialogActions
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: 'white',
              borderTop: '1px solid #e0e0e0',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              gap: isMobile ? 1.5 : 1,
            }}
          >
            <Button
              onClick={handleCloseModal}
              fullWidth={isMobile}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              fullWidth={isMobile}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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
