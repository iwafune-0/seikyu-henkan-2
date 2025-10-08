/**
 * 認証機能の統合エクスポート
 */

// Contexts
export { AuthProvider, useAuthContext } from './contexts/AuthContext';

// Hooks
export { useAuth } from './hooks/useAuth';
export { usePermissions } from './hooks/usePermissions';

// Components
export { ProtectedRoute } from './components/ProtectedRoute';
export { PermissionGate } from './components/PermissionGate';

// Services (実API移行時に切り替え)
export * as authService from './services/mockAuthService';

// Utils
export * as storageUtils from './utils/storage.utils';
