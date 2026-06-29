import { useEffect, useState } from 'react'
import { unirseEvento, abandonarEvento, listarPersonas } from '../../services/eventos'
import './EventoPopup.css'

interface EventoPopupProps {
  evento: any
  onClose: () => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  deporte:   '⚽',
  concierto: '🎵',
  cultura:   '🎭',
  fiesta:    '🌙',
  otro:      '✨',
}

function formatFecha(fechaStr: string) {
  if (!fechaStr) return ''
  const d = new Date(fechaStr)
  return d.toLocaleString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function cuposClass(libre: number, total: number): 'ok' | 'pocos' | 'lleno' {
  if (libre <= 0) return 'lleno'
  if (libre / total <= 0.25) return 'pocos'
  return 'ok'
}

export default function EventoPopup({ evento, onClose }: EventoPopupProps) {
  const [participantes, setParticipantes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [uniendose, setUniendose] = useState(false)
  const [desanotando, setDesanotando] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [unido, setUnido] = useState(false)
  const [error, setError] = useState('')
  const [vistaParticipantes, setVistaParticipantes] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (vistaParticipantes) setVistaParticipantes(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, vistaParticipantes])

  useEffect(() => {
    if (!evento?.id) return
    
    async function cargarParticipantes() {
      try {
        setCargando(true)
        const data = await listarPersonas(String(evento.id))
        setParticipantes(data)
        if (userId) {
          setUnido(data.some((p: any) => String(p.user_id ?? p.id) === userId))
        }
      } catch {
        setParticipantes([])
      } finally {
        setCargando(false)
      }
    }
    cargarParticipantes()
  }, [evento?.id, userId])

  async function handleUnirse() {
    if (!localStorage.getItem('access_token')) {
      setError('Necesitás iniciar sesión para unirte.')
      return
    }
    setUniendose(true)
    setError('')
    try {
      await unirseEvento(String(evento.id))
      let nombre = 'Vos'
      let username = ''
      let avatar: string | null = null
      try {
        const raw = localStorage.getItem('usuario')
        if (raw) {
          const u = JSON.parse(raw)
          nombre  = u.full_name ?? u.username ?? 'Vos'
          username = u.username ?? ''
          avatar  = u.avatar_url ?? null
        }
      } catch { /* fallback */ }
      setParticipantes(prev => [
        ...prev,
        {
          user_id: userId,
          users: { full_name: nombre, username, avatar_url: avatar }
        }
      ])
      setUnido(true)
    } catch {
      setError('No se pudo unir al evento. Intentá de nuevo.')
    } finally {
      setUniendose(false)
    }
  }

  async function handleDesanotarse() {
    setDesanotando(true)
    setError('')
    try {
      await abandonarEvento(String(evento.id))
      setParticipantes(prev => prev.filter((p: any) => String(p.user_id ?? p.id) !== userId))
      setUnido(false)
      setConfirmarSalida(false)
    } catch {
      setError('No se pudo desanotar. Intentá de nuevo.')
      setConfirmarSalida(false)
    } finally {
      setDesanotando(false)
    }
  }

  const emoji     = CATEGORY_EMOJI[evento?.event_type] ?? '✨'
  const categoria = evento?.event_type ?? 'otro'
  const esPublico = evento?.accessibility !== 'privado'
  const maxCupos  = evento?.max_participants ?? null
  const ocupados  = participantes.length
  const libres    = maxCupos !== null ? Math.max(0, maxCupos - ocupados) : null
  const pct       = maxCupos ? Math.min(100, Math.round((ocupados / maxCupos) * 100)) : 0
  const colorClass = maxCupos ? cuposClass(libres!, maxCupos) : 'ok'
  const sinCupos  = libres !== null && libres <= 0 && !unido
  const mapaUrl   = `https://www.google.com/maps/search/${encodeURIComponent(evento?.location ?? '')}`

  const participantesFiltrados = participantes.filter((p: any) => {
    const u = p.users || p
    const q = busqueda.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="popup-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="popup-card" onClick={e => e.stopPropagation()}>

        {/* ── Vista principal ── */}
        <div className={`popup-vista popup-vista-main ${vistaParticipantes ? 'popup-vista-oculta' : ''}`}>

          {/* Imagen */}
          <div className="popup-img-wrapper">
            {evento?.image_url
              ? <img src={evento.image_url} alt="portada" className="popup-img" />
              : <div className="popup-img-placeholder">{emoji}</div>
            }
            <button className="popup-close" onClick={onClose} aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="popup-body">

            <span className="popup-badge">{emoji} {categoria.toUpperCase()}</span>
            <h2 className="popup-titulo">{evento?.title}</h2>
            {evento?.description && <p className="popup-desc">{evento.description}</p>}

            {/* Chips */}
            <div className="popup-chips">
              {evento?.event_date && (
                <span className="popup-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatFecha(evento.event_date)}
                </span>
              )}
              {evento?.location && (
                <a href={mapaUrl} target="_blank" rel="noreferrer" className="popup-chip popup-chip-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {evento.location.split(',')[0]}
                </a>
              )}
              <span className="popup-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className={esPublico ? 'popup-publico' : 'popup-privado'}>
                  {esPublico ? 'Público' : 'Privado'}
                </span>
              </span>
            </div>

            {/* Barra de cupos */}
            {maxCupos !== null && (
              <div className="popup-cupos-wrapper">
                <div className="popup-cupos-info">
                  <span className="popup-cupos-label">
                    {cargando ? 'Cargando…' : `${ocupados} de ${maxCupos} anotados`}
                  </span>
                  <span className={`popup-cupos-num ${colorClass}`}>
                    {libres! > 0
                      ? `${libres} cupo${libres === 1 ? '' : 's'} libre${libres === 1 ? '' : 's'}`
                      : 'Sin cupos'}
                  </span>
                </div>
                <div className="popup-cupos-bar-bg">
                  <div className={`popup-cupos-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {/* Participantes — clickeable */}
            {!cargando && participantes.length > 0 && (
              <button
                className="popup-participantes-btn"
                onClick={() => setVistaParticipantes(true)}
              >
                <div className="popup-participantes-izq">
                  <span className="popup-participantes-titulo">
                    Participantes ({participantes.length})
                  </span>
                  <div className="popup-avatares">
                    {participantes.slice(0, 7).map((p: any, i) => {
                      const nombre = p.users?.full_name ?? p.users?.username ?? p.full_name ?? p.username ?? '?'
                      const ini = nombre.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase()
                      return p.users?.avatar_url
                        ? <img key={i} src={p.users.avatar_url} alt={nombre} className="popup-avatar-img" title={nombre} />
                        : <div key={i} className="popup-avatar-ini" title={nombre}>{ini}</div>
                    })}
                    {participantes.length > 7 && (
                      <div className="popup-avatar-mas">+{participantes.length - 7}</div>
                    )}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="popup-participantes-chevron">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {error && <p className="popup-error">{error}</p>}

            {/* Botón acción */}
            {unido ? (
              <>
                <button
                  className="popup-ya-unido"
                  onClick={() => setConfirmarSalida(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width="17" height="17">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Ya estás anotado
                </button>

                {/* Confirm dialog */}
                {confirmarSalida && (
                  <div className="popup-confirm-overlay" onClick={() => setConfirmarSalida(false)}>
                    <div className="popup-confirm" onClick={e => e.stopPropagation()}>
                      <p className="popup-confirm-pregunta">¿Seguro que querés salir del evento?</p>
                      <div className="popup-confirm-acciones">
                        <button
                          className="popup-confirm-cancelar"
                          onClick={() => setConfirmarSalida(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="popup-confirm-salir"
                          disabled={desanotando}
                          onClick={handleDesanotarse}
                        >
                          {desanotando ? 'Saliendo…' : 'Sí, salir'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : sinCupos ? (
              <div className="popup-btn-sin-cupos">🚫 Evento completo — sin cupos disponibles</div>
            ) : (
              <button
                className="popup-btn-unirse"
                onClick={handleUnirse}
                disabled={uniendose || cargando}
              >
                {uniendose ? 'Uniéndose…' : '¡Unirme al evento!'}
              </button>
            )}

          </div>
        </div>

        {/* ── Vista participantes ── */}
        <div className={`popup-vista popup-vista-partic ${vistaParticipantes ? '' : 'popup-vista-oculta'}`}>

          {/* Header */}
          <div className="popup-partic-header">
            <button className="popup-partic-back" onClick={() => { setVistaParticipantes(false); setBusqueda('') }} aria-label="Volver">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="popup-partic-titulo">Participantes ({participantes.length})</span>
            <button className="popup-close popup-close-partic" onClick={onClose} aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Buscador */}
          <div className="popup-partic-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar participante…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="popup-partic-input"
            />
          </div>

          {/* Lista */}
          <div className="popup-partic-lista">
            {participantesFiltrados.length === 0 && (
              <p className="popup-partic-vacio">Ningún participante coincide.</p>
            )}
            {participantesFiltrados.map((p: any, i) => {
              const u = p.users || p
              const nombre = u.full_name ?? u.username ?? 'Usuario'
              const ini = nombre.split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase()
              const esYo = String(p.user_id ?? u.id) === userId
              return (
                <div key={p.user_id ?? u.id ?? i} className="popup-partic-item">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={nombre} className="popup-partic-avatar-img" />
                    : <div className="popup-partic-avatar-ini">{ini}</div>
                  }
                  <div className="popup-partic-info">
                    <span className="popup-partic-nombre">
                      {nombre} {esYo && <span className="popup-partic-yo">(vos)</span>}
                    </span>
                    {u.username && <span className="popup-partic-user">@{u.username}</span>}
                  </div>
                </div>
              )
            })}
          </div>

        </div>

      </div>
    </div>
  )
}