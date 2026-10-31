const BASE = 'http://localhost:4000/api'

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('session'))
  } catch {
    return null
  }
}
export function saveSession(session) {
  localStorage.setItem('session', JSON.stringify(session))
}
export function clearSession() {
  localStorage.removeItem('session')
}

export async function api(path, { method = 'GET', body } = {}) {
  const session = getSession()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}