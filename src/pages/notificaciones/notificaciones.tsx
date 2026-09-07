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
  type: 'friend_request' | 'friend_request_accepted' | 'like' | 'join' | 'comment' | 'new_message' | string
  read: boolean
  created_at: string
  actor: {
    id?: string  // el backend aún no lo devuelve
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
  if (type === 'message' || type === 'new_message') return '💬'
  if (type === 'join') return '🎉'
  if (type === 'comment') return '💬'
  if (type === 'friend_request' || type === 'friend_request_accepted') return '👤'
  return '🔔'
}

function textoNotif(n: Notificacion) {
  const nombre = n.actor?.full_name ?? n.actor?.username ?? 'Alguien'
  if (n.type === 'like') return `${nombre} le dio like a tu evento "${n.event?.title ?? ''}"`
  if (n.type === 'message' || n.type === 'new_message') return `${nombre} te envió un mensaje`
  if (n.type === 'join') return `${nombre} se unió a tu evento "${n.event?.title ?? ''}"`
  if (n.type === 'comment') return `${nombre} comentó en tu evento "${n.event?.title ?? ''}"`
  if (n.type === 'friend_request') return `${nombre} te envió una solicitud de amistad`
  if (n.type === 'friend_request_accepted') return `${nombre} aceptó tu solicitud de amistad`
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

  async function handleClickNotif(n: Notificacion) {
    // Si es mensaje, marcar como leídas todas las notificaciones de ese actor
    if ((n.type === 'message' || n.type === 'new_message') && n.actor?.id) {
      const delMismoActor = notificaciones.filter(
        x => (x.type === 'message' || x.type === 'new_message') && x.actor?.id === n.actor?.id && !x.read
      )
      await Promise.allSettled(delMismoActor.map(x => handleMarcarLeida(x.id)))
      navigate(`/mensajes/${n.actor.id}`)
      return
    }
    // Para el resto: marcar solo la tocada
    if (!n.read) await handleMarcarLeida(n.id)
    if (n.type === 'like' && n.event?.id) {
      navigate(`/home`)
    }
  }

  // Mezclar solicitudes y notificaciones en una sola lista ordenada por fecha
  // Las notificaciones de mensaje se agrupan por actor — solo aparece la más reciente de cada conversación
  const notificacionesAgrupadas = (() => {
    const vistas = new Set<string>()
    const resultado: Notificacion[] = []
    // Ordenar por fecha desc primero para quedarnos con la más reciente de cada actor
    const ordenadas = [...notificaciones].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    for (const n of ordenadas) {
      const esMsg = n.type === 'message' || n.type === 'new_message'
      const key = esMsg && n.actor?.id ? `msg-${n.actor.id}` : n.id
      if (vistas.has(key)) continue
      vistas.add(key)
      resultado.push(n)
    }
    return resultado
  })()

  const items: Item[] = [
    ...solicitudes.map(s => ({
      kind: 'solicitud' as const,
      data: s,
      fecha: new Date(s.created_at),
    })),
    ...notificacionesAgrupadas
      .filter(n => n.type !== 'friend_request') // las solicitudes vienen del otro endpoint
      .map(n => ({
        kind: 'notif' as const,
        data: n,
        fecha: new Date(n.created_at),
      })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

  const noLeidas = notificaciones.filter(n => !n.read && n.type !== 'friend_request' && n.type !== 'friend_request_accepted').length

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
                className={`notif-item ${!n.read ? 'notif-item-nueva' : ''} ${n.type === 'message' || n.type === 'like' ? 'notif-item-clickable' : ''}`}
                onClick={() => handleClickNotif(n)}
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
