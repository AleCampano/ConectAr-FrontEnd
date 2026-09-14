import { BASE_URL } from '../config/api'

/** Refresca el access_token usando el refresh_token guardado.
 *  Devuelve true si tuvo éxito, false si hay que re-loguearse. */
export async function refrescarToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE_URL}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      return true
    }
    return false
  } catch {
    return false
  }
}

/** Cierra la sesión y limpia el storage */
export function cerrarSesion() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('usuario')
  window.location.href = '/login'
}

/** fetch autenticado con reintento automático ante 401 */
export async function fetchAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('access_token')
  const headers = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  let res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    // Intentar renovar el token
    const ok = await refrescarToken()
    if (ok) {
      const nuevoToken = localStorage.getItem('access_token')
      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers ?? {}),
          ...(nuevoToken ? { Authorization: `Bearer ${nuevoToken}` } : {}),
        }
      })
    } else {
      cerrarSesion()
    }
  }
  return res
}

export async function registrarse(datos: any) {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: datos.usuario,
      email: datos.correo,
      password: datos.contrasena,
      full_name: datos.nombreCompleto,
      birth_date: datos.fechaNacimiento  // formato YYYY-MM-DD
    })
  })
  if (!res.ok) throw new Error('Error al registrarse')
  return res.json()
}

export async function login(datos: any) {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: datos.correo,
      password: datos.contrasena
    })
  })
  if (!res.ok) throw new Error('Error al iniciar sesión')
  const data = await res.json()
  // El token viene en access_token, el username no está en la respuesta del login
  localStorage.setItem('user_id', data.user.id)
  localStorage.setItem('access_token', data.access_token)
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
  // Guardamos lo que tenemos del login (sin username todavía)
  localStorage.setItem('usuario', JSON.stringify(data.user))
  return data
}

export async function obtenerPerfil(id: string) {
  const res = await fetch(`${BASE_URL}/users/${id}`)
  if (!res.ok) throw new Error('Error al obtener perfil')
  return res.json()
}

export async function actualizarPerfil(id: string, datos: { avatar_url?: string; full_name?: string; username?: string }) {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(datos)
  })
  if (!res.ok) throw new Error('Error al actualizar perfil')
  return res.json()
}

export async function olvidasteContrasena(email: string) {
  const res = await fetch(`${BASE_URL}/users/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!res.ok) throw new Error('Error al enviar el correo')
  return res.json()
}

export async function resetPassword(accessToken: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/users/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, newPassword })
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error ?? 'Error al cambiar la contraseña')
  return body
}
