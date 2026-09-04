import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import routes from './routes/index.route.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientUrl }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/v1', routes)

export default app