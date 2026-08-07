import { BASE_URL } from '../config/api'

export type ChatUser = {
  id?: string
  full_name?: string
  username?: string
  avatar_url?: string | null
}

export type ChatMessage = {
  id: string
  event_id: string
  user_id: string
  content: string
  created_at: string
  // distintos nombres que puede usar el back para el objeto de usuario
  users?: ChatUser
  user?: ChatUser
  sender?: ChatUser
  // o campos sueltos en la raíz
  full_name?: string
  username?: string
  avatar_url?: string | null
}

export async function obtenerMensajes(
  eventId: string,
  opts?: { limit?: number; before_id?: string }
): Promise<ChatMessage[]> {
  const token = localStorage.getItem('access_token')
  const params = new URLSearchParams()
  if (opts?.limit)     params.set('limit',     String(opts.limit))
  if (opts?.before_id) params.set('before_id', opts.before_id)

  const query = params.toString() ? `?${params}` : ''
  const res = await fetch(`${BASE_URL}/events/${eventId}/chat${query}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener mensajes')
  return res.json()
}

export async function enviarMensaje(eventId: string, content: string): Promise<ChatMessage> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/events/${eventId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ content })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || 'Error al enviar mensaje')
  return body
}

export async function eliminarMensaje(eventId: string, messageId: string): Promise<void> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/events/${eventId}/chat/${messageId}`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al eliminar mensaje')
}
