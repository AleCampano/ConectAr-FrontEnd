import { BASE_URL } from '../config/api'

export async function obtenerNotificaciones() {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/notifications`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener notificaciones')
  return res.json()
}

export async function marcarNotificacionLeida(id: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al marcar notificación')
  return res.json()
}

export async function obtenerSolicitudes() {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/friendships/requests`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener solicitudes')
  return res.json()
}

// :id = id de la fila en friendships (viene del GET /requests)
export async function aceptarSolicitud(id: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/friendships/accept/${id}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al aceptar solicitud')
  return res.json()
}

// :id = id de la fila en friendships (viene del GET /requests)
export async function rechazarSolicitud(id: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/friendships/reject/${id}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al rechazar solicitud')
  return res.json()
}

// POST /friendships/request — body: { receiver_id }
export async function enviarSolicitud(receiverId: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/friendships/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ receiver_id: receiverId })
  })
  if (!res.ok) throw new Error('Error al enviar solicitud')
  return res.json()
}

export async function obtenerEstadoAmistad(friendId: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/friendships/status/${friendId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) return { status: 'none' }
  return res.json()
}

export async function obtenerAmigos() {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/friendships`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener amigos')
  return res.json()
  // → [{ id, full_name, username, avatar_url, bio, xp, level }]
}
