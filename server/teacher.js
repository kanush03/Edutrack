import { Router } from 'express'
import db from './db.js'
import { requireAuth, requireRole } from './auth.js'

const router = Router()
router.use(requireAuth, requireRole('teacher'))

function ownedClass(classId, teacherId) {
  return db
    .prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?')
    .get(Number(classId), teacherId)
}

router.post('/classes', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Class name is required' })
  const result = db
    .prepare('INSERT INTO classes (name, teacher_id) VALUES (?, ?)')
    .run(name, req.user.id)
  res.status(201).json({ id: Number(result.lastInsertRowid), name })
})

router.get('/classes', (req, res) => {
  const rows = db.prepare('SELECT * FROM classes WHERE teacher_id = ?').all(req.user.id)
  res.json(rows)
})

router.post('/classes/:classId/students', (req, res) => {
  const cls = ownedClass(req.params.classId, req.user.id)
  if (!cls) return res.status(404).json({ error: 'Class not found' })
  const student = db
    .prepare("SELECT id, name FROM users WHERE email = ? AND role = 'student'")
    .get(req.body.email)
  if (!student) return res.status(404).json({ error: 'No student with that email' })
  try {
    db.prepare('INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)').run(cls.id, student.id)
  } catch {
    return res.status(409).json({ error: 'Student already in this class' })
  }
  res.status(201).json({ classId: cls.id, student })
})

router.post('/classes/:classId/schedule', (req, res) => {
  const cls = ownedClass(req.params.classId, req.user.id)
  if (!cls) return res.status(404).json({ error: 'Class not found' })
  const { day_of_week, start_time, end_time } = req.body
  if (!day_of_week || !start_time || !end_time) {
    return res.status(400).json({ error: 'day_of_week, start_time and end_time are required' })
  }
  const result = db
    .prepare('INSERT INTO schedule (class_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)')
    .run(cls.id, day_of_week, start_time, end_time)
  res.status(201).json({ id: Number(result.lastInsertRowid), day_of_week, start_time, end_time })
})

router.post('/classes/:classId/tests', (req, res) => {
  const cls = ownedClass(req.params.classId, req.user.id)
  if (!cls) return res.status(404).json({ error: 'Class not found' })
  const { title, test_date, max_marks } = req.body
  if (!title || !test_date || !(Number(max_marks) > 0)) {
    return res.status(400).json({ error: 'title, test_date and a positive max_marks are required' })
  }
  const result = db
    .prepare('INSERT INTO tests (class_id, title, test_date, max_marks) VALUES (?, ?, ?, ?)')
    .run(cls.id, title, test_date, Number(max_marks))
  res.status(201).json({ id: Number(result.lastInsertRowid), title, test_date, max_marks: Number(max_marks) })
})
function ownedTest(testId, teacherId) {
  return db
    .prepare(
      `SELECT t.* FROM tests t
       JOIN classes c ON c.id = t.class_id
       WHERE t.id = ? AND c.teacher_id = ?`
    )
    .get(Number(testId), teacherId)
}

router.post('/tests/:testId/results', (req, res) => {
  const test = ownedTest(req.params.testId, req.user.id)
  if (!test) return res.status(404).json({ error: 'Test not found' })

  const { results } = req.body
  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'results must be a non-empty array' })
  }

  const findStudent = db.prepare(
    `SELECT u.id FROM users u
     JOIN enrollments e ON e.student_id = u.id
     WHERE u.email = ? AND e.class_id = ?`
  )
  const save = db.prepare(
    `INSERT INTO results (test_id, student_id, marks) VALUES (?, ?, ?)
     ON CONFLICT(test_id, student_id) DO UPDATE SET marks = excluded.marks`
  )

  const saved = []
  const errors = []
  for (const r of results) {
    const marks = Number(r.marks)
    const student = findStudent.get(r.email, test.class_id)
    if (!student) {
      errors.push({ email: r.email, error: 'Student is not in this class' })
      continue
    }
    if (!(marks >= 0 && marks <= test.max_marks)) {
      errors.push({ email: r.email, error: `Marks must be between 0 and ${test.max_marks}` })
      continue
    }
    save.run(test.id, student.id, marks)
    saved.push({ email: r.email, marks })
  }
  res.status(errors.length && !saved.length ? 400 : 201).json({ saved, errors })
})

router.get('/tests/:testId/results', (req, res) => {
  const test = ownedTest(req.params.testId, req.user.id)
  if (!test) return res.status(404).json({ error: 'Test not found' })
  const rows = db
    .prepare(
      `SELECT u.name, u.email, r.marks FROM results r
       JOIN users u ON u.id = r.student_id
       WHERE r.test_id = ?`
    )
    .all(test.id)
  res.json({ test: test.title, max_marks: test.max_marks, results: rows })
})
export default router