import { BASE_URL } from '../config/api'

export async function calificarEvento(eventId: string, score: number, yaCalificado = false) {
  const token = localStorage.getItem('access_token')
  const method = yaCalificado ? 'PUT' : 'POST'
  const res = await fetch(`${BASE_URL}/events/${eventId}/rating`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ score })
  })
  const body = await res.json().catch(() => ({}))
  console.log(`[Rating] ${method} /events/${eventId}/rating → ${res.status}`, body)
  if (!res.ok) throw new Error(`${res.status}: ${body?.error ?? body?.message ?? JSON.stringify(body)}`)
  return body
}

export async function obtenerRating(eventId: string) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/rating`)
  if (!res.ok) return { average: null, total: 0 }
  return res.json() // { average: 4.2, total: 18 }
}

export async function obtenerMiRating(eventId: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/events/${eventId}/rating/me`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) return { score: null }
  return res.json() // { score: 4 } o { score: null }
}

export async function obtenerEventosAsistidos(userId: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/users/${userId}/events/attended`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener eventos asistidos')
  return res.json() // [{ id, title, event_date, event_type }]
}
