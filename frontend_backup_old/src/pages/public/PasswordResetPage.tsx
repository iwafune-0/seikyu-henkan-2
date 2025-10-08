import { Box, Typography, Paper } from '@mui/material';

/**
 * P-001c: パスワードリセットページ
 *
 * パスワードリセットリンクからアクセスし、新しいパスワードを設定
 */
export function PasswordResetPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper sx={{ maxWidth: 480, width: '100%', p: 4 }}>
        <Typography variant="h5" gutterBottom>
          パスワードリセット
        </Typography>
        <Typography variant="body1" color="text.secondary">
          パスワードリセットページ（Phase 4で実装予定）
        </Typography>
      </Paper>
    </Box>
  );
}
