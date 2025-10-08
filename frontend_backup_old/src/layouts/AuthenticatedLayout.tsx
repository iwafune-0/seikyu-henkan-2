import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { Sidebar } from '@/components/navigation/Sidebar';

const DRAWER_WIDTH = 240;

/**
 * 認証済みユーザー用レイアウト
 *
 * ヘッダー + サイドバー + コンテンツエリア
 * ユーザーと管理者の両方で使用（メニュー項目は権限で制御）
 */
export function AuthenticatedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={handleDrawerToggle} showMenuButton />

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* ヘッダーの高さ分のスペース */}
        <Outlet />
      </Box>
    </Box>
  );
}
