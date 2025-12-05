import { Link, useLocation } from 'react-router-dom'
import { FileText, History, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
}

export function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { isBlocked, onNavigationAttempt } = useNavigationStore()

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    if (isBlocked && location.pathname !== to) {
      e.preventDefault()
      onNavigationAttempt?.(to)
    }
  }

  const navItems: NavItem[] = [
    {
      to: '/process',
      icon: <FileText className="w-5 h-5" />,
      label: 'PDF処理実行',
    },
    {
      to: '/history',
      icon: <History className="w-5 h-5" />,
      label: '処理履歴',
    },
    {
      to: '/users',
      icon: <Users className="w-5 h-5" />,
      label: 'ユーザー管理',
      adminOnly: true,
    },
    {
      to: '/companies',
      icon: <Building2 className="w-5 h-5" />,
      label: '取引先設定',
      adminOnly: true,
    },
  ]

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <nav className="p-4 space-y-2">
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={(e) => handleNavClick(e, item.to)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
