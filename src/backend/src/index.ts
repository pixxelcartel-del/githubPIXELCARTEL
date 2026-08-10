import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

// ── Routes (expand as features are added) ────────────────────
// app.use('/api/v1/cards',   cardsRouter)
// app.use('/api/v1/users',   usersRouter)
// app.use('/api/v1/orders',  ordersRouter)

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 PixelCartel API running at http://localhost:${PORT}`)
})

export default app
