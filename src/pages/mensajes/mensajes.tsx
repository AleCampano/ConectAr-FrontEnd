import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarConversaciones, Conversacion } from '../../services/mensajesDirectos'
import { obtenerAmigos } from '../../services/friendships'
import { useMensajes } from '../../context/MensajesContext'
import BottomNav from '../../components/BottomNav/BottomNav'
import './mensajes.css'

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min} min`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `${hs} h`
  const dias = Math.floor(hs / 24)
  if (dias < 7) return `${dias} d`
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function Avatar({ url, nombre, size = 46 }: { url: string | null; nombre: string; size?: number }) {
  const iniciales = (nombre || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={nombre} className="msj-avatar-img" style={{ width: size, height: size }} />
  return <div className="msj-avatar-ph" style={{ width: size, height: size }}>{iniciales}</div>
}

export default function Mensajes() {
  const navigate = useNavigate()
  const { setMensajesNoLeidos } = useMensajes()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [amigos, setAmigos] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<'mensajes' | 'amigos'>('mensajes')

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        const [convs, amigosData] = await Promise.allSettled([
          listarConversaciones(),
          obtenerAmigos()
        ])
        if (convs.status === 'fulfilled') {
          setConversaciones(convs.value)
          // Actualizar badge global
          const total = convs.value.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0)
          setMensajesNoLeidos(total)
        }
        if (amigosData.status === 'fulfilled') setAmigos(Array.isArray(amigosData.value) ? amigosData.value : [])
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const convsFiltradas = conversaciones.filter(c =>
    (c.user?.full_name ?? c.user?.username ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const amigosFiltrados = amigos.filter(a =>
    (a.full_name ?? a.username ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  // IDs de amigos con conversación activa
  const conIdsConvs = new Set(conversaciones.map(c => String(c.user?.id)))
  const amigosSinConv = amigosFiltrados.filter(a => !conIdsConvs.has(String(a.id ?? a.user_id)))

  return (
    <div className="msj-wrapper">

      {/* Header */}
      <header className="msj-header">
        <h1 className="msj-titulo">Mensajes</h1>
        <button
          className="msj-nuevo-btn"
          onClick={() => setTab(prev => prev === 'amigos' ? 'mensajes' : 'amigos')}
          aria-label="Nuevo mensaje"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </button>
      </header>

      {/* Buscador */}
      <div className="msj-search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" className="msj-search-icon">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="msj-search"
          placeholder={tab === 'mensajes' ? 'Buscar conversación...' : 'Buscar amigo...'}
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="msj-tabs">
        <button className={`msj-tab ${tab === 'mensajes' ? 'activo' : ''}`} onClick={() => setTab('mensajes')}>
          Conversaciones
          {conversaciones.some(c => c.noLeidos > 0) && <span className="msj-tab-dot" />}
        </button>
        <button className={`msj-tab ${tab === 'amigos' ? 'activo' : ''}`} onClick={() => setTab('amigos')}>
          Amigos
        </button>
      </div>

      <div className="msj-scroll">
        {cargando ? (
          <p className="msj-vacio">Cargando...</p>
        ) : tab === 'mensajes' ? (
          <>
            {convsFiltradas.length === 0 ? (
              <div className="msj-vacio-wrap">
                <p className="msj-vacio">No tenés conversaciones todavía.</p>
                <button className="msj-iniciar-btn" onClick={() => setTab('amigos')}>
                  Escribirle a un amigo
                </button>
              </div>
            ) : (
              convsFiltradas.map(conv => (
                <button
                  key={conv.user.id}
                  className="msj-conv-item"
                  onClick={() => navigate(`/mensajes/${conv.user.id}`)}
                >
                  <div className="msj-conv-avatar-wrap">
                    <Avatar url={conv.user.avatar_url} nombre={conv.user.full_name ?? conv.user.username} />
                    {conv.noLeidos > 0 && <span className="msj-conv-badge">{conv.noLeidos}</span>}
                  </div>
                  <div className="msj-conv-info">
                    <div className="msj-conv-top">
                      <span className="msj-conv-nombre">{conv.user.full_name ?? conv.user.username}</span>
                      <span className="msj-conv-tiempo">{tiempoRelativo(conv.ultimaFecha)}</span>
                    </div>
                    <p className={`msj-conv-preview ${conv.noLeidos > 0 ? 'no-leido' : ''}`}>
                      {conv.ultimoEsMio && <span className="msj-preview-tu">Tú: </span>}
                      {conv.ultimoMensaje}
                    </p>
                  </div>
                </button>
              ))
            )}
          </>
        ) : (
          <>
            {amigosSinConv.length === 0 && amigosFiltrados.length === 0 ? (
              <p className="msj-vacio">No tenés amigos agregados.</p>
            ) : (
              <>
                {/* Amigos con conversación */}
                {amigosFiltrados.filter(a => conIdsConvs.has(String(a.id ?? a.user_id))).map(a => (
                  <button
                    key={a.id ?? a.user_id}
                    className="msj-amigo-item"
                    onClick={() => navigate(`/mensajes/${a.id ?? a.user_id}`)}
                  >
                    <Avatar url={a.avatar_url} nombre={a.full_name ?? a.username} />
                    <div className="msj-amigo-info">
                      <span className="msj-amigo-nombre">{a.full_name ?? a.username}</span>
                      <span className="msj-amigo-sub">Ver conversación</span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" className="msj-amigo-arrow">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
                {/* Amigos sin conversación */}
                {amigosSinConv.map(a => (
                  <button
                    key={a.id ?? a.user_id}
                    className="msj-amigo-item"
                    onClick={() => navigate(`/mensajes/${a.id ?? a.user_id}`)}
                  >
                    <Avatar url={a.avatar_url} nombre={a.full_name ?? a.username} />
                    <div className="msj-amigo-info">
                      <span className="msj-amigo-nombre">{a.full_name ?? a.username}</span>
                      <span className="msj-amigo-sub">Iniciar conversación</span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" className="msj-amigo-arrow">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
