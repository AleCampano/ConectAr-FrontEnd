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
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(evento)
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || body?.detail || body?.message || `Error al crear evento (${res.status})`)
  }
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

export async function obtenerUsuario(userId: string) {
  const res = await fetch(`${BASE_URL}/users/${userId}`)
  if (!res.ok) throw new Error('Usuario no encontrado')
  return res.json()
}

export async function likeEvento(eventId: string) {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('user_id')
  const res = await fetch(`${BASE_URL}/events/${eventId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error('Error al dar like al evento')
  return res.json()
}

export async function unlikeEvento(eventId: string) {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('user_id')
  const res = await fetch(`${BASE_URL}/events/${eventId}/like`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: userId })
  })
  if (!res.ok) throw new Error('Error al quitar like del evento')
  return res.json()
}

export async function obtenerLikes(eventId: string) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/like`)
  if (!res.ok) throw new Error('Error al obtener likes')
  return res.json()
}

export async function obtenerParticipantesConEdad(eventId: string): Promise<
  { user_id: string; full_name: string; username: string; avatar_url: string | null; edad: number | null }[]
> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/events/${eventId}/participants`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener participantes')
  const data: any[] = await res.json()

  // Log para ver la estructura real que devuelve el backend
  if (data.length > 0) {
    console.log('[Participantes] Estructura recibida:', JSON.stringify(data[0], null, 2))
  }

  function calcularEdad(birthDate: string): number {
    const hoy = new Date()
    const nac = new Date(birthDate)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  // Intentamos extraer birth_date de la estructura del participante
  // Soporta: p.birth_date, p.users.birth_date, p.user.birth_date
  const participantesParciales = data.map(p => {
    const u = p.users ?? p.user ?? p
    const birthDate: string | null =
      p.birth_date ?? u.birth_date ?? null
    const userId = String(p.user_id ?? u.id ?? '')
    return {
      user_id: userId,
      full_name: u.full_name ?? u.username ?? 'Usuario',
      username: u.username ?? '',
      avatar_url: u.avatar_url ?? null,
      edad: birthDate ? calcularEdad(birthDate) : null,
      // guardamos el id para el fallback
      _rawUserId: userId,
    }
  })

  // Si alguno no tiene edad, intentamos buscar su perfil individualmente
  const sinEdad = participantesParciales.filter(p => p.edad === null)
  if (sinEdad.length > 0) {
    console.log(`[Participantes] ${sinEdad.length} participante(s) sin birth_date, usando fallback GET /users/:id`)
    const resultados = await Promise.allSettled(
      sinEdad.map(p =>
        fetch(`${BASE_URL}/users/${p._rawUserId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        }).then(r => r.ok ? r.json() : null)
      )
    )
    // Armar mapa userId → birth_date obtenido del fallback
    const fallbackMap: Record<string, string | null> = {}
    sinEdad.forEach((p, i) => {
      const perfil = resultados[i].status === 'fulfilled' ? resultados[i].value : null
      console.log(`[Fallback] usuario ${p._rawUserId}:`, JSON.stringify(perfil, null, 2))
      fallbackMap[p._rawUserId] = perfil?.birth_date ?? null
    })

    return participantesParciales.map(({ _rawUserId, ...rest }) => {
      if (rest.edad !== null) return rest
      const birthDate = fallbackMap[_rawUserId] ?? null
      return { ...rest, edad: birthDate ? calcularEdad(birthDate) : null }
    })
  }

  return participantesParciales.map(({ _rawUserId: _, ...rest }) => rest)
}

/**
 * Lista los eventos creados por el usuario autenticado.
 */
export async function listarMisEventos(): Promise<any[]> {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('user_id')
  const res = await fetch(`${BASE_URL}/events?creator_id=${userId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error('Error al obtener mis eventos')
  const data = await res.json()
  // Filtrar por si el backend no soporta el query param todavía
  return Array.isArray(data)
    ? data.filter((ev: any) => String(ev.creator_id ?? ev.created_by ?? ev.user_id ?? '') === String(userId ?? ''))
    : []
}
