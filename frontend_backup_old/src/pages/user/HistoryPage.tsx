import { Box, Typography, Paper } from '@mui/material';

/**
 * P-003: 処理履歴・ダウンロードページ
 *
 * 過去の処理結果を一覧表示し、ファイルを再ダウンロード
 */
export function HistoryPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        処理履歴
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          処理履歴ページ（Phase 4で実装予定）
        </Typography>
      </Paper>
    </Box>
  );
}
