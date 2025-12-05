import { useState, type ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { useAuthStore } from '@/stores/auth'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - デスクトップ（1024px以上） */}
      <header className="hidden lg:block border-b border-border">
        <div className="h-16 flex items-center justify-between px-6">
          <h1 className="text-3xl font-semibold text-primary">月次処理自動化システム</h1>
          <div className="flex items-center gap-4">
            <div className="text-base">
              <p className="font-medium">{user?.email}</p>
              <p className="text-muted-foreground">
                {user?.role === 'admin' ? '管理者' : '一般ユーザー'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-base font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Header - モバイル・タブレット（1024px未満） - 2行レイアウト */}
      <header className="lg:hidden border-b border-border">
        {/* 1行目：メニュー + タイトル + ログアウト */}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button>
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
    </div>
  )
}
