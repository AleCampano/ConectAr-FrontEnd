import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  obtenerMensajesDirectos,
  enviarMensajeDirecto,
  marcarConversacionLeida,
  MensajeDireto,
} from '../../services/mensajesDirectos'
import { obtenerAmigos } from '../../services/friendships'
import './chatDirecto.css'

const POLL_INTERVAL = 4000

function Avatar({ url, nombre, size = 36 }: { url: string | null; nombre: string; size?: number }) {
  const iniciales = (nombre || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={nombre} className="cd-avatar-img" style={{ width: size, height: size }} />
  return <div className="cd-avatar-ph" style={{ width: size, height: size }}>{iniciales}</div>
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export default function ChatDirecto() {
  const { userId: otroUserId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const miId = localStorage.getItem('user_id') ?? ''

  const [mensajes, setMensajes] = useState<MensajeDireto[]>([])
  const [otroUsuario, setOtroUsuario] = useState<{ id: string; full_name: string; username: string; avatar_url: string | null } | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const primeraVez = useRef(true)

  const scrollAlFinal = useCallback((suave = true) => {
    bottomRef.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'instant' })
  }, [])

  const cargarMensajes = useCallback(async (esInicial = false) => {
    if (!otroUserId) return
    try {
      const nuevos = await obtenerMensajesDirectos(otroUserId)
      setMensajes(prev => {
        const igual = prev.length === nuevos.length && prev.every((m, i) => m.id === nuevos[i].id)
        if (igual) return prev
        return nuevos
      })
      if (esInicial) {
        setTimeout(() => scrollAlFinal(false), 50)
        marcarConversacionLeida(otroUserId).catch(() => {})
      }
    } catch {
      if (esInicial) setError('No se pudo cargar la conversación.')
    } finally {
      if (esInicial) setCargando(false)
    }
  }, [otroUserId, scrollAlFinal])

  // Cargar datos del otro usuario desde amigos
  useEffect(() => {
    if (!otroUserId) return
    obtenerAmigos()
      .then(lista => {
        const amigo = (Array.isArray(lista) ? lista : []).find(
          (a: any) => String(a.id ?? a.user_id) === otroUserId
        )
        if (amigo) setOtroUsuario({
          id: String(amigo.id ?? amigo.user_id),
          full_name: amigo.full_name ?? amigo.username ?? 'Usuario',
          username: amigo.username ?? '',
          avatar_url: amigo.avatar_url ?? null,
        })
      })
      .catch(() => {})
  }, [otroUserId])

  // Carga inicial + polling
  useEffect(() => {
    cargarMensajes(true)
    intervalRef.current = setInterval(() => cargarMensajes(false), POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [cargarMensajes])

  // Scroll suave en mensajes nuevos
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return }
    scrollAlFinal(true)
  }, [mensajes, scrollAlFinal])

  async function handleEnviar() {
    const contenido = texto.trim()
    if (!contenido || enviando || !otroUserId) return
    setEnviando(true)
    setTexto('')
    try {
      const nuevo = await enviarMensajeDirecto(otroUserId, contenido)
      setMensajes(prev => [...prev, nuevo])
      setTimeout(() => scrollAlFinal(true), 50)
    } catch (e: any) {
      setError(e.message ?? 'No se pudo enviar')
      setTexto(contenido)
    } finally {
      setEnviando(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
  }

  // Agrupar por fecha
  type Item = { tipo: 'fecha'; valor: string } | { tipo: 'msg'; valor: MensajeDireto }
  const items: Item[] = []
  let ultimaFecha = ''
  for (const msg of mensajes) {
    const fecha = formatFecha(msg.created_at)
    if (fecha !== ultimaFecha) { items.push({ tipo: 'fecha', valor: fecha }); ultimaFecha = fecha }
    items.push({ tipo: 'msg', valor: msg })
  }

  const nombre = otroUsuario?.full_name ?? otroUsuario?.username ?? 'Usuario'

  return (
    <div className="cd-wrapper">

      {/* Header */}
      <header className="cd-header">
        <button className="cd-back" onClick={() => navigate('/mensajes')} aria-label="Volver">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="cd-header-info">
          <Avatar url={otroUsuario?.avatar_url ?? null} nombre={nombre} size={36} />
          <div className="cd-header-texto">
            <span className="cd-header-nombre">{nombre}</span>
            {otroUsuario?.username && (
              <span className="cd-header-username">@{otroUsuario.username}</span>
            )}
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="cd-error" onClick={() => setError(null)}>{error} ✕</div>
      )}

      {/* Lista mensajes */}
      <div className="cd-lista">
        {cargando ? (
          <p className="cd-vacio">Cargando mensajes...</p>
        ) : mensajes.length === 0 ? (
          <div className="cd-vacio-wrap">
            <Avatar url={otroUsuario?.avatar_url ?? null} nombre={nombre} size={56} />
            <p className="cd-vacio-nombre">{nombre}</p>
            <p className="cd-vacio">Todavía no hablaron. ¡Mandá el primer mensaje!</p>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.tipo === 'fecha') {
              return (
                <div key={`f-${i}`} className="cd-separador">
                  <span>{item.valor}</span>
                </div>
              )
            }
            const msg = item.valor
            const esMio = msg.is_mine ?? (String(msg.sender_id) === String(miId))
            const senderData = msg.sender ?? null
            const avatarUrl = esMio ? null : (senderData?.avatar_url ?? otroUsuario?.avatar_url ?? null)
            const senderNombre = esMio ? 'Yo' : (senderData?.full_name ?? senderData?.username ?? nombre)

            return (
              <div key={msg.id} className={`cd-msg-row ${esMio ? 'mio' : ''}`}>
                {!esMio && (
                  <div className="cd-msg-avatar">
                    <Avatar url={avatarUrl} nombre={senderNombre} size={28} />
                  </div>
                )}
                <div className={`cd-burbuja ${esMio ? 'mia' : ''}`}>
                  {!esMio && (
                    <span className="cd-sender-nombre">{senderNombre}</span>
                  )}
                  <p className="cd-content">{msg.content}</p>
                  <div className="cd-burbuja-footer">
                    <span className="cd-hora">{formatHora(msg.created_at)}</span>
                    {esMio && (
                      <span className="cd-leido">{msg.read ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="cd-input-bar">
        <textarea
          ref={inputRef}
          className="cd-input"
          placeholder="Escribí un mensaje..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={2000}
          disabled={enviando}
        />
        <button
          className="cd-btn-enviar"
          onClick={handleEnviar}
          disabled={!texto.trim() || enviando}
          aria-label="Enviar"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

    </div>
  )
}
