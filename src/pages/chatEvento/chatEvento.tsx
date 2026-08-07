import { useEffect, useRef, useState, useCallback } from 'react'
import { obtenerMensajes, enviarMensaje, eliminarMensaje, ChatMessage } from '../../services/chat'
import './chatEvento.css'

const POLL_INTERVAL = 3000

interface Props {
  eventId: string
  tituloEvento?: string
  onCerrar: () => void
}

export default function ChatEvento({ eventId, tituloEvento, onCerrar }: Props) {
  const miId = localStorage.getItem('user_id') ?? ''

  const [mensajes, setMensajes] = useState<ChatMessage[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargandoInicial, setCargandoInicial] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Desplaza al último mensaje
  const scrollAlFinal = useCallback((suave = true) => {
    bottomRef.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'instant' })
  }, [])

  // Carga mensajes y actualiza solo si hay novedades
  const cargarMensajes = useCallback(async (esInicial = false) => {
    if (!eventId) return
    try {
      const nuevos = await obtenerMensajes(eventId, { limit: 50 })
      setMensajes(prev => {
        const mismoContenido =
          prev.length === nuevos.length &&
          prev.every((m, i) => m.id === nuevos[i].id)
        if (mismoContenido) return prev
        return nuevos
      })
      if (esInicial) setTimeout(() => scrollAlFinal(false), 50)
    } catch {
      // silencioso en polling; solo mostramos error en la carga inicial
      if (esInicial) setError('No se pudo cargar el chat.')
    } finally {
      if (esInicial) setCargandoInicial(false)
    }
  }, [eventId, scrollAlFinal])

  // Carga inicial + arranque del polling
  useEffect(() => {
    cargarMensajes(true)
    intervalRef.current = setInterval(() => cargarMensajes(false), POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [cargarMensajes])

  // Scroll suave cuando llegan mensajes nuevos (no en la carga inicial)
  const primeraVez = useRef(true)
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return }
    scrollAlFinal(true)
  }, [mensajes, scrollAlFinal])

  const handleEnviar = async () => {
    const contenido = texto.trim()
    if (!contenido || enviando || !eventId) return

    setEnviando(true)
    setTexto('')
    try {
      const nuevo = await enviarMensaje(eventId, contenido)
      setMensajes(prev => [...prev, nuevo])
      setTimeout(() => scrollAlFinal(true), 50)
    } catch (e: any) {
      setError(e.message || 'No se pudo enviar el mensaje.')
      setTexto(contenido) // restaura el texto si falló
    } finally {
      setEnviando(false)
      inputRef.current?.focus()
    }
  }

  const handleEliminar = async (msg: ChatMessage) => {
    if (!eventId) return
    // Optimistic remove
    setMensajes(prev => prev.filter(m => m.id !== msg.id))
    try {
      await eliminarMensaje(eventId, msg.id)
    } catch {
      // Revertir si falló
      setMensajes(prev => {
        const existe = prev.some(m => m.id === msg.id)
        if (existe) return prev
        const insertados = [...prev, msg].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        return insertados
      })
      setError('No se pudo eliminar el mensaje.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  const formatHora = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFecha = (iso: string) => {
    const d = new Date(iso)
    const hoy = new Date()
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  // Agrupa mensajes por fecha para mostrar separadores
  const mensajesConFecha: { tipo: 'fecha' | 'mensaje'; valor: string | ChatMessage }[] = []
  let ultimaFecha = ''
  for (const msg of mensajes) {
    const fecha = formatFecha(msg.created_at)
    if (fecha !== ultimaFecha) {
      mensajesConFecha.push({ tipo: 'fecha', valor: fecha })
      ultimaFecha = fecha
    }
    mensajesConFecha.push({ tipo: 'mensaje', valor: msg })
  }

  return (
    <div className="chat-overlay" onClick={onCerrar}>
      <div className="chat-popup" onClick={e => e.stopPropagation()}>

        {/* Header del popup */}
        <div className="chat-popup-header">
          <div className="chat-popup-titulo">
            <span>💬</span>
            <p>{tituloEvento ?? 'Chat del evento'}</p>
          </div>
          <button className="chat-popup-cerrar" onClick={onCerrar} aria-label="Cerrar chat">✕</button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="chat-error" onClick={() => setError(null)}>
            {error} <span>✕</span>
          </div>
        )}

        {/* Lista de mensajes */}
        <div className="chat-lista">
          {cargandoInicial ? (
            <p className="chat-vacio">Cargando mensajes...</p>
          ) : mensajes.length === 0 ? (
            <p className="chat-vacio">Todavía no hay mensajes. ¡Sé el primero en escribir!</p>
          ) : (
            mensajesConFecha.map((item, i) => {
              if (item.tipo === 'fecha') {
                return (
                  <div key={`fecha-${i}`} className="chat-separador-fecha">
                    <span>{item.valor as string}</span>
                  </div>
                )
              }

              const msg = item.valor as ChatMessage
              const esMio = String(msg.user_id) === String(miId) ||
                String(msg.users?.id ?? msg.user?.id ?? msg.sender?.id ?? '') === String(miId)

              const userData = msg.users ?? msg.user ?? msg.sender ?? null
              const autor =
                userData?.full_name ??
                userData?.username ??
                msg.full_name ??
                msg.username ??
                'Usuario'
              const avatarUrl = userData?.avatar_url ?? msg.avatar_url ?? null
              const iniciales = autor.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

              return (
                <div key={msg.id} className={`chat-msg-row${esMio ? ' mio' : ''}`}>
                  {!esMio && (
                    <div className="chat-avatar-wrap">
                      {avatarUrl
                        ? <img src={avatarUrl} alt={autor} className="chat-avatar-img" />
                        : <div className="chat-avatar-ph">{iniciales}</div>
                      }
                    </div>
                  )}
                  <div className="chat-burbuja-wrap">
                    {!esMio && <p className="chat-autor">{autor}</p>}
                    <div className={`chat-burbuja${esMio ? ' chat-burbuja-mia' : ''}`}>
                      <p className="chat-content">{msg.content}</p>
                      <div className="chat-meta">
                        <span className="chat-hora">{formatHora(msg.created_at)}</span>
                        {esMio && (
                          <button
                            className="chat-btn-eliminar"
                            onClick={() => handleEliminar(msg)}
                            aria-label="Eliminar mensaje"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Escribí un mensaje..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={2000}
            disabled={enviando}
          />
          <button
            className="chat-btn-enviar"
            onClick={handleEnviar}
            disabled={!texto.trim() || enviando}
            aria-label="Enviar mensaje"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}
