/**
 * P-005: 取引先管理サービス
 *
 * バックエンドAPI (/api/companies) と通信
 * Phase 8でモックから実APIに切り替え
 */

import { apiGet, apiPut, apiPostFormData, apiDownloadBlob, triggerDownload } from '@/lib/api'
import {
  API_PATHS,
  type CompanyListResponse,
  type UpdateCompanyRequest,
  type UpdateCompanyResponse,
  type UploadTemplateResponse,
} from '@/types'

/**
 * 取引先一覧を取得
 * GET /api/companies
 */
export async function fetchCompanies(): Promise<CompanyListResponse> {
  return apiGet<CompanyListResponse>(API_PATHS.COMPANIES.LIST)
}

/**
 * 取引先情報を更新
 * PUT /api/companies/:id
 */
export async function updateCompany(
  id: string,
  data: UpdateCompanyRequest
): Promise<UpdateCompanyResponse> {
  return apiPut<UpdateCompanyResponse>(API_PATHS.COMPANIES.UPDATE(id), data)
}

/**
 * テンプレートファイルをアップロード
 * POST /api/companies/:id/template
 */
export async function uploadTemplate(
  id: string,
  file: File
): Promise<UploadTemplateResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return apiPostFormData<UploadTemplateResponse>(
    API_PATHS.COMPANIES.UPLOAD_TEMPLATE(id),
    formData
  )
}

/**
 * テンプレートファイルをダウンロード
 * GET /api/companies/:id/template
 */
export async function downloadTemplate(id: string): Promise<void> {
  const { blob, filename } = await apiDownloadBlob(API_PATHS.COMPANIES.DOWNLOAD_TEMPLATE(id))
  triggerDownload(blob, filename)
}
