import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEventos, likeEvento, unlikeEvento, obtenerLikes } from '../../services/eventos'
import BottomNav from '../../components/BottomNav/BottomNav'
import EventoPopup from '../../components/EventoPopup/EventoPopup'
import Logo from '../../assets/Logo.png'
import './home.css'

const CATEGORIAS = [
  { id: '',          label: '🔥 Todo'           },
  { id: 'deporte',   label: '⚽ Deporte'         },
  { id: 'concierto', label: '🎵 Música'          },
  { id: 'cultura',   label: '🎭 Cultura'         },
  { id: 'fiesta',    label: '🌙 Salida nocturna' },
  { id: 'otro',      label: '✨ Otros'           },
]

export default function Home() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<any[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState('')
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any | null>(null)
  const [likesMap, setLikesMap] = useState<Record<string, number>>({})
  const [likedEventos, setLikedEventos] = useState<string[]>([])

  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    async function cargarEventos() {
      try {
        const data = await listarEventos()
        setEventos(data)

        // Cargar likes de cada evento en paralelo
        const resultados = await Promise.allSettled(
          data.map((ev: any) => obtenerLikes(String(ev.id)))
        )

        const nuevoLikesMap: Record<string, number> = {}
        const nuevosLikedEventos: string[] = []

        resultados.forEach((res, i) => {
          const evId = String(data[i].id)
          if (res.status === 'fulfilled') {
            const likes: any[] = Array.isArray(res.value) ? res.value : (res.value?.likes ?? [])
            nuevoLikesMap[evId] = likes.length
            if (userId && likes.some((l: any) => String(l.user_id ?? l.id) === userId)) {
              nuevosLikedEventos.push(evId)
            }
          } else {
            nuevoLikesMap[evId] = 0
          }
        })

        setLikesMap(nuevoLikesMap)
        setLikedEventos(nuevosLikedEventos)
      } catch {
        setEventos([])
      }
    }
    cargarEventos()
  }, [userId])

  async function handleLike(e: React.MouseEvent, evId: string) {
    e.stopPropagation()
    if (!localStorage.getItem('access_token')) return

    const yaLiked = likedEventos.includes(evId)
    // Optimistic update
    setLikedEventos(prev => yaLiked ? prev.filter(id => id !== evId) : [...prev, evId])
    setLikesMap(prev => ({ ...prev, [evId]: Math.max(0, (prev[evId] ?? 0) + (yaLiked ? -1 : 1)) }))

    try {
      if (yaLiked) {
        await unlikeEvento(evId)
      } else {
        await likeEvento(evId)
      }
    } catch {
      // Revertir si falla
      setLikedEventos(prev => yaLiked ? [...prev, evId] : prev.filter(id => id !== evId))
      setLikesMap(prev => ({ ...prev, [evId]: Math.max(0, (prev[evId] ?? 0) + (yaLiked ? 1 : -1)) }))
    }
  }

  const eventosFiltrados = categoriaActiva
    ? eventos.filter(ev => ev.event_type === categoriaActiva)
    : eventos

  return (
    <div className="home-wrapper">

      {/* ── Top Bar ── */}
      <header className="home-topbar">
        <button className="topbar-icon-btn" onClick={() => navigate('/perfil')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        </button>

        <img src={Logo} alt="ConectAr" className="topbar-logo" />

          <button
            className="topbar-icon-btn"
            aria-label="Notificaciones"
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission()
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
      </header>

      {/* ── Filtros ── */}
      <div className="home-filtros">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            className={`filtro-chip ${categoriaActiva === cat.id ? 'activo' : ''}`}
            onClick={() => setCategoriaActiva(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Feed ── */}
      <main className="home-feed">
        {eventosFiltrados.length === 0 && (
          <p className="home-vacio">No hay eventos en esta categoría todavía.</p>
        )}

        {eventosFiltrados.map((ev: any) => {
          const esPrivado = ev.accessibility === 'privado'
          const esMio = String(ev.creator_id ?? ev.created_by ?? ev.user_id ?? ev.users?.id ?? '') === String(userId ?? '')
          const mapaUrl = `https://www.google.com/maps/search/${encodeURIComponent(ev.location ?? '')}`
          const creatorNombre = ev.users?.full_name ?? ev.users?.username ?? ev.creator_name ?? ev.username ?? 'Usuario'
          const iniciales = creatorNombre.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

          return (
            <article key={ev.id} className="feed-card" onClick={() => setEventoSeleccionado(ev)} style={{ cursor: 'pointer' }}>

              {/* autor */}
              <div className="card-autor">
                {ev.users?.avatar_url
                  ? <img src={ev.users.avatar_url} alt={creatorNombre} className="autor-avatar autor-avatar-foto" />
                  : <div className="autor-avatar">{iniciales}</div>
                }
                <span className="autor-nombre">{creatorNombre}</span>
                {esMio && <span className="card-badge-mio">Tu evento</span>}
                {esPrivado && (
                  <svg className="privado-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {esMio && (
                  <div className="card-autor-actions" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/crear-evento?editar=${ev.id}`)}>✏️</button>
                  </div>
                )}
              </div>

              {/* contenido */}
              <div className="card-body">
                <h2 className="card-titulo">{ev.title}</h2>
                {ev.description && <p className="card-desc">{ev.description}</p>}

                {ev.image_url && (
                  <img src={ev.image_url} alt="portada" className="card-img" />
                )}

                <div className="card-tags">
                  {ev.event_type && <span className="tag-chip">#{ev.event_type}</span>}
                  {ev.location && (
                    <a 
                      href={mapaUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="tag-chip tag-chip-link"
                      onClick={e => e.stopPropagation()}
                    >
                      📍 {ev.location.split(',')[0]}
                    </a>
                  )}
                </div>

                {ev.invite_only && (
                  <button
                    className="card-accion-btn"
                    onClick={e => { e.stopPropagation(); navigate(`/participantes/${ev.id}`) }}
                  >
                    Invitar amigos
                  </button>
                )}
              </div>

              {/* acciones */}
              <div className="card-acciones" onClick={e => e.stopPropagation()}>
                <button
                  className={`accion-btn${likedEventos.includes(String(ev.id)) ? ' accion-btn-liked' : ''}`}
                  aria-label="Me gusta"
                  onClick={e => handleLike(e, String(ev.id))}
                >
                  <svg viewBox="0 0 24 24" fill={likedEventos.includes(String(ev.id)) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {(likesMap[String(ev.id)] ?? 0) > 0 && (
                    <span className="accion-count">{likesMap[String(ev.id)]}</span>
                  )}
                </button>
                <button className="accion-btn" aria-label="Comentar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <button className="accion-btn" aria-label="Compartir">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                    <polyline points="15 17 20 12 15 7" />
                    <path d="M4 18v-2a4 4 0 0 1 4-4h12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

            </article>
          )
        })}
      </main>

      {/* ── Popup evento ── */}
      {eventoSeleccionado && (
        <EventoPopup
          evento={eventoSeleccionado}
          onClose={() => setEventoSeleccionado(null)}
        />
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav />

    </div>
  )
}