import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  obtenerNotificaciones,
  obtenerSolicitudes,
  aceptarSolicitud,
  rechazarSolicitud,
  marcarNotificacionLeida,
} from '../../services/friendships'
import {
  listarMisInvitaciones,
  aceptarInvitacion,
  rechazarInvitacion,
  type Invitacion,
} from '../../services/invitaciones'
import { obtenerEvento } from '../../services/eventos'
import BottomNav from '../../components/BottomNav/BottomNav'
import EventoPopup from '../../components/EventoPopup/EventoPopup'
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
  type: 'friend_request' | 'friend_request_accepted' | 'like' | 'join' | 'comment' | 'new_message' | 'event_invitation' | string
  read: boolean
  created_at: string
  actor: {
    id?: string
    full_name: string
    username: string
    avatar_url: string | null
  } | null
  event: { id: string; title: string } | null
  // Para invitaciones: el backend puede incluir el evento embebido
  invitation_id?: string
}

// Item unificado para la lista
type Item =
  | { kind: 'solicitud';   data: Solicitud;   fecha: Date }
  | { kind: 'notif';       data: Notificacion; fecha: Date }
  | { kind: 'invitacion';  data: Invitacion;   fecha: Date; evento: any | null }

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
  if (type === 'event_invitation') return '🔒'
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
  if (n.type === 'event_invitation') return `${nombre} te invitó al evento "${n.event?.title ?? ''}"`
  return `Nueva notificación de ${nombre}`
}

const CATEGORY_EMOJI: Record<string, string> = {
  deporte:   '⚽',
  concierto: '🎵',
  cultura:   '🎭',
  fiesta:    '🌙',
  otro:      '✨',
}

