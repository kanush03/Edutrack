import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from './db.js'

const router = Router()

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !['student', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'name, email, password and a valid role are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }
  const hash = bcrypt.hashSync(password, 10)
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, role)
  const user = { id: Number(result.lastInsertRowid), name, role }
  res.status(201).json({ token: makeToken(user), user })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!row || !bcrypt.compareSync(password || '', row.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password' })
  }
  const user = { id: row.id, name: row.name, role: row.role }
  res.json({ token: makeToken(user), user })
})

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Not allowed' })
    next()
  }
}

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router