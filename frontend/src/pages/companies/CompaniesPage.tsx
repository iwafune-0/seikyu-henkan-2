import { useEffect, useState, useCallback, useRef } from 'react'
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
  Paper,
  IconButton,
} from '@mui/material'
import {
  CloudUpload,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'
import type { Company } from '@/types'
import {
  fetchCompanies,
  updateCompany,
  uploadTemplate,
  downloadTemplate,
} from '@/services/companiesService'

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
        paddingTop: '16px',
      }}
    >
      {value === index && children}
    </div>
  )
}

// ISO形式の日時を日本語形式に変換
const formatDateTime = (isoString: string | undefined | null): string => {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CompaniesPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

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
  const [templateUploaded, setTemplateUploaded] = useState(false)

  // Drag & drop state
  const [isTemplateDragging, setIsTemplateDragging] = useState(false)
  const templateDragCounterRef = useRef(0)
  const templateInputRef = useRef<HTMLInputElement>(null)

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
    setTemplateUploaded(false)
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

  // テンプレートファイル処理
  const handleTemplateFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showSnackbar('Excelファイルを選択してください', 'error')
      return
    }
    if (!selectedCompany) return

    // ファイル名に取引先名が含まれているか検証
    const companyNameLower = selectedCompany.name.toLowerCase()
    const fileNameLower = file.name.toLowerCase()
    if (!fileNameLower.includes(companyNameLower)) {
      showSnackbar(`ファイル名に「${selectedCompany.name}」が含まれている必要があります`, 'error')
      return
    }

    setSelectedFile(file)
    setTemplateUploaded(true)
  }, [selectedCompany])

  // ファイル選択ハンドラー
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleTemplateFile(file)
    }
    event.target.value = ''
  }

  // テンプレート削除
  const handleRemoveTemplate = useCallback(() => {
    setSelectedFile(null)
    setTemplateUploaded(false)
    showSnackbar('テンプレートを削除しました', 'success')
  }, [])

  // ドラッグ&ドロップハンドラー
  const handleTemplateDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    templateDragCounterRef.current++
    if (templateDragCounterRef.current === 1) {
      setIsTemplateDragging(true)
    }
  }, [])

  const handleTemplateDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    templateDragCounterRef.current--
    if (templateDragCounterRef.current === 0) {
      setIsTemplateDragging(false)
    }
  }, [])

  const handleTemplateDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleTemplateDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    templateDragCounterRef.current = 0
    setIsTemplateDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleTemplateFile(file)
    }
  }, [handleTemplateFile])

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

  if (loading) {
    return (
      <AuthenticatedLayout>
        <Box sx={{ textAlign: 'center', py: 4 }}>読み込み中...</Box>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Box>
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
                        {formatDateTime(company.last_processed_at)}
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
                    {formatDateTime(company.last_processed_at)}
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
          <DialogTitle>取引先詳細</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
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
                  最終処理日: {formatDateTime(selectedCompany?.last_processed_at)}
                </Typography>
              </Box>
            </TabPanel>

            {/* Tab 2: Template */}
            <TabPanel value={tabValue} index={1}>
              {/* 現在のテンプレート情報 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  現在のテンプレート
                </Typography>
                {selectedCompany?.template_filename ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    onClick={handleDownloadTemplate}
                  >
                    <DownloadIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {selectedCompany.template_filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedCompany.template_updated_at
                          ? `${new Date(selectedCompany.template_updated_at).toLocaleString('ja-JP')} / ${selectedCompany.template_updated_by || '-'}`
                          : '-'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    テンプレートが登録されていません
                  </Typography>
                )}
              </Box>

              {/* テンプレート更新エリア */}
              <Box
                onDragEnter={handleTemplateDragEnter}
                onDragLeave={handleTemplateDragLeave}
                onDragOver={handleTemplateDragOver}
                onDrop={handleTemplateDrop}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    テンプレート更新
                  </Typography>
                  {templateUploaded && selectedFile && (
                    <Chip label="OK" size="small" color="success" />
                  )}
                </Box>


                {/* アップロード済みの場合 */}
                {templateUploaded && selectedFile ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderColor: 'success.main',
                      borderWidth: 2,
                      backgroundColor: 'success.50',
                      position: 'relative',
                    }}
                  >
                    {/* ドラッグ時のオーバーレイ */}
                    {isTemplateDragging && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          zIndex: 10,
                          borderRadius: 1,
                          pointerEvents: 'none',
                        }}
                      >
                        <CloudUpload sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>
                          ここにドロップ
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: 'background.paper',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <CheckCircleIcon fontSize="small" color="success" />
                      <InsertDriveFileIcon fontSize="small" color="action" />
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={handleRemoveTemplate}
                        sx={{ color: 'error.main' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      ドラッグ&ドロップで差し替え可能
                    </Typography>
                  </Paper>
                ) : (
                  /* 未アップロードの場合：ドロップゾーン */
                  <Box
                    sx={{
                      p: 3,
                      border: '2px dashed',
                      borderColor: isTemplateDragging ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      backgroundColor: isTemplateDragging ? 'action.hover' : 'background.default',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      position: 'relative',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => templateInputRef.current?.click()}
                  >
                    {/* ドラッグ時のオーバーレイ */}
                    {isTemplateDragging && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          zIndex: 10,
                          borderRadius: 1,
                          pointerEvents: 'none',
                        }}
                      >
                        <CloudUpload sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>
                          ここにドロップ
                        </Typography>
                      </Box>
                    )}
                    <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" gutterBottom>
                      Excelファイルをドラッグ&ドロップ
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      または
                    </Typography>
                    <Button variant="outlined" size="small">
                      ファイルを選択
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      .xlsx, .xls形式 / ファイル名に「{selectedCompany?.name}」を含む
                    </Typography>
                  </Box>
                )}
                <input
                  ref={templateInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleFileSelect}
                />
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
                {selectedCompany?.name === 'ネクストビッツ'
                  ? `【編集処理】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文書シート:
  AC2（発行日）: 見積書ファイル名から処理対象月を抽出し当月1日を入力
    例: TRR-25-007_お見積書.pdf → 2025年7月1日
  R18（数量）: 見積書から取得（「1式」→「1」に変換）
  T18（単価）: 見積書から取得

検収書シート:
  R20（数量）: 注文書シートR18と同じ値
  T20（単価）: 注文書シートT18と同じ値

【自動チェック項目】※不一致時はエラー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文書シート:
  AC3（注文番号）: yyyymmdd-01形式か
  B8（宛名）: 「株式会社ネクストビッツ　御中」か
  G12（発注金額）: 請求書PDFの合計金額と一致するか
  C17（明細タイトル）: 「yyyy年mm月分作業費」形式か
  AA17（摘要）: 「見積番号：TRR-YY-0MM」形式で見積PDFと一致するか
  C18（件名）: 見積書の件名に応じた正しい件名か
  C19（明細締め）: 「以下、余白」が入力されているか
  W39（小計）: 請求書PDFの消費税10%対象と一致するか
  W40（消費税）: 請求書PDFの消費税(10%)と一致するか
  W41（合計金額）: 請求書PDFの合計金額と一致するか

検収書シート:
  AC4（検収番号）: yyyymmdd-01形式か
  AC5（検収日）: 当月末日か
  B7（宛名）: 「株式会社ネクストビッツ　御中」か
  G14（合計金額）: 請求書PDFの合計金額と一致するか
  C19（明細タイトル）: 「yyyy年mm月分作業費」形式か
  AA19（摘要）: 「見積番号：TRR-YY-0MM」形式で見積PDFと一致するか
  C20（件名）: 見積書の件名に応じた正しい件名か
  C21（明細締め）: 「以下、余白」が入力されているか
  W41（小計）: 請求書PDFの消費税10%対象と一致するか
  W42（消費税）: 請求書PDFの消費税(10%)と一致するか
  W43（合計金額）: 請求書PDFの合計金額と一致するか

【テンプレート固定項目】※変更不要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  T9〜T12（テラ情報）: テンプレートに記載済み
  検収印（玉置さん印）: テンプレートに貼付済み

※ MVP版では読み取り専用。変更はコード修正が必要です。`
                  : `【編集処理】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文書シート:
  AC2（発行日）: 注文請書の発行日を転記
  AA17（摘要）: 見積書番号を「見積番号：NNNNNNN」形式で入力
  C18〜（件名）: 請求書の品目を転記（先頭に「・」を付加）
  R18〜（数量）: 請求書の明細から転記（複数行対応）
  T18〜（単価）: 請求書の明細から転記
  明細最終行の次行: 「以下、余白」を入力

検収書シート:
  C20〜（件名）: 請求書の品目を転記（先頭に「・」を付加）
  R20〜（数量）: 請求書の明細から転記
  T20〜（単価）: 請求書の明細から転記
  明細最終行の次行: 「以下、余白」を入力

【前月データクリア】
  処理実行時に明細行（最大20行）をクリアしてから新規データを入力

【自動チェック項目】※不一致時はエラー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文書シート:
  AC3（注文番号）: yyyymmdd-02形式か
  B8（宛名）: 「株式会社オフ・ビート・ワークス　御中」か
  G12（発注金額）: 請求書PDFの合計金額と一致するか
  C17（明細タイトル）: 「yyyy年mm月作業費」形式か
  AA17（摘要）: 「見積番号：NNNNNNN」形式で見積PDFと一致するか
  C(18+N)（明細締め）: 「以下、余白」が入力されているか ※Nは明細行数
  W39（小計）: 請求書PDFの小計と一致するか
  W40（消費税）: 請求書PDFの消費税額合計と一致するか
  W41（合計金額）: 請求書PDFの合計と一致するか

検収書シート:
  AC4（検収番号）: yyyymmdd-02形式か
  AC5（検収日）: 当月末日か
  B7（宛名）: 「株式会社オフ・ビート・ワークス　御中」か
  G14（合計金額）: 請求書PDFの合計と一致するか
  C19（明細タイトル）: 「yyyy年mm月作業費」形式か
  AA19（摘要）: 「見積番号：NNNNNNN」形式で見積PDFと一致するか
  C(20+N)（明細締め）: 「以下、余白」が入力されているか ※Nは明細行数
  W41（小計）: 請求書PDFの小計と一致するか
  W42（消費税）: 請求書PDFの消費税額合計と一致するか
  W43（合計金額）: 請求書PDFの合計と一致するか

【テンプレート固定項目】※変更不要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  T9〜T12（テラ情報）: テンプレートに記載済み
  検収印（玉置さん印）: テンプレートに貼付済み

※ MVP版では読み取り専用。変更はコード修正が必要です。`}
              </Box>
            </TabPanel>

          </DialogContent>
          <DialogActions
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: 'white',
              borderTop: '1px solid #e0e0e0',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: { xs: 1.5, sm: 1 },
              '& > button': { width: { xs: '100%', sm: 'auto' } },
            }}
          >
            <Button onClick={handleCloseModal}>
              キャンセル
            </Button>
            <Button onClick={handleSave} variant="contained">
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
