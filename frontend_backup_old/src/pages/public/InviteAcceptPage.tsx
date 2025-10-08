import { Box, Typography, Paper } from '@mui/material';

/**
 * P-001b: 招待受諾・パスワード設定ページ
 *
 * 招待リンクからアクセスし、初回パスワードを設定
 */
export function InviteAcceptPage() {
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
          招待受諾・パスワード設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          招待受諾ページ（Phase 4で実装予定）
        </Typography>
      </Paper>
    </Box>
  );
}
