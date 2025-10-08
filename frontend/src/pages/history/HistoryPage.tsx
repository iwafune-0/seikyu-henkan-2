import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout'

export function HistoryPage() {
  return (
    <AuthenticatedLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">処理履歴・ダウンロード</h1>
        <p className="text-muted-foreground">
          P-003: 処理履歴・ダウンロードページ（Phase 4で実装予定）
        </p>
      </div>
    </AuthenticatedLayout>
  )
}
