import { Router } from 'express'
import db from './db.js'
import { requireAuth, requireRole } from './auth.js'

const router = Router()
router.use(requireAuth, requireRole('student'))

router.get('/classes', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, u.name AS teacher
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
       JOIN users u ON u.id = c.teacher_id
       WHERE e.student_id = ?`
    )
    .all(req.user.id)
  res.json(rows)
})

router.get('/schedule', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.name AS class_name, s.day_of_week, s.start_time, s.end_time
       FROM schedule s
       JOIN classes c ON c.id = s.class_id
       JOIN enrollments e ON e.class_id = c.id
       WHERE e.student_id = ?`
    )
    .all(req.user.id)
  res.json(rows)
})

router.get('/tests', (req, res) => {
  const rows = db
    .prepare(
      `SELECT t.id, t.title, t.test_date, t.max_marks, c.name AS class_name
       FROM tests t
       JOIN classes c ON c.id = t.class_id
       JOIN enrollments e ON e.class_id = c.id
       WHERE e.student_id = ?
       ORDER BY t.test_date`
    )
    .all(req.user.id)
  res.json(rows)
})

router.get('/results', (req, res) => {
  const rows = db
    .prepare(
      `SELECT t.title, c.name AS class_name, t.test_date, r.marks, t.max_marks,
              ROUND(r.marks * 100.0 / t.max_marks, 1) AS percentage
       FROM results r
       JOIN tests t ON t.id = r.test_id
       JOIN classes c ON c.id = t.class_id
       WHERE r.student_id = ?
       ORDER BY t.test_date`
    )
    .all(req.user.id)
  res.json(rows)
})

router.get('/stats', (req, res) => {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS tests_taken,
              ROUND(AVG(r.marks * 100.0 / t.max_marks), 1) AS average_percentage,
              ROUND(MAX(r.marks * 100.0 / t.max_marks), 1) AS best_percentage
       FROM results r
       JOIN tests t ON t.id = r.test_id
       WHERE r.student_id = ?`
    )
    .get(req.user.id)
  res.json(row)
})

export default router