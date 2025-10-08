import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'

export function CompaniesPage() {
  return (
    <AuthenticatedLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">取引先設定</h1>
        <p className="text-muted-foreground">
          P-005: 取引先設定ページ（Phase 4で実装予定）
        </p>
      </div>
    </AuthenticatedLayout>
  )
}
