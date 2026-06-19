import { BASE_URL } from '../config/api'

export async function listarEventos(type?: string) {
  const url = type
    ? `${BASE_URL}/events?type=${encodeURIComponent(type)}`
    : `${BASE_URL}/events`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error al obtener eventos')
  return res.json()
}

export async function obtenerEvento(id: string) {
  const res = await fetch(`${BASE_URL}/events/${id}`)
  if (!res.ok) throw new Error('Evento no encontrado')
  return res.json()
}

export async function crearEvento(evento: any) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evento)
  })
  if (!res.ok) throw new Error('Error al crear evento')
  return res.json()
}

export async function borrarEvento(id: string) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (!res.ok) throw new Error('Error al borrar evento')
  return res.json()
}

export async function unirseEvento(eventId: string) {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('user_id')
  const res = await fetch(`${BASE_URL}/events/${eventId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error('Error al unirse al evento')
  return res.json()
}

export async function abandonarEvento(eventId: string) {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('user_id')
  const res = await fetch(`${BASE_URL}/events/${eventId}/join`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error('Error al abandonar el evento')
  return res.json()
}

export async function listarPersonas(eventId: string) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/participants`)
  if (!res.ok) throw new Error('Error al obtener participantes')
  return res.json()
}

export async function buscarPersonas(query: string) {
  if (query.length < 2) return []
  const res = await fetch(`${BASE_URL}/users/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Error al buscar personas')
  return res.json()
}
