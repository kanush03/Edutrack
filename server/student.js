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
router.get('/announcements', (req, res) => {
  const rows = db
    .prepare(
      `SELECT a.id, a.message, a.created_at, c.name AS class_name
       FROM announcements a
       JOIN classes c ON c.id = a.class_id
       JOIN enrollments e ON e.class_id = c.id
       WHERE e.student_id = ?
       ORDER BY a.created_at DESC, a.id DESC`
    )
    .all(req.user.id)
  res.json(rows)
})
function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function currentWeek() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
  const end = new Date(start)
  end.setDate(start.getDate() + 6) // Sunday
  return { start: localDate(start), end: localDate(end) }
}

router.get('/top5', (req, res) => {
  const week = currentWeek()
  const base = `
    SELECT u.id, u.name, ROUND(AVG(r.marks * 100.0 / t.max_marks), 1) AS average
    FROM results r
    JOIN tests t ON t.id = r.test_id
    JOIN users u ON u.id = r.student_id
    WHERE t.class_id IN (SELECT class_id FROM enrollments WHERE student_id = ?)`
  const tail = ` GROUP BY u.id ORDER BY average DESC, u.name LIMIT 5`

  const mark = (rows) =>
    rows.map((r) => ({ name: r.name, average: r.average, is_you: r.id === req.user.id }))

  const overall = db.prepare(base + tail).all(req.user.id)
  const weekly = db
    .prepare(base + ' AND t.test_date BETWEEN ? AND ?' + tail)
    .all(req.user.id, week.start, week.end)

  res.json({ week, weekly: mark(weekly), overall: mark(overall) })
})

router.get('/attendance', (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.name AS class_name,
              COUNT(a.id) AS total,
              COALESCE(SUM(a.present), 0) AS attended
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
       LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = e.student_id
       WHERE e.student_id = ?
       GROUP BY c.id`
    )
    .all(req.user.id)
  res.json(
    rows.map((r) => ({
      ...r,
      percentage: r.total ? Math.round((r.attended * 1000) / r.total) / 10 : null,
    }))
  )
})
export default router