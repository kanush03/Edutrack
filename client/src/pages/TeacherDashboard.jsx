import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getSession, clearSession } from '../api'

const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500'
const button = 'rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white'

function Card({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-3 font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user } = getSession()
  const [classes, setClasses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [overview, setOverview] = useState(null)
  const [notice, setNotice] = useState({ type: '', text: '' })
  const [newClass, setNewClass] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [timing, setTiming] = useState({ day_of_week: 'Monday', start_time: '', end_time: '' })
  const [test, setTest] = useState({ title: '', test_date: '', max_marks: '' })
  const [announcement, setAnnouncement] = useState('')
  const [resultTestId, setResultTestId] = useState('')
  const [marks, setMarks] = useState({})

  useEffect(() => {
    api('/teacher/classes')
      .then((list) => {
        setClasses(list)
        if (list.length) setSelectedId(list[0].id)
      })
      .catch((err) => setNotice({ type: 'error', text: err.message }))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setOverview(null)
    setResultTestId('')
    setMarks({})
    api(`/teacher/classes/${selectedId}/overview`)
      .then(setOverview)
      .catch((err) => setNotice({ type: 'error', text: err.message }))
  }, [selectedId])

  const refresh = () => api(`/teacher/classes/${selectedId}/overview`).then(setOverview)

  async function action(fn, okText, reload = true) {
    setNotice({ type: '', text: '' })
    try {
      await fn()
      if (reload) await refresh()
      if (okText) setNotice({ type: 'ok', text: okText })
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  function createClass(e) {
    e.preventDefault()
    action(async () => {
      const c = await api('/teacher/classes', { method: 'POST', body: { name: newClass } })
      setNewClass('')
      setClasses(await api('/teacher/classes'))
      setSelectedId(c.id)
    }, 'Class created', false)
  }

  function addStudent(e) {
    e.preventDefault()
    action(async () => {
      await api(`/teacher/classes/${selectedId}/students`, { method: 'POST', body: { email: studentEmail } })
      setStudentEmail('')
    }, 'Student added')
  }

  function addTiming(e) {
    e.preventDefault()
    action(async () => {
      await api(`/teacher/classes/${selectedId}/schedule`, { method: 'POST', body: timing })
      setTiming({ ...timing, start_time: '', end_time: '' })
    }, 'Timing added')
  }

  function addTest(e) {
    e.preventDefault()
    action(async () => {
      await api(`/teacher/classes/${selectedId}/tests`, { method: 'POST', body: test })
      setTest({ title: '', test_date: '', max_marks: '' })
    }, 'Test scheduled')
  }

  function sendAnnouncement(e) {
    e.preventDefault()
    action(async () => {
      await api(`/teacher/classes/${selectedId}/announcements`, { method: 'POST', body: { message: announcement } })
      setAnnouncement('')
    }, 'Message sent to the class')
  }

  async function pickTest(id) {
    setResultTestId(id)
    setMarks({})
    if (!id) return
    try {
      const data = await api(`/teacher/tests/${id}/results`)
      const saved = {}
      data.results.forEach((r) => { saved[r.email] = String(r.marks) })
      setMarks(saved)
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    }
  }

  function saveResults(e) {
    e.preventDefault()
    const results = Object.entries(marks)
      .filter(([, v]) => v !== '')
      .map(([email, v]) => ({ email, marks: Number(v) }))
    action(async () => {
      await api(`/teacher/tests/${resultTestId}/results`, { method: 'POST', body: { results } })
    }, 'Results saved')
  }

  function logout() {
    clearSession()
    navigate('/login')
  }

  const pickedTest = overview && overview.tests.find((t) => String(t.id) === String(resultTestId))

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Teacher dashboard</h1>
            <p className="text-slate-600">Welcome, {user.name}.</p>
          </div>
          <button onClick={logout} className={button}>Log out</button>
        </div>

        {notice.text && (
          <p className={notice.type === 'error' ? 'text-red-600' : 'text-green-700'}>{notice.text}</p>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card title="My classes">
              <ul className="space-y-1">
                {classes.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                        c.id === selectedId ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
              {classes.length === 0 && <p className="text-sm text-slate-500">No classes yet.</p>}
              <form onSubmit={createClass} className="mt-4 space-y-2">
                <input className={input} placeholder="New class name" value={newClass} onChange={(e) => setNewClass(e.target.value)} />
                <button className={button}>Create class</button>
              </form>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-3">
            {!overview && <p className="text-slate-500">Create or select a class.</p>}
            {overview && (
              <>
                <h2 className="text-xl font-bold text-slate-800">{overview.class.name}</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card title="Students">
                    {overview.students.length === 0 && <p className="mb-3 text-sm text-slate-500">No students yet.</p>}
                    <ul className="mb-3 space-y-1 text-sm">
                      {overview.students.map((s) => (
                        <li key={s.id}>{s.name} <span className="text-slate-400">{s.email}</span></li>
                      ))}
                    </ul>
                    <form onSubmit={addStudent} className="flex gap-2">
                      <input className={input} type="email" placeholder="Student email (must be registered)" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
                      <button className={button}>Add</button>
                    </form>
                  </Card>

                  <Card title="Class timings">
                    {overview.schedule.length === 0 && <p className="mb-3 text-sm text-slate-500">No timings yet.</p>}
                    <ul className="mb-3 space-y-1 text-sm">
                      {overview.schedule.map((s) => (
                        <li key={s.id}>{s.day_of_week}, {s.start_time} to {s.end_time}</li>
                      ))}
                    </ul>
                    <form onSubmit={addTiming} className="space-y-2">
                      <select className={input} value={timing.day_of_week} onChange={(e) => setTiming({ ...timing, day_of_week: e.target.value })}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input className={input} type="time" value={timing.start_time} onChange={(e) => setTiming({ ...timing, start_time: e.target.value })} />
                        <input className={input} type="time" value={timing.end_time} onChange={(e) => setTiming({ ...timing, end_time: e.target.value })} />
                      </div>
                      <button className={button}>Add timing</button>
                    </form>
                  </Card>

                  <Card title="Tests">
                    {overview.tests.length === 0 && <p className="mb-3 text-sm text-slate-500">No tests yet.</p>}
                    <ul className="mb-3 space-y-1 text-sm">
                      {overview.tests.map((t) => (
                        <li key={t.id}>{t.title} <span className="text-slate-400">{t.test_date}, out of {t.max_marks}</span></li>
                      ))}
                    </ul>
                    <form onSubmit={addTest} className="space-y-2">
                      <input className={input} placeholder="Test title" value={test.title} onChange={(e) => setTest({ ...test, title: e.target.value })} />
                      <div className="flex gap-2">
                        <input className={input} type="date" value={test.test_date} onChange={(e) => setTest({ ...test, test_date: e.target.value })} />
                        <input className={input} type="number" min="1" placeholder="Max marks" value={test.max_marks} onChange={(e) => setTest({ ...test, max_marks: e.target.value })} />
                      </div>
                      <button className={button}>Schedule test</button>
                    </form>
                  </Card>

                  <Card title="Broadcast to the class">
                    <form onSubmit={sendAnnouncement} className="space-y-2">
                      <textarea className={input} rows="3" maxLength="500" placeholder="Message for all students" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
                      <button className={button}>Send</button>
                    </form>
                    <ul className="mt-3 space-y-2 text-sm">
                      {overview.announcements.map((a) => (
                        <li key={a.id} className="rounded-lg bg-slate-50 p-2">
                          {a.message} <span className="block text-xs text-slate-400">{a.created_at}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <Card title="Enter test results">
                  <select className={input} value={resultTestId} onChange={(e) => pickTest(e.target.value)}>
                    <option value="">Choose a test</option>
                    {overview.tests.map((t) => (
                      <option key={t.id} value={t.id}>{t.title} (out of {t.max_marks})</option>
                    ))}
                  </select>
                  {pickedTest && (
                    <form onSubmit={saveResults} className="mt-3 space-y-2">
                      {overview.students.length === 0 && <p className="text-sm text-slate-500">Add students first.</p>}
                      {overview.students.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 text-sm">
                          <span className="w-1/2">{s.name}</span>
                          <input
                            className={input}
                            type="number"
                            min="0"
                            max={pickedTest.max_marks}
                            step="0.5"
                            placeholder={`out of ${pickedTest.max_marks}`}
                            value={marks[s.email] ?? ''}
                            onChange={(e) => setMarks({ ...marks, [s.email]: e.target.value })}
                          />
                        </div>
                      ))}
                      <button className={button}>Save results</button>
                    </form>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}