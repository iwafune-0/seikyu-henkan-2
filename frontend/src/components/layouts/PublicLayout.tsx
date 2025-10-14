import type { ReactNode } from 'react'

interface PublicLayoutProps {
  children: ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="h-16 flex items-center px-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-primary">
            月次処理自動化システム
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 h-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2025 月次処理自動化システム
          </p>
        </div>
      </footer>
    </div>
  )
}
