import { Box, Typography, Paper } from '@mui/material';

/**
 * P-005: 取引先設定ページ（管理者専用）
 *
 * 取引先一覧表示、テンプレートExcel管理
 */
export function CompaniesPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        取引先設定
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          取引先設定ページ（Phase 4で実装予定）
        </Typography>
      </Paper>
    </Box>
  );
}
