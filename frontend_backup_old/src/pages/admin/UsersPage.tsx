import { Box, Typography, Paper } from '@mui/material';

/**
 * P-004: ユーザー管理ページ（管理者専用）
 *
 * ユーザー一覧表示、招待、削除、権限変更
 */
export function UsersPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ユーザー管理
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          ユーザー管理ページ（Phase 4で実装予定）
        </Typography>
      </Paper>
    </Box>
  );
}
