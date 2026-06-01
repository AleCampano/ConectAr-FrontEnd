import { BASE_URL } from '../config/api'

export async function registrarse(datos: any) {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: datos.usuario,
      email: datos.correo,
      password: datos.contrasena,
      full_name: datos.nombreCompleto
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
  return res.json()
}

export async function obtenerPerfil(id: string) {
  const res = await fetch(`${BASE_URL}/users/${id}`)
  if (!res.ok) throw new Error('Error al obtener perfil')
  return res.json()
}
