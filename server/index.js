import express from 'express'
import cors from 'cors'
import db from './db.js'
import authRouter from './auth.js'
import teacherRouter from './teacher.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/teacher', teacherRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'EduTrack' })
})

app.get('/api/db-check', (req, res) => {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
  res.json(tables.map((t) => t.name))
})

const PORT = 4000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})