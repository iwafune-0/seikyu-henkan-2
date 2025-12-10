import { Request, Response } from 'express'
import {
  getAllCompanies,
  getCompanyById,
  updateCompany,
  uploadTemplate,
  getTemplate,
} from '../services/companiesService'
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendInternalError,
} from '../utils/response'
import { CompanyListResponse, UpdateCompanyResponse, UploadTemplateResponse } from '../types/index'

/**
 * 取引先一覧取得コントローラー
 *
 * GET /api/companies
 * 権限: 管理者専用
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function getCompaniesController(_req: Request, res: Response): Promise<void> {
  try {
    const companies = await getAllCompanies()

    const response: CompanyListResponse = {
      companies,
      total: companies.length,
    }

    sendSuccess(res, response)
  } catch (error) {
    sendInternalError(res, error, '取引先一覧の取得に失敗しました')
  }
}

/**
 * 取引先詳細取得コントローラー
 *
 * GET /api/companies/:id
 * 権限: 管理者専用
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function getCompanyByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      sendBadRequest(res, '取引先IDが指定されていません')
      return
    }

    const company = await getCompanyById(id)

    if (!company) {
      sendNotFound(res, '取引先が見つかりません')
      return
    }

    sendSuccess(res, company)
  } catch (error) {
    sendInternalError(res, error, '取引先情報の取得に失敗しました')
  }
}

/**
 * 取引先情報更新コントローラー
 *
 * PUT /api/companies/:id
 * 権限: 管理者専用
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function updateCompanyController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { name, display_name, is_active } = req.body

    // バリデーション
    if (!id) {
      sendBadRequest(res, '取引先IDが指定されていません')
      return
    }

    // 更新内容が空でないかチェック
    if (name === undefined && display_name === undefined && is_active === undefined) {
      sendBadRequest(res, '更新する項目が指定されていません')
      return
    }

    // name, display_nameが空文字でないかチェック
    if (name !== undefined && name.trim() === '') {
      sendBadRequest(res, '取引先名を入力してください')
      return
    }

    if (display_name !== undefined && display_name.trim() === '') {
      sendBadRequest(res, '表示名を入力してください')
      return
    }

    // 取引先が存在するか確認
    const existingCompany = await getCompanyById(id)

    if (!existingCompany) {
      sendNotFound(res, '取引先が見つかりません')
      return
    }

    // 更新実行
    const updatedCompany = await updateCompany(id, {
      name,
      display_name,
      is_active,
    })

    const response: UpdateCompanyResponse = {
      success: true,
      company: updatedCompany,
    }

    sendSuccess(res, response, '取引先情報を更新しました')
  } catch (error) {
    sendInternalError(res, error, '取引先情報の更新に失敗しました')
  }
}

/**
 * Excelテンプレートアップロードコントローラー
 *
 * POST /api/companies/:id/template
 * 権限: 管理者専用
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function uploadTemplateController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const file = req.file

    // バリデーション
    if (!id) {
      sendBadRequest(res, '取引先IDが指定されていません')
      return
    }

    if (!file) {
      sendBadRequest(res, 'ファイルがアップロードされていません')
      return
    }

    // ファイル形式チェック（.xlsxのみ）
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      sendBadRequest(res, 'Excelファイル（.xlsx）のみアップロード可能です')
      return
    }

    // 取引先が存在するか確認
    const existingCompany = await getCompanyById(id)

    if (!existingCompany) {
      sendNotFound(res, '取引先が見つかりません')
      return
    }

    // ユーザーIDを取得（認証済みユーザー）
    const userId = req.user?.id

    if (!userId) {
      sendBadRequest(res, 'ユーザー情報が取得できません')
      return
    }

    // multerはファイル名をLatin-1としてデコードするため、UTF-8に再変換
    const filename = Buffer.from(file.originalname, 'latin1').toString('utf8')

    // アップロード実行
    const updatedCompany = await uploadTemplate(id, file.buffer, filename, userId)

    const response: UploadTemplateResponse = {
      success: true,
      filename: updatedCompany.template_filename || '',
      updated_at: updatedCompany.template_updated_at || '',
    }

    sendSuccess(res, response, 'テンプレートをアップロードしました')
  } catch (error) {
    sendInternalError(res, error, 'テンプレートのアップロードに失敗しました')
  }
}

/**
 * Excelテンプレートダウンロードコントローラー
 *
 * GET /api/companies/:id/template
 * 権限: 管理者専用
 *
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 */
export async function downloadTemplateController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      sendBadRequest(res, '取引先IDが指定されていません')
      return
    }

    // 取引先が存在するか確認
    const existingCompany = await getCompanyById(id)

    if (!existingCompany) {
      sendNotFound(res, '取引先が見つかりません')
      return
    }

    // テンプレート取得
    const template = await getTemplate(id)

    if (!template) {
      sendNotFound(res, 'テンプレートが見つかりません')
      return
    }

    // バイナリデータとして返却
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(template.filename)}"`)
    res.send(template.buffer)
  } catch (error) {
    sendInternalError(res, error, 'テンプレートのダウンロードに失敗しました')
  }
}
