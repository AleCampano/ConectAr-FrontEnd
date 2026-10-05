import { BASE_URL } from '../config/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface MensajeDireto {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  is_mine?: boolean
  sender?: { id: string; full_name: string; username: string; avatar_url: string | null }
  receiver?: { id: string; full_name: string; username: string; avatar_url: string | null }
}

export interface Conversacion {
  user: { id: string; full_name: string; username: string; avatar_url: string | null }
  ultimoMensaje: string
  ultimaFecha: string
  noLeidos: number
  ultimoEsMio: boolean
}

// Shape cruda devuelta por GET /api/messages/
interface ConversacionRaw {
  user: { id: string; full_name: string; username: string; avatar_url: string | null }
  last_message: {
    id: string
    content: string
    created_at: string
    is_mine: boolean
    read: boolean
  } | null
  unread_count: number
}

/** Lista todas las conversaciones del usuario autenticado */
export async function listarConversaciones(): Promise<Conversacion[]> {
  const res = await fetch(`${BASE_URL}/messages`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Error al obtener conversaciones')
  const data: ConversacionRaw[] = await res.json()
  if (!Array.isArray(data)) return []

  return data.map(raw => ({
    user: raw.user,
    ultimoMensaje: raw.last_message?.content ?? '',
    ultimaFecha: raw.last_message?.created_at ?? new Date(0).toISOString(),
    noLeidos: raw.unread_count ?? 0,
    ultimoEsMio: raw.last_message?.is_mine ?? false,
  }))
}

/** Obtiene los mensajes de la conversación con un usuario */
export async function obtenerMensajesDirectos(otroUserId: string, limit = 50): Promise<MensajeDireto[]> {
  const res = await fetch(`${BASE_URL}/messages/${otroUserId}?limit=${limit}`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Error al obtener mensajes')
  const data = await res.json()
  if (!Array.isArray(data)) return []

  const miId = localStorage.getItem('user_id') ?? ''
  // El backend no devuelve is_mine — lo calculamos comparando sender_id
  return data.map((msg: any) => ({
    ...msg,
    is_mine: String(msg.sender_id) === String(miId),
  }))
}

/** Envía un mensaje directo a un usuario */
export async function enviarMensajeDirecto(receiverId: string, content: string): Promise<MensajeDireto> {
  const res = await fetch(`${BASE_URL}/messages/${receiverId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ content })
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? body?.message ?? 'Error al enviar mensaje')
  }
  const msg = await res.json()
  const miId = localStorage.getItem('user_id') ?? ''
  // El response trae username/full_name/avatar_url en el root — normalizamos a la forma sender:{...}
  return {
    ...msg,
    is_mine: String(msg.sender_id) === String(miId),
    sender: msg.sender ?? {
      id: msg.sender_id,
      username: msg.username ?? '',
      full_name: msg.full_name ?? '',
      avatar_url: msg.avatar_url ?? null,
    },
  }
}

/** Elimina un mensaje propio */
export async function eliminarMensaje(messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Error al eliminar mensaje')
}
