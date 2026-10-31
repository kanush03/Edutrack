import { useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../api'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user } = getSession()

  function logout() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Teacher dashboard</h1>
          <button onClick={logout} className="rounded-lg bg-slate-800 px-4 py-2 text-white">Log out</button>
        </div>
        <p className="mt-4 text-slate-600">Welcome, {user.name}.</p>
      </div>
    </div>
  )
}