import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'

export function ProcessPage() {
  return (
    <AuthenticatedLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">PDF処理実行</h1>
        <p className="text-muted-foreground">
          P-002: PDF処理実行ページ（Phase 4で実装予定）
        </p>
      </div>
    </AuthenticatedLayout>
  )
}
