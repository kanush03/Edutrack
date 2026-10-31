import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import { getSession } from './api'

function Protected({ role, children }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.role !== role) {
    return <Navigate to={session.user.role === 'teacher' ? '/teacher' : '/student'} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
        <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}