import { useState, useRef, useEffect, type ReactNode } from 'react'
import { LogOut, Key, ChevronDown, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { useAuthStore } from '@/stores/auth'
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideDesktop = desktopMenuRef.current && !desktopMenuRef.current.contains(target)
      const isOutsideMobile = mobileMenuRef.current && !mobileMenuRef.current.contains(target)

      if (isOutsideDesktop && isOutsideMobile) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const handleOpenChangePassword = () => {
    setUserMenuOpen(false)
    setChangePasswordOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - デスクトップ（1024px以上） */}
      <header className="hidden lg:block border-b border-border">
        <div className="h-16 flex items-center justify-between px-6">
          <h1 className="text-3xl font-semibold text-primary">月次処理自動化システム</h1>
          {/* ユーザードロップダウン */}
          <div className="relative" ref={desktopMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 text-base hover:bg-accent rounded-md transition-colors cursor-pointer"
            >
              <div className="text-right">
                <p className="font-medium">{user?.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.role === 'admin' ? '管理者' : '一般ユーザー'}
                </p>
              </div>
              <div className="flex items-center">
                <User className="w-5 h-5 text-muted-foreground" />
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {/* ドロップダウンメニュー */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-[100]">
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  パスワード変更
                </button>
                <div className="border-t border-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Header - モバイル・タブレット（1024px未満） - 2行レイアウト */}
      <header className="lg:hidden border-b border-border">
        {/* 1行目：メニュー + タイトル + ユーザーメニュー */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* ハンバーガーメニューボタン */}
            <button
              className="p-2 hover:bg-accent rounded-md flex-shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="メニュー"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold text-primary truncate">月次処理自動化システム</h1>
          </div>
          {/* モバイル用ユーザーメニュー */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex-shrink-0 cursor-pointer"
            >
              <span className="max-w-[100px] truncate">{user?.email?.split('@')[0]}</span>
              <div className="flex items-center">
                <User className="w-4 h-4 text-muted-foreground" />
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {/* モバイル用ドロップダウンメニュー */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-[100]">
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  パスワード変更
                </button>
                <div className="border-t border-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2行目：ユーザー情報（中央配置） */}
        <div className="px-3 py-2 bg-muted/30 text-center text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground truncate inline-block max-w-[200px]">{user?.email}</span>
          <span className="mx-2">|</span>
          <span>{user?.role === 'admin' ? '管理者' : '一般ユーザー'}</span>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex relative">
        {/* Sidebar - デスクトップ（1024px以上）は常に表示 */}
        <aside className="hidden lg:block w-64 border-r border-border min-h-[calc(100vh-4rem)] bg-card">
          <Sidebar />
        </aside>

        {/* Sidebar - モバイル・タブレット用（オーバーレイ） */}
        {sidebarOpen && (
          <>
            {/* 背景オーバーレイ */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* サイドバー */}
            <aside className="fixed left-0 top-[104px] bottom-0 w-64 bg-card border-r border-border z-50 lg:hidden overflow-y-auto">
              <Sidebar />
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>

      {/* パスワード変更ダイアログ */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  )
}
