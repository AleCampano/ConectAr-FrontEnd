import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEventos } from '../../services/eventos'
import { useTheme } from '../../context/ThemeContext'
import BottomNav from '../../components/BottomNav/BottomNav'
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

function Home() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [eventos, setEventos] = useState<any[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState('')

  useEffect(() => {
    listarEventos()
      .then(setEventos)
      .catch(() => setEventos([]))
  }, [])

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

        <button className="topbar-icon-btn" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === 'dark' ? (
            /* Sol — modo claro */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Luna — modo oscuro */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
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
          const mapaUrl = `https://www.google.com/maps/search/${encodeURIComponent(ev.location ?? '')}`
          const creatorNombre = ev.users?.full_name ?? ev.users?.username ?? ev.creator_name ?? ev.username ?? 'Usuario'
          const iniciales = creatorNombre
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <article key={ev.id} className="feed-card">

              {/* autor */}
              <div className="card-autor">
                {ev.users?.avatar_url
                  ? <img src={ev.users.avatar_url} alt={creatorNombre} className="autor-avatar autor-avatar-foto" />
                  : <div className="autor-avatar">{iniciales}</div>
                }
                <span className="autor-nombre">{creatorNombre}</span>
                {esPrivado && (
                  <svg className="privado-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
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
                    <a href={mapaUrl} target="_blank" rel="noreferrer" className="tag-chip tag-chip-link">
                      📍 {ev.location.split(',')[0]}
                    </a>
                  )}
                </div>

                {ev.invite_only && (
                  <button
                    className="card-accion-btn"
                    onClick={() => navigate(`/participantes/${ev.id}`)}
                  >
                    Invitar amigos
                  </button>
                )}
              </div>

              {/* acciones */}
              <div className="card-acciones">
                <button className="accion-btn" aria-label="Me gusta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
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

      {/* ── Bottom Nav ── */}
      <BottomNav />

    </div>
  )
}

export default Home
