import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, saveSession } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = mode === 'login' ? { email: form.email, password: form.password } : form
      const data = await api(`/auth/${mode}`, { method: 'POST', body })
      saveSession(data)
      navigate(data.user.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">EduTrack</h1>
        <p className="text-sm text-slate-500">
          {mode === 'login' ? 'Log in to your account' : 'Create your account'}
        </p>

        {mode === 'register' && (
          <>
            <input className={input} name="name" placeholder="Full name" value={form.name} onChange={update} />
            <select className={input} name="role" value={form.role} onChange={update}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </>
        )}
        <input className={input} name="email" type="email" placeholder="Email" value={form.email} onChange={update} />
        <input className={input} name="password" type="password" placeholder="Password" value={form.password} onChange={update} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-800 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full text-sm text-slate-600 underline"
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  )
}