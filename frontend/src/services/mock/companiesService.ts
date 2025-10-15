import type {
  Company,
  CompanyListResponse,
  UpdateCompanyRequest,
  UpdateCompanyResponse,
  UploadTemplateResponse,
} from '@/types'

/**
 * モック取引先データ
 * Phase 7でSupabase APIに置き換え
 */
let mockCompanies: Company[] = [
  {
    id: '1',
    name: 'ネクストビッツ',
    display_name: '株式会社ネクストビッツ 御中',
    is_active: true,
    last_processed_at: '2025-10-10',
    template_excel: 'nextbits_template.xlsx',
    template_filename: 'nextbits_template.xlsx',
    template_updated_at: '2025-09-15T14:30:00Z',
    template_updated_by: 'admin@example.com',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'オフビートワークス',
    display_name: '株式会社オフビートワークス 御中',
    is_active: true,
    last_processed_at: '2025-10-08',
    template_excel: 'offbeat_template.xlsx',
    template_filename: 'offbeat_template.xlsx',
    template_updated_at: '2025-09-20T10:15:00Z',
    template_updated_by: 'admin2@example.com',
    created_at: '2025-01-01T00:00:00Z',
  },
]

/**
 * 取引先一覧を取得
 */
export async function fetchCompanies(): Promise<CompanyListResponse> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    companies: mockCompanies,
    total: mockCompanies.length,
  }
}

/**
 * 取引先情報を更新
 */
export async function updateCompany(
  id: string,
  data: UpdateCompanyRequest
): Promise<UpdateCompanyResponse> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 300))

  const company = mockCompanies.find((c) => c.id === id)
  if (!company) {
    throw new Error('取引先が見つかりません')
  }

  // 更新
  if (data.name !== undefined) company.name = data.name
  if (data.display_name !== undefined) company.display_name = data.display_name
  if (data.is_active !== undefined) company.is_active = data.is_active

  return {
    success: true,
    company,
  }
}

/**
 * テンプレートファイルをアップロード
 */
export async function uploadTemplate(
  id: string,
  file: File
): Promise<UploadTemplateResponse> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 500))

  const company = mockCompanies.find((c) => c.id === id)
  if (!company) {
    throw new Error('取引先が見つかりません')
  }

  // ファイル名の検証
  if (!file.name.endsWith('.xlsx')) {
    throw new Error('Excelファイル（.xlsx）のみアップロード可能です')
  }

  // 更新
  const now = new Date().toISOString()
  company.template_filename = file.name
  company.template_updated_at = now
  company.template_updated_by = 'admin@example.com' // モックユーザー

  return {
    success: true,
    filename: file.name,
    updated_at: now,
  }
}

/**
 * テンプレートファイルをダウンロード
 */
export async function downloadTemplate(id: string): Promise<void> {
  // モック遅延
  await new Promise((resolve) => setTimeout(resolve, 300))

  const company = mockCompanies.find((c) => c.id === id)
  if (!company || !company.template_filename) {
    throw new Error('テンプレートファイルが見つかりません')
  }

  // モック: ブラウザのダウンロードをトリガー
  console.log(`[Mock] Downloading template: ${company.template_filename}`)
  alert(`テンプレートをダウンロードします:\n${company.template_filename}`)
}
