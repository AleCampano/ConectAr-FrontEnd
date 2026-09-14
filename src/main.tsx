import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App'

// ── Interceptor global de fetch: renueva el token ante 401 ──
const _originalFetch = window.fetch.bind(window)

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let res = await _originalFetch(input, init)

  if (res.status === 401) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
    // No interceptar el propio endpoint de refresh ni de login para evitar loops
    if (url.includes('/users/refresh') || url.includes('/users/login')) return res

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      // Sin refresh token → limpiar sesión y redirigir
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
      return res
    }

    // Intentar renovar el token
    try {
      const refreshRes = await _originalFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)

          // Reintentar el request original con el nuevo token
          const newInit: RequestInit = {
            ...(init ?? {}),
            headers: {
              ...(init?.headers ?? {}),
              Authorization: `Bearer ${data.access_token}`,
            }
          }
          return _originalFetch(input, newInit)
        }
      }
    } catch { /* silencioso */ }

    // Refresh falló → limpiar y redirigir al login
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('usuario')
    window.location.href = '/login'
  }

  return res
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
