import { BASE_URL } from '../config/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Invitacion {
  id: string
  event_id: string
  invited_user_id: string
  invited_by: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  user?: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
  }
}

/** Invita a un usuario a un evento privado */
export async function invitarUsuario(eventId: string, userId: string): Promise<Invitacion> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ user_id: userId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? body?.message ?? 'Error al invitar usuario')
  }
  return res.json()
}

/** Obtiene la lista de invitados a un evento */
export async function obtenerInvitaciones(eventId: string): Promise<Invitacion[]> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/invitations`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Error al obtener invitaciones')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Obtiene todas las invitaciones recibidas por el usuario autenticado */
export async function listarMisInvitaciones(): Promise<Invitacion[]> {
  const res = await fetch(`${BASE_URL}/invitations/my`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Error al obtener mis invitaciones')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Acepta una invitación a un evento privado */
export async function aceptarInvitacion(invitacionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/invitations/${invitacionId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? body?.message ?? 'Error al aceptar invitación')
  }
}

/** Rechaza una invitación a un evento privado */
export async function rechazarInvitacion(invitacionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/invitations/${invitacionId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? body?.message ?? 'Error al rechazar invitación')
  }
}
