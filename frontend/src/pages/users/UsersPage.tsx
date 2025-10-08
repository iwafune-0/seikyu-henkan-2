import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'

export function UsersPage() {
  return (
    <AuthenticatedLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">ユーザー管理</h1>
        <p className="text-muted-foreground">
          P-004: ユーザー管理ページ（Phase 4で実装予定）
        </p>
      </div>
    </AuthenticatedLayout>
  )
}
