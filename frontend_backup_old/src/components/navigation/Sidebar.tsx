import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
} from '@mui/material';
import {
  Description,
  History,
  People,
  Business,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/features/auth';

const DRAWER_WIDTH = 240;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * サイドバーナビゲーション
 *
 * ユーザーの権限に応じたメニューを表示
 */
export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = usePermissions();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const menuItems = [
    {
      text: 'PDF処理実行',
      icon: <Description />,
      path: '/process',
      roles: ['user', 'admin'],
    },
    {
      text: '処理履歴',
      icon: <History />,
      path: '/history',
      roles: ['user', 'admin'],
    },
    {
      text: 'ユーザー管理',
      icon: <People />,
      path: '/users',
      roles: ['admin'],
    },
    {
      text: '取引先設定',
      icon: <Business />,
      path: '/companies',
      roles: ['admin'],
    },
  ];

  const drawerContent = (
    <>
      <Toolbar />
      <List>
        {menuItems.map((item) => {
          // 管理者専用メニューの表示制御
          if (item.roles.includes('admin') && !isAdmin()) {
            return null;
          }

          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
    </>
  );

  return (
    <>
      {/* デスクトップ版 */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* モバイル版 */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // モバイルパフォーマンス向上
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
