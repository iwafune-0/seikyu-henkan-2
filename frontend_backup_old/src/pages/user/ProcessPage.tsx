import { Box, Typography, Paper } from '@mui/material';

/**
 * P-002: PDF処理実行ページ
 *
 * 4つのPDFをアップロードし、Excel編集とPDF生成を実行
 */
export function ProcessPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        PDF処理実行
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          PDF処理実行ページ（Phase 4で実装予定）
        </Typography>
      </Paper>
    </Box>
  );
}
