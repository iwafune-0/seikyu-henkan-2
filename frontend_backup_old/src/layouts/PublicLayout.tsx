import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

/**
 * 公開レイアウト
 *
 * ログイン、パスワードリセットなど、認証不要のページ用
 * シンプルなレイアウト（ヘッダーなし）
 */
export function PublicLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Outlet />
    </Box>
  );
}
