import express, { Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { checkDatabaseConnection } from './lib/supabase'

// 環境変数の読み込み
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

// ========================================
// ミドルウェア設定
// ========================================

// CORS設定（フロントエンド: localhost:5174, 127.0.0.1:5174 からのリクエストを許可）
app.use(
  cors({
    origin: [
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    credentials: true,
  })
)

// JSONパーサー（リクエストボディの解析）
app.use(express.json({ limit: '50mb' })) // PDF処理のため大きめに設定

// URLエンコードされたデータのパーサー
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ========================================
// ヘルスチェックエンドポイント
// ========================================

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'サーバーは正常に動作しています',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ========================================
// APIルート（Phase 7以降で追加）
// ========================================

// ユーザー管理ルート（スライス3-A）
import usersRoutes from './routes/users'
app.use('/api/users', usersRoutes)

// 取引先管理ルート（スライス3-B）
import companiesRoutes from './routes/companies'
app.use('/api/companies', companiesRoutes)

// 処理履歴ルート（スライス4）
import historyRoutes from './routes/history'
app.use('/api/history', historyRoutes)

// PDF処理ルート（スライス5: 検出）
import processRoutes from './routes/process'
app.use('/api/process', processRoutes)

// TODO: 認証ルート
// app.use('/api/auth', authRoutes)

// ========================================
// エラーハンドラ（最後に配置）
// ========================================

// 404エラーハンドラ
app.use(notFoundHandler)

// グローバルエラーハンドラ
app.use(errorHandler)

// ========================================
// サーバー起動
// ========================================

async function startServer(): Promise<void> {
  try {
    // データベース接続チェック
    const isDbConnected = await checkDatabaseConnection()

    if (!isDbConnected) {
      console.warn('⚠️  データベース接続に失敗しましたが、サーバーを起動します')
    }

    // サーバー起動
    app.listen(PORT, () => {
      console.log(`
========================================
🚀 サーバーが起動しました
========================================
ポート: ${PORT}
環境: ${process.env.NODE_ENV || 'development'}
フロントエンドURL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}
========================================
      `)
    })
  } catch (error) {
    console.error('サーバー起動中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// サーバー起動
startServer()

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERMシグナルを受信しました。サーバーを終了します...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINTシグナルを受信しました。サーバーを終了します...')
  process.exit(0)
})
