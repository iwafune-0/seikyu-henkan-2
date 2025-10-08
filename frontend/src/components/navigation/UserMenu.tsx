import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export function UserMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">{user.email}</p>
          <p className="text-muted-foreground">
            {user.role === 'admin' ? '管理者' : '一般ユーザー'}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
      >
        <LogOut className="w-4 h-4" />
        ログアウト
      </button>
    </div>
  )
}
