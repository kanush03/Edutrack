import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, getSession, clearSession } from '../api'

function Card({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-3 font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

function TopList({ rows }) {
  if (rows.length === 0) return <p className="text-sm text-slate-500">No results yet.</p>
  return (
    <ol className="space-y-2 text-sm">
      {rows.map((r, i) => (
        <li
          key={r.name + i}
          className={`flex justify-between rounded-lg p-2 ${r.is_you ? 'bg-slate-800 text-white' : 'bg-slate-50'}`}
        >
          <span>{i + 1}. {r.name}{r.is_you ? ' (you)' : ''}</span>
          <span className="font-medium">{r.average}%</span>
        </li>
      ))}
    </ol>
  )
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = getSession()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api('/student/classes'),
      api('/student/schedule'),
      api('/student/tests'),
      api('/student/results'),
      api('/student/stats'),
      api('/student/announcements'),
      api('/student/top5'),
      api('/student/attendance'),
    ])
      .then(([classes, schedule, tests, results, stats, announcements, top5, attendance]) =>
        setData({ classes, schedule, tests, results, stats, announcements, top5, attendance })
      )
      .catch((err) => setError(err.message))
  }, [])

  function logout() {
    clearSession()
    navigate('/login')
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student dashboard</h1>
            <p className="text-slate-600">Welcome, {user.name}.</p>
          </div>
          <button onClick={logout} className="rounded-lg bg-slate-800 px-4 py-2 text-white">
            Log out
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}
        {!data && !error && <p className="text-slate-500">Loading...</p>}

        {data && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Tests taken" value={data.stats.tests_taken} />
                <Stat label="Average" value={data.stats.average_percentage == null ? '-' : `${data.stats.average_percentage}%`} />
                <Stat label="Best score" value={data.stats.best_percentage == null ? '-' : `${data.stats.best_percentage}%`} />
              </div>

              <Card title="My performance">
                {data.results.length === 0 ? (
                  <p className="text-sm text-slate-500">No results yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.results}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="title" />
                        <YAxis domain={[0, 100]} unit="%" />
                        <Tooltip />
                        <Line type="monotone" dataKey="percentage" stroke="#1e293b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card title="My results">
                {data.results.length === 0 ? (
                  <p className="text-sm text-slate-500">No results yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.results.map((r) => (
                      <li key={r.title + r.test_date} className="flex justify-between py-2 text-sm">
                        <span>{r.title} <span className="text-slate-400">({r.class_name})</span></span>
                        <span className="font-medium">{r.marks}/{r.max_marks} ({r.percentage}%)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <div className="grid gap-6 sm:grid-cols-2">
                <Card title="My classes and timings">
                  {data.classes.length === 0 && <p className="text-sm text-slate-500">Not in any class yet.</p>}
                  <ul className="space-y-2 text-sm">
                    {data.classes.map((c) => (
                      <li key={c.id}>
                        <p className="font-medium">{c.name} <span className="text-slate-400">with {c.teacher}</span></p>
                        {data.schedule
                          .filter((s) => s.class_name === c.name)
                          .map((s, i) => (
                            <p key={i} className="text-slate-500">{s.day_of_week}, {s.start_time} to {s.end_time}</p>
                          ))}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card title="Tests">
                  {data.tests.length === 0 && <p className="text-sm text-slate-500">No tests scheduled.</p>}
                  <ul className="space-y-2 text-sm">
                    {data.tests.map((t) => (
                      <li key={t.id} className="flex justify-between">
                        <span>{t.title} <span className="text-slate-400">({t.class_name})</span></span>
                        <span className={t.test_date >= today ? 'font-medium text-slate-800' : 'text-slate-400'}>
                          {t.test_date}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <Card title="Attendance">
                {data.attendance.length === 0 && <p className="text-sm text-slate-500">Not in any class yet.</p>}
                <ul className="space-y-2 text-sm">
                  {data.attendance.map((a) => (
                    <li key={a.class_name} className="flex justify-between">
                      <span>{a.class_name}</span>
                      <span className="font-medium">
                        {a.percentage == null ? 'Not marked yet' : `${a.percentage}% (${a.attended}/${a.total})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Top 5 this week">
                <TopList rows={data.top5.weekly} />
              </Card>
              <Card title="Top 5 overall">
                <TopList rows={data.top5.overall} />
              </Card>
              <Card title="Notifications">
                {data.announcements.length === 0 && <p className="text-sm text-slate-500">No messages from your teachers.</p>}
                <ul className="space-y-3">
                  {data.announcements.map((a) => (
                    <li key={a.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p>{a.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{a.class_name} · {a.created_at}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}