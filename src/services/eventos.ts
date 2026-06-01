import { BASE_URL } from '../config/api'

export async function listarEventos() {
  const res = await fetch(`${BASE_URL}/events`)
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

export async function listarPersonas(eventId: string) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/participants`)
  if (!res.ok) throw new Error('Error al obtener participantes')
  return res.json()
}
