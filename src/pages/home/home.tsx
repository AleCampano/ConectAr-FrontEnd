import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEventos } from '../../services/eventos'
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
  const [eventos, setEventos] = useState<any[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState('')

  useEffect(() => {
    listarEventos(categoriaActiva || undefined)
      .then(setEventos)
      .catch(() => setEventos([]))
  }, [categoriaActiva])

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

        <button className="topbar-icon-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="26" height="26">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
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
        {eventos.length === 0 && (
          <p className="home-vacio">No hay eventos en esta categoría todavía.</p>
        )}

        {eventos.map((ev: any) => {
          const esPrivado = ev.accessibility === 'privado'
          const mapaUrl = `https://www.google.com/maps/search/${encodeURIComponent(ev.location ?? '')}`
          const iniciales = (ev.creator_name ?? ev.username ?? '?')
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <article key={ev.id} className="feed-card">

              {/* autor */}
              <div className="card-autor">
                <div className="autor-avatar">{iniciales}</div>
                <span className="autor-nombre">{ev.creator_name ?? ev.username ?? 'Usuario'}</span>
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
      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/explorar')} aria-label="Explorar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Explorar</span>
        </button>

        <button className="nav-btn nav-btn-crear" onClick={() => navigate('/crear-evento')} aria-label="Crear evento">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>Crear</span>
        </button>

        <button className="nav-btn" aria-label="Mensajes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <span>Mensajes</span>
        </button>
      </nav>

    </div>
  )
}

export default Home
