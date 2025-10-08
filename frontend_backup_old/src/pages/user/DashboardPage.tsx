import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import { Description, History, CheckCircle } from '@mui/icons-material';
import { useAuth } from '@/features/auth';

/**
 * ダッシュボードページ
 *
 * ログイン後の最初のページ（統計情報や最近の処理履歴を表示）
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ダッシュボード
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        ようこそ、{user?.email} さん
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">処理実行</Typography>
              </Box>
              <Typography variant="h3" gutterBottom>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の処理件数
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">成功率</Typography>
              </Box>
              <Typography variant="h3" gutterBottom>
                100%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の成功率
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">平均処理時間</Typography>
              </Box>
              <Typography variant="h3" gutterBottom>
                0s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の平均
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          最近の処理履歴
        </Typography>
        <Typography variant="body1" color="text.secondary">
          処理履歴はまだありません
        </Typography>
      </Paper>
    </Box>
  );
}