function formatFechaCorta(fechaStr: string) {
  if (!fechaStr) return ''
  const d = new Date(fechaStr)
  return d.toLocaleString('es-AR', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Notificaciones() {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [invitaciones, setInvitaciones] = useState<Array<{ inv: Invitacion; evento: any | null }>>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string[]>([])
  const [eventoPopup, setEventoPopup] = useState<any | null>(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        const [sols, notifs, invits] = await Promise.allSettled([
          obtenerSolicitudes(),
          obtenerNotificaciones(),
          listarMisInvitaciones(),
        ])

        if (sols.status === 'fulfilled') setSolicitudes(Array.isArray(sols.value) ? sols.value : [])

        if (notifs.status === 'fulfilled') {
          const lista: Notificacion[] = Array.isArray(notifs.value) ? notifs.value : []
          setNotificaciones(lista)

          // Marcar todas las no leídas en el servidor (background)
          const noLeidas = lista.filter(n => !n.read)
          if (noLeidas.length > 0) {
            Promise.allSettled(noLeidas.map(n => marcarNotificacionLeida(n.id)))
              .then(() => setNotificaciones(prev => prev.map(n => ({ ...n, read: true }))))
          }
        }

        // Cargar invitaciones pendientes — el backend ya incluye el evento embebido
        if (invits.status === 'fulfilled') {
          const pendientes = (Array.isArray(invits.value) ? invits.value : [])
            .filter((inv: Invitacion) => inv.status === 'pending')

          const resultado = pendientes.map((inv: Invitacion) => ({
            inv,
            // El backend devuelve { ...invitacion, event: { id, title, event_date, location, image_url } }
            evento: (inv as any).event ?? null,
          }))
          setInvitaciones(resultado)
        }
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

  async function handleAceptarInvitacion(invId: string) {
    setProcesando(prev => [...prev, invId])
    try {
      await aceptarInvitacion(invId)
      setInvitaciones(prev => prev.filter(i => i.inv.id !== invId))
    } catch {
      // silencioso
    } finally {
      setProcesando(prev => prev.filter(id => id !== invId))
    }
  }

  async function handleRechazarInvitacion(invId: string) {
    setProcesando(prev => [...prev, invId])
    try {
      await rechazarInvitacion(invId)
      setInvitaciones(prev => prev.filter(i => i.inv.id !== invId))
    } catch {
      // silencioso
    } finally {
      setProcesando(prev => prev.filter(id => id !== invId))
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
    // Si es invitación de evento vía notificación del servidor
    if (n.type === 'event_invitation') {
      if (!n.read) await handleMarcarLeida(n.id)
      // Si la notificación trae invitation_id, intentamos abrirla
      if (n.event?.id) {
        try {
          const ev = await obtenerEvento(n.event.id)
          setEventoPopup(ev)
        } catch { /* silencioso */ }
      }
      return
    }
    // Si es mensaje
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

  // Mezclar solicitudes, invitaciones y notificaciones en una sola lista ordenada por fecha
  const notificacionesAgrupadas = (() => {
    const vistas = new Set<string>()
    const resultado: Notificacion[] = []
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
    // Invitaciones pendientes (de /invitations/my, independiente del sistema de notifs)
    ...invitaciones.map(({ inv, evento }) => ({
      kind: 'invitacion' as const,
      data: inv,
      fecha: new Date(inv.created_at),
      evento,
    })),
    ...notificacionesAgrupadas
      .filter(n => n.type !== 'friend_request' && n.type !== 'event_invitation') // las de invitación ya vienen de /invitations/my
      .map(n => ({
        kind: 'notif' as const,
        data: n,
        fecha: new Date(n.created_at),
      })),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

  const noLeidas = notificaciones.filter(n => !n.read && n.type !== 'friend_request' && n.type !== 'friend_request_accepted').length
  const totalPendientes = noLeidas + invitaciones.length

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
        {totalPendientes > 0 && <span className="notif-badge-header">{totalPendientes}</span>}
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

            /* ── Invitación a evento privado ── */
            if (item.kind === 'invitacion') {
              const inv = item.data
              const ev = item.evento
              const ocupado = procesando.includes(inv.id)
              const emoji = ev ? (CATEGORY_EMOJI[ev.event_type] ?? '✨') : '🔒'
              const invitadoPor = inv.user?.full_name ?? inv.user?.username ?? 'Alguien'

              return (
                <div key={`inv-${inv.id}`} className="notif-item notif-item-nueva notif-item-invitacion">
                  {/* Ícono del evento o placeholder */}
                  <div className="notif-item-avatar">
                    {ev?.image_url
                      ? <img src={ev.image_url} alt={ev.title} className="notif-avatar-img notif-avatar-evento" />
                      : <div className="notif-avatar-ph notif-avatar-evento-ph">{emoji}</div>
                    }
                    <span className="notif-tipo-badge">🔒</span>
                  </div>

                  <div className="notif-item-info">
                    <p className="notif-item-texto">
                      <strong>{invitadoPor}</strong> te invitó al evento privado
                    </p>

                    {/* Card del evento */}
                    {ev ? (
                      <button
                        className="notif-invitacion-card"
                        onClick={() => setEventoPopup(ev)}
                        aria-label={`Ver evento ${ev.title}`}
                      >
                        <div className="notif-invitacion-card-emoji">{emoji}</div>
                        <div className="notif-invitacion-card-info">
                          <span className="notif-invitacion-card-titulo">{ev.title}</span>
                          {ev.event_date && (
                            <span className="notif-invitacion-card-fecha">
                              📅 {formatFechaCorta(ev.event_date)}
                            </span>
                          )}
                          {ev.location && (
                            <span className="notif-invitacion-card-lugar">
                              📍 {ev.location.split(',')[0]}
                            </span>
                          )}
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="notif-invitacion-chevron">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ) : (
                      <span className="notif-invitacion-sin-info">Evento privado</span>
                    )}

                    <span className="notif-item-tiempo">{tiempoRelativo(inv.created_at)}</span>

                    <div className="notif-item-acciones">
                      <button
                        className="notif-btn-aceptar"
                        onClick={() => handleAceptarInvitacion(inv.id)}
                        disabled={ocupado}
                      >
                        {ocupado ? '...' : 'Aceptar'}
                      </button>
                      <button
                        className="notif-btn-rechazar"
                        onClick={() => handleRechazarInvitacion(inv.id)}
                        disabled={ocupado}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            /* ── Notificación (like, mensaje, join, etc.) ── */
            const n = item.data
            const esClickable = n.type === 'message' || n.type === 'new_message' || n.type === 'like' || n.type === 'event_invitation'
            return (
              <div
                key={`notif-${n.id}-${i}`}
                className={`notif-item ${!n.read ? 'notif-item-nueva' : ''} ${esClickable ? 'notif-item-clickable' : ''}`}
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

      {/* Popup con info completa del evento */}
      {eventoPopup && (
        <EventoPopup
          evento={eventoPopup}
          onClose={() => setEventoPopup(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
