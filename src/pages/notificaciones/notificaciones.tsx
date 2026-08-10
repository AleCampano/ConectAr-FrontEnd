import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  obtenerNotificaciones,
  obtenerSolicitudes,
  aceptarSolicitud,
  rechazarSolicitud,
  marcarNotificacionLeida,
} from '../../services/friendships'
import BottomNav from '../../components/BottomNav/BottomNav'
import './notificaciones.css'

type Solicitud = {
  id: string
  sender_id: string
  sender: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
  }
  created_at: string
}

type Notificacion = {
  id: string
  type: 'friend_request' | 'like' | 'message' | string
  read: boolean
  created_at: string
  actor: {
    full_name: string
    username: string
    avatar_url: string | null
  } | null
  event: { id: string; title: string } | null
}

// Item unificado para la lista
type Item =
  | { kind: 'solicitud'; data: Solicitud; fecha: Date }
  | { kind: 'notif';     data: Notificacion; fecha: Date }

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `hace ${hs} h`
  const dias = Math.floor(hs / 24)
  if (dias < 7) return `hace ${dias} d`
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function Avatar({ url, nombre }: { url: string | null; nombre: string }) {
  const iniciales = (nombre || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={nombre} className="notif-avatar-img" />
  return <div className="notif-avatar-ph">{iniciales}</div>
}

function iconoTipo(type: string) {
  if (type === 'like') return '❤️'
  if (type === 'message') return '💬'
  if (type === 'friend_request') return '👤'
  return '🔔'
}

function textoNotif(n: Notificacion) {
  const nombre = n.actor?.full_name ?? n.actor?.username ?? 'Alguien'
  if (n.type === 'like') return `${nombre} le dio like a tu evento "${n.event?.title ?? ''}"`
  if (n.type === 'message') return `${nombre} te envió un mensaje`
  if (n.type === 'friend_request') return `${nombre} te envió una solicitud de amistad`
  return `Nueva notificación de ${nombre}`
}

export default function Notificaciones() {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string[]>([])

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        const [sols, notifs] = await Promise.allSettled([
          obtenerSolicitudes(),
          obtenerNotificaciones(),
        ])
        if (sols.status === 'fulfilled') setSolicitudes(Array.isArray(sols.value) ? sols.value : [])
        if (notifs.status === 'fulfilled') setNotificaciones(Array.isArray(notifs.value) ? notifs.value : [])

        // Debug
        console.log('[Notificaciones]', notifs.status === 'fulfilled' ? notifs.value : notifs.reason)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  async function handleAceptar(sol: Solicitud) {
    setProcesando(prev => [...prev, sol.id])
    try {
      await aceptarSolicitud(sol.id)
      setSolicitudes(prev => prev.filter(s => s.id !== sol.id))
    } catch {
      // silencioso
    } finally {
      setProcesando(prev => prev.filter(id => id !== sol.id))
    }
  }

  async function handleRechazar(sol: Solicitud) {
    setProcesando(prev => [...prev, sol.id])
    try {
      await rechazarSolicitud(sol.id)
      setSolicitudes(prev => prev.filter(s => s.id !== sol.id))
    } catch {
      // silencioso
    } finally {
      setProcesando(prev => prev.filter(id => id !== sol.id))
    }
  }

  async function handleMarcarLeida(id: string) {
    try {
      await marcarNotificacionLeida(id)
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {
      // silencioso
    }
  }

  // Mezclar solicitudes y notificaciones en una sola lista ordenada por fecha
  const items: Item[] = [
    ...solicitudes.map(s => ({
      kind: 'solicitud' as const,
      data: s,
      fecha: new Date(s.created_at),
    })),
    ...notificaciones
      .filter(n => n.type !== 'friend_request') // las solicitudes vienen del otro endpoint
      .map(n => ({
        kind: 'notif' as const,
        data: n,
        fecha: new Date(n.created_at),
      })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

  const noLeidas = notificaciones.filter(n => !n.read && n.type !== 'friend_request').length

  return (
    <div className="notif-wrapper">

      {/* Header */}
      <header className="notif-header">
        <button className="notif-back" onClick={() => navigate('/home')} aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="notif-titulo">Notificaciones</h1>
        {noLeidas > 0 && <span className="notif-badge-header">{noLeidas}</span>}
      </header>

      <div className="notif-scroll">
        {cargando ? (
          <p className="notif-vacio">Cargando...</p>

        ) : items.length === 0 ? (
          <p className="notif-vacio">No tenés notificaciones todavía.</p>

        ) : (
          items.map((item, i) => {

            /* ── Solicitud de amistad ── */
            if (item.kind === 'solicitud') {
              const sol = item.data
              const u = sol.sender
              const ocupado = procesando.includes(sol.id)
              return (
                <div key={`sol-${sol.id}`} className="notif-item">
                  <div className="notif-item-avatar">
                    <Avatar url={u?.avatar_url ?? null} nombre={u?.full_name ?? u?.username ?? '?'} />
                    <span className="notif-tipo-badge">👤</span>
                  </div>
                  <div className="notif-item-info">
                    <p className="notif-item-texto">
                      <strong>{u?.full_name ?? u?.username}</strong> te envió una solicitud de amistad
                    </p>
                    <span className="notif-item-tiempo">{tiempoRelativo(sol.created_at)}</span>
                    <div className="notif-item-acciones">
                      <button
                        className="notif-btn-aceptar"
                        onClick={() => handleAceptar(sol)}
                        disabled={ocupado}
                      >
                        {ocupado ? '...' : 'Aceptar'}
                      </button>
                      <button
                        className="notif-btn-rechazar"
                        onClick={() => handleRechazar(sol)}
                        disabled={ocupado}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            /* ── Notificación (like, mensaje, etc.) ── */
            const n = item.data
            return (
              <div
                key={`notif-${n.id}-${i}`}
                className={`notif-item ${!n.read ? 'notif-item-nueva' : ''}`}
                onClick={() => !n.read && handleMarcarLeida(n.id)}
              >
                <div className="notif-item-avatar">
                  <Avatar
                    url={n.actor?.avatar_url ?? null}
                    nombre={n.actor?.full_name ?? n.actor?.username ?? '?'}
                  />
                  <span className="notif-tipo-badge">{iconoTipo(n.type)}</span>
                </div>
                <div className="notif-item-info">
                  <p className="notif-item-texto">{textoNotif(n)}</p>
                  <span className="notif-item-tiempo">{tiempoRelativo(n.created_at)}</span>
                </div>
                {!n.read && <div className="notif-punto" />}
              </div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}
