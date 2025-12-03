/**
 * P-002: PDF処理実行ページ
 *
 * 全ユーザー利用可能
 * 機能:
 * - 4つのPDFアップロード（ドラッグ&ドロップ対応）
 * - PDF種別ごとのスロット管理（不足表示・個別アップロード）
 * - 取引先自動判別
 * - 事前チェック（フォーマット検証・データ確認）
 * - 初回のみExcelアップロード
 * - 処理実行（プログレスバー表示）
 * - 処理完了後の即時ダウンロード
 */

import { useState, useCallback, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  Typography,
  Alert,
  LinearProgress,
  Snackbar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  FolderZip as FolderZipIcon,
  Refresh as RefreshIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material'
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'
import {
  type ProcessState,
  type ProcessResult,
  type DetectionResult,
  type PdfType,
  type PdfSlot,
  createEmptySlots,
  detectAndPreCheck,
  uploadSinglePdf,
  removeFromSlot,
  uploadExcelTemplate,
  executeProcess,
  downloadResultFile,
  downloadResultZip,
  getPdfTypeLabel,
  isAllSlotsReady,
} from '@/services/mock/processService'

export function ProcessPage() {
  // 状態管理
  const [state, setState] = useState<ProcessState>('initial')
  const [pdfSlots, setPdfSlots] = useState<PdfSlot[]>(createEmptySlots())
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Excelアップロード用
  const [excelFile, setExcelFile] = useState<File | null>(null)

  // Snackbar（成功通知・軽微なエラー用）
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  // アラートダイアログ（重要な警告用）
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // ファイル入力ref
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const slotInputRefs = useRef<Map<PdfType, HTMLInputElement | null>>(new Map())

  // Snackbar表示
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // アラート表示（重要な警告）
  const showAlert = (message: string) => {
    setAlertMessage(message)
    setAlertOpen(true)
  }

  // ドラッグ&ドロップハンドラー
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // PDFファイル処理（複数ファイル一括）
  const handlePdfFiles = useCallback(
    async (files: FileList | File[]) => {
      const pdfFiles = Array.from(files).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      )

      if (pdfFiles.length === 0) {
        showSnackbar('PDFファイルを選択してください', 'error')
        return
      }

      setState('detecting')
      setErrorMessage(null)

      try {
        const result = await detectAndPreCheck(pdfFiles, pdfSlots)
        setDetectionResult(result)
        setPdfSlots(result.pdfSlots)

        // 状態を決定
        if (isAllSlotsReady(result.pdfSlots)) {
          if (result.needsExcel) {
            setState('excel_required')
          } else {
            setState('ready')
          }
        } else {
          setState('incomplete')
        }
      } catch (err) {
        // 取引先混在エラーなどはダイアログで表示し、現在の状態を維持
        const hasExistingFiles = pdfSlots.some((s) => s.file !== null)
        if (hasExistingFiles) {
          // 既存ファイルがある場合はincomplete状態を維持してダイアログ表示
          setState('incomplete')
          showAlert(err instanceof Error ? err.message : '判別処理中にエラーが発生しました')
        } else {
          // 初回アップロード時のエラーはinitial状態に戻してダイアログ表示
          setState('initial')
          showAlert(err instanceof Error ? err.message : '判別処理中にエラーが発生しました')
        }
      }
    },
    [pdfSlots]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragging(false)

      const files = e.dataTransfer.files
      handlePdfFiles(files)
    },
    [handlePdfFiles]
  )

  // ファイル選択ハンドラー（複数ファイル）
  const handlePdfSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) {
        handlePdfFiles(files)
      }
      e.target.value = ''
    },
    [handlePdfFiles]
  )

  // 個別スロットへのファイルアップロード
  const handleSlotUpload = useCallback(
    async (targetType: PdfType, file: File) => {
      setState('detecting')

      try {
        const result = await uploadSinglePdf(file, targetType, pdfSlots)
        setDetectionResult(result)
        setPdfSlots(result.pdfSlots)

        // 状態を決定
        if (isAllSlotsReady(result.pdfSlots)) {
          if (result.needsExcel) {
            setState('excel_required')
          } else {
            setState('ready')
          }
        } else {
          setState('incomplete')
        }

        showSnackbar(`${getPdfTypeLabel(targetType)}をアップロードしました`, 'success')
      } catch (err) {
        // 種別不一致エラーはアラートダイアログで表示
        setState('incomplete')
        showAlert(err instanceof Error ? err.message : 'アップロードに失敗しました')
      }
    },
    [pdfSlots]
  )

  // スロットからファイルを削除
  const handleRemoveFromSlot = useCallback(
    (targetType: PdfType) => {
      const newSlots = removeFromSlot(targetType, pdfSlots)
      setPdfSlots(newSlots)
      setState('incomplete')
      showSnackbar(`${getPdfTypeLabel(targetType)}を削除しました`, 'success')
    },
    [pdfSlots]
  )

  // 個別スロットのファイル選択
  const handleSlotFileSelect = useCallback(
    (targetType: PdfType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleSlotUpload(targetType, file)
      }
      e.target.value = ''
    },
    [handleSlotUpload]
  )

  // Excelアップロード状態
  const [excelUploaded, setExcelUploaded] = useState(false)

  // Excelファイル処理（選択またはドロップ時に即アップロード）
  const handleExcelFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showSnackbar('Excelファイルを選択してください', 'error')
      return
    }
    if (!detectionResult?.company) return

    setExcelFile(file)
    try {
      await uploadExcelTemplate(detectionResult.company.id, file)
      setExcelUploaded(true)
      setState('ready')
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'アップロードに失敗しました')
      setExcelFile(null)
      setExcelUploaded(false)
      setState('excel_required')
    }
  }, [detectionResult])

  // Excelファイル削除（アップロードし直し用）
  const handleRemoveExcel = useCallback(() => {
    setExcelFile(null)
    setExcelUploaded(false)
    setState('excel_required')
    showSnackbar('Excelテンプレートを削除しました', 'success')
  }, [])

  // Excelファイル選択
  const handleExcelSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleExcelFile(file)
    }
    e.target.value = ''
  }, [handleExcelFile])

  // Excelドラッグ&ドロップ
  const [isExcelDragging, setIsExcelDragging] = useState(false)
  const excelDragCounterRef = useRef(0)

  const handleExcelDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    excelDragCounterRef.current++
    if (excelDragCounterRef.current === 1) {
      setIsExcelDragging(true)
    }
  }, [])

  const handleExcelDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    excelDragCounterRef.current--
    if (excelDragCounterRef.current === 0) {
      setIsExcelDragging(false)
    }
  }, [])

  const handleExcelDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleExcelDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    excelDragCounterRef.current = 0
    setIsExcelDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleExcelFile(file)
    }
  }, [handleExcelFile])

  // 処理実行
  const handleExecute = useCallback(async () => {
    if (!detectionResult?.company) return

    setState('processing')
    setProgress(0)
    setProgressMessage('処理を開始しています...')

    try {
      const result = await executeProcess(pdfSlots, detectionResult.company.id, (p, msg) => {
        setProgress(p)
        setProgressMessage(msg)
      })
      setProcessResult(result)
      setState('completed')
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : '処理中にエラーが発生しました')
    }
  }, [pdfSlots, detectionResult])

  // ダウンロード
  const handleDownloadFile = useCallback(
    async (type: 'excel' | 'order_pdf' | 'inspection_pdf') => {
      if (!processResult) return

      try {
        let filename: string
        switch (type) {
          case 'excel':
            filename = processResult.excelFilename
            break
          case 'order_pdf':
            filename = processResult.orderPdfFilename
            break
          case 'inspection_pdf':
            filename = processResult.inspectionPdfFilename
            break
        }
        await downloadResultFile(filename, type)
        showSnackbar('ファイルをダウンロードしました', 'success')
      } catch (err) {
        showSnackbar('ダウンロードに失敗しました', 'error')
      }
    },
    [processResult]
  )

  const handleDownloadZip = useCallback(async () => {
    if (!processResult) return

    try {
      await downloadResultZip(processResult)
      showSnackbar('ZIPファイルをダウンロードしました', 'success')
    } catch (err) {
      showSnackbar('ダウンロードに失敗しました', 'error')
    }
  }, [processResult])

  // リセット（新規処理）
  const handleReset = useCallback(() => {
    setState('initial')
    setPdfSlots(createEmptySlots())
    setDetectionResult(null)
    setProcessResult(null)
    setProgress(0)
    setProgressMessage('')
    setErrorMessage(null)
    setExcelFile(null)
    setExcelUploaded(false)
  }, [])

  // スロットの色とアイコン
  const getSlotColor = (slot: PdfSlot): 'success' | 'warning' | 'default' => {
    if (slot.status === 'uploaded') return 'success'
    if (slot.status === 'error') return 'warning'
    return 'default'
  }

  // スロット表示名のサフィックス
  const getSlotStatusIcon = (slot: PdfSlot) => {
    if (slot.status === 'uploaded') {
      return <CheckCircleIcon fontSize="small" color="success" />
    }
    return <WarningIcon fontSize="small" color="warning" />
  }

  // 初期ドロップゾーンか、ファイル管理画面かを判定
  const showFileManagement =
    state === 'incomplete' ||
    state === 'detected' ||
    state === 'excel_required' ||
    state === 'ready'

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
            mb: state === 'initial' ? 1.5 : 3,
          }}
        >
          PDF処理実行
        </Typography>
        {state === 'initial' && (
          <Typography variant="body1" color="text.primary" sx={{ mb: 2.5 }}>
            見積書・請求書・注文請書・納品書の4つのPDFをアップロードしてください
          </Typography>
        )}

        {/* エラー表示 */}
        {errorMessage && state === 'error' && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleReset}>
                やり直す
              </Button>
            }
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {errorMessage}
            </Typography>
          </Alert>
        )}

        {/* 初期状態: PDFアップロードエリア */}
        {state === 'initial' && (
          <Card
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
              p: 3,
              position: 'relative',
              border: '2px solid',
              borderColor: isDragging ? 'primary.main' : 'transparent',
              transition: 'border-color 0.2s ease-in-out',
            }}
          >
            {/* ドラッグ時のオーバーレイ */}
            {isDragging && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  ここにドロップ
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                p: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.default',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => pdfInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                PDFファイルをドラッグ&ドロップ
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                または
              </Typography>
              <Button variant="contained">
                ファイルを選択
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                .pdf形式
              </Typography>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                hidden
                onChange={handlePdfSelect}
              />
            </Box>
          </Card>
        )}

        {/* 判別中 */}
        {state === 'detecting' && (
          <Card sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                PDFを解析中...
              </Typography>
              <LinearProgress sx={{ mt: 2, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                ファイルの種別を判別しています
              </Typography>
            </Box>
          </Card>
        )}

        {/* ファイル管理画面（スロット表示） */}
        {showFileManagement && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 取引先情報（判別できた場合） */}
            {detectionResult?.company && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  取引先:
                </Typography>
                <Typography variant="h6">
                  {detectionResult.company.display_name}
                </Typography>
              </Box>
            )}

            {/* PDFスロット管理（カード全体がドロップゾーン） */}
            <Card
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                p: 3,
                position: 'relative',
                border: '2px solid',
                borderColor: isDragging ? 'primary.main' : 'transparent',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {/* ドラッグ時のオーバーレイ */}
              {isDragging && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                    }}
                  >
                    ここにドロップ
                  </Typography>
                </Box>
              )}

              {/* ヘッダー */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h6">アップロードファイル</Typography>
                  <Tooltip title="ファイル名に「見積」「請求」「請書」「納品」が含まれていると自動判別されます">
                    <HelpOutlineIcon fontSize="small" color="action" />
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ドラッグ&ドロップで追加可能
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  まとめて選択
                </Button>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  hidden
                  onChange={handlePdfSelect}
                />
              </Box>

              {/* 不足ファイル警告 */}
              {detectionResult?.preCheck.missingTypes &&
                detectionResult.preCheck.missingTypes.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    不足しているPDF:{' '}
                    {detectionResult.preCheck.missingTypes.map(getPdfTypeLabel).join('、')}
                  </Alert>
                )}

              {/* スロット一覧 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {pdfSlots.map((slot) => (
                  <Paper
                    key={slot.type}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderColor: slot.status === 'uploaded' ? 'success.main' : 'warning.main',
                      borderWidth: 2,
                      backgroundColor:
                        slot.status === 'uploaded' ? 'success.50' : 'warning.50',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSlotStatusIcon(slot)}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {getPdfTypeLabel(slot.type)}
                        </Typography>
                      </Box>
                      <Chip
                        label={slot.status === 'uploaded' ? 'OK' : '未設定'}
                        size="small"
                        color={getSlotColor(slot)}
                      />
                    </Box>

                    {slot.status === 'uploaded' && slot.file ? (
                      <Box>
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
                            {slot.file.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFromSlot(slot.type)}
                            sx={{ color: 'error.main' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {(slot.file.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const input = slotInputRefs.current.get(slot.type)
                            input?.click()
                          }}
                          fullWidth
                        >
                          ファイルを選択
                        </Button>
                        <input
                          ref={(el) => {
                            slotInputRefs.current.set(slot.type, el)
                          }}
                          type="file"
                          accept=".pdf,application/pdf"
                          hidden
                          onChange={handleSlotFileSelect(slot.type)}
                        />
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>

            </Card>

            {/* Excelアップロードカード（初回のみ） */}
            {state === 'excel_required' && (
              <Card
                onDragEnter={handleExcelDragEnter}
                onDragLeave={handleExcelDragLeave}
                onDragOver={handleExcelDragOver}
                onDrop={handleExcelDrop}
                sx={{
                  p: 3,
                  position: 'relative',
                  border: '2px solid',
                  borderColor: isExcelDragging ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.2s ease-in-out',
                }}
              >
                {/* ドラッグ時のオーバーレイ */}
                {isExcelDragging && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      ここにドロップ
                    </Typography>
                  </Box>
                )}

                <Typography variant="h6" gutterBottom>
                  Excelテンプレートのアップロード
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  この取引先は初回処理のため、Excelテンプレートが必要です。
                  <br />
                  前月分のExcelファイルをドラッグ&ドロップ、またはファイル選択でアップロードしてください。
                </Typography>

                <Box
                  sx={{
                    p: 4,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: 'background.default',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => excelInputRef.current?.click()}
                >
                  <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Excelファイルをドラッグ&ドロップ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    または
                  </Typography>
                  <Button variant="contained">
                    ファイルを選択
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    .xlsx, .xls形式
                  </Typography>
                </Box>

                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleExcelSelect}
                />
              </Card>
            )}

            {/* Excelテンプレート表示（アップロード済み・ready状態） */}
            {state === 'ready' && excelUploaded && excelFile && (
              <Card
                onDragEnter={handleExcelDragEnter}
                onDragLeave={handleExcelDragLeave}
                onDragOver={handleExcelDragOver}
                onDrop={handleExcelDrop}
                sx={{
                  p: 3,
                  position: 'relative',
                  border: '2px solid',
                  borderColor: isExcelDragging ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.2s ease-in-out',
                }}
              >
                {/* ドラッグ時のオーバーレイ */}
                {isExcelDragging && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      ここにドロップ
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">Excelテンプレート</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ドラッグ&ドロップで差し替え可能
                    </Typography>
                  </Box>
                  <Chip label="OK" size="small" color="success" />
                </Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderColor: 'success.main',
                    borderWidth: 2,
                    backgroundColor: 'success.50',
                  }}
                >
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
                      {excelFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      {(excelFile.size / 1024).toFixed(1)} KB
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleRemoveExcel}
                      sx={{ color: 'error.main' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleExcelSelect}
                />
              </Card>
            )}

            {/* 処理実行ボタン */}
            {state === 'ready' && (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  すべてのファイルが揃いました。処理を実行できます。
                </Alert>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleExecute}
                  sx={{ px: 6 }}
                >
                  処理を実行
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* 処理中 */}
        {state === 'processing' && (
          <Card sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                処理中...
              </Typography>
              <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body1" color="text.secondary">
                {progressMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {progress}%
              </Typography>
            </Box>
          </Card>
        )}

        {/* 処理完了 */}
        {state === 'completed' && processResult && (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                処理が完了しました
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detectionResult?.company?.name} の処理が正常に完了しました
              </Typography>
            </Box>

            <Card sx={{ p: 3 }}>
              {/* 生成されたファイル */}
              <Typography variant="h6" gutterBottom>
                生成されたファイル
              </Typography>
            <List>
              <ListItem
                component="div"
                onClick={() => handleDownloadFile('excel')}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <DownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={processResult.excelFilename} secondary="Excelファイル" />
              </ListItem>
              <ListItem
                component="div"
                onClick={() => handleDownloadFile('order_pdf')}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <DownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={processResult.orderPdfFilename} secondary="注文書PDF" />
              </ListItem>
              <ListItem
                component="div"
                onClick={() => handleDownloadFile('inspection_pdf')}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  borderRadius: 1,
                }}
              >
                <ListItemIcon>
                  <DownloadIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={processResult.inspectionPdfFilename}
                  secondary="検収書PDF"
                />
              </ListItem>
            </List>

            {/* アクションボタン */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mt: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                startIcon={<FolderZipIcon />}
                onClick={handleDownloadZip}
                size="large"
              >
                一括ダウンロード（ZIP）
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                size="large"
              >
                新規処理を開始
              </Button>
            </Box>
            </Card>
          </Box>
        )}

        {/* アラートダイアログ（重要な警告用） */}
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
