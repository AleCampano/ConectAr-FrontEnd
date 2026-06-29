import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const enHome = pathname === '/home'

  return (
    <nav className="bottom-nav">

      {/* Izquierda: Explorar si estás en Home, Home si estás en Explorar */}
      {enHome ? (
        <button className="nav-btn" onClick={() => navigate('/explorar')} aria-label="Explorar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Explorar</span>
        </button>
      ) : (
        <button className="nav-btn" onClick={() => navigate('/home')} aria-label="Home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>
      )}

      {/* Centro: Crear */}
      <button
        className="nav-btn nav-btn-crear"
        onClick={() => navigate('/crear-evento')}
        aria-label="Crear evento"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span>Crear</span>
      </button>

      {/* Derecha: Mensajes */}
      <button className="nav-btn" aria-label="Mensajes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        <span>Mensajes</span>
      </button>

    </nav>
  )
}