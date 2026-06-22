import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Logro from '../../components/Logro/Logro'
import { obtenerPerfil, actualizarPerfil } from '../../services/auth'
import { useTheme } from '../../context/ThemeContext'
import './perfil.css'

function Perfil() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mostrarConfirmLogout, setMostrarConfirmLogout] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const [usuario, setUsuario] = useState({
    nombre: '',
    username: '',
    avatarUrl: '',
    asistidos: 0,
    creados: 0,
    amigos: 0,
    nivel: 1,
    xp: 0,
    xpFaltante: 200,
    intereses: [] as string[]
  })

  useEffect(() => {
    const userId = localStorage.getItem('user_id')
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}')

    setUsuario(prev => ({
      ...prev,
      nombre: usuarioGuardado.full_name || '',
      username: usuarioGuardado.username || '',
      avatarUrl: usuarioGuardado.avatar_url || ''
    }))

    if (userId) {
      obtenerPerfil(userId)
        .then(data => {
          setUsuario(prev => ({
            ...prev,
            nombre: data.full_name || usuarioGuardado.full_name || '',
            username: data.username || usuarioGuardado.username || '',
            avatarUrl: data.avatar_url || ''
          }))
          localStorage.setItem('usuario', JSON.stringify({ ...usuarioGuardado, ...data }))
        })
        .catch(() => {})
    }
  }, [])

  async function handleFotoSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    const userId = localStorage.getItem('user_id')
    if (!userId) return

    // Convertir a base64 para previsualizar de inmediato
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      // Mostrar preview instantáneo
      setUsuario(prev => ({ ...prev, avatarUrl: base64 }))

      setSubiendoFoto(true)
      try {
        const data = await actualizarPerfil(userId, { avatar_url: base64 })
        const avatarFinal = data.avatar_url || base64
        setUsuario(prev => ({ ...prev, avatarUrl: avatarFinal }))
        const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || '{}')
        localStorage.setItem('usuario', JSON.stringify({ ...usuarioGuardado, avatar_url: avatarFinal }))
      } catch {
        alert('No se pudo guardar la foto. Intentá de nuevo.')
        setUsuario(prev => ({ ...prev, avatarUrl: '' }))
      } finally {
        setSubiendoFoto(false)
      }
    }
    reader.readAsDataURL(archivo)
  }

  function cerrarSesion() {
    localStorage.removeItem('user_id')
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  const inicialAvatar = usuario.nombre
    ? usuario.nombre.charAt(0).toLowerCase()
    : '?'

  return (
    <div className="pagina">

      <Header
        titulo="Perfil"
        onVolver={() => navigate(-1)}
        onAccion={toggleTheme}
        iconoAccion={
          theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )
        }
        onAccion2={() => setMostrarConfirmLogout(true)}
        iconoAccion2={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        }
      />

      {/* Avatar + nombre */}
      <div className="perfil-info">
        <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
          {usuario.avatarUrl ? (
            <img src={usuario.avatarUrl} alt="foto de perfil" className="avatar avatar-foto" />
          ) : (
            <div className="avatar">{inicialAvatar}</div>
          )}
          <div className={`avatar-camara ${subiendoFoto ? 'cargando' : ''}`}>
            {subiendoFoto ? '⏳' : '📷'}
          </div>
        </div>

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFotoSeleccionada}
        />

        <p className="perfil-nombre">{usuario.nombre}</p>
        <p className="perfil-username">@{usuario.username}</p>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="card">
          <strong>{usuario.asistidos}</strong>
          <p>Asistidos</p>
        </div>
        <div className="card">
          <strong>{usuario.creados}</strong>
          <p>Creados</p>
        </div>
        <div className="card">
          <strong>{usuario.amigos}</strong>
          <p>Conexiones</p>
        </div>
      </div>

      {/* Nivel */}
      <div className="card nivel">
        <div className="nivel-header">
          <p className="nivel-titulo">
            <span className="icono">⚡</span>
            Nivel {usuario.nivel}
          </p>
          <p className="nivel-xp">{usuario.xp} XP</p>
        </div>
        <div className="barra">
          <div style={{ width: `${Math.min((usuario.xp / (usuario.xp + usuario.xpFaltante)) * 100, 100)}%` }} />
        </div>
        <small>{usuario.xpFaltante} XP para el siguiente nivel</small>
      </div>

      {/* Intereses */}
      <section>
        <h2>Mis intereses</h2>
        {usuario.intereses.length === 0 ? (
          <button className="intereses-agregar">
            <span>+</span>
            Agregá tus intereses
          </button>
        ) : (
          usuario.intereses.map(interes => (
            <span key={interes}>{interes}</span>
          ))
        )}
      </section>

      {/* Amigos */}
      <section>
        <div className="amigos-header">
          <span className="icono">👥</span>
          <h2>Mis amigos</h2>
          <span className="amigos-badge">{usuario.amigos}</span>
        </div>
        <div className="amigos-vacio">
          Todavía no tenés amigos. Buscá personas en Explorar 👋
        </div>
      </section>

      {/* Logros */}
      <section>
        <h2>Logros</h2>
        <Logro
          icono="🏆"
          titulo="Primer evento"
          desc="Asististe a tu primer evento"
        />
        <Logro
          icono="⭐"
          titulo="Organizador"
          desc="Creaste tu primer evento"
        />
         <Logro
            icono="🤝"
            titulo="Social Pro"
            desc="Conecta con 50 personas"
          />
        </section>

      {/* Modal confirmación logout */}
      {mostrarConfirmLogout && (
        <div className="modal-overlay" onClick={() => setMostrarConfirmLogout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-titulo">¿Cerrar sesión?</p>
            <p className="modal-desc">¿Estás seguro que querés cerrar sesión?</p>
            <div className="modal-acciones">
              <button className="modal-btn cancelar" onClick={() => setMostrarConfirmLogout(false)}>
                Cancelar
              </button>
              <button className="modal-btn confirmar" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    )
}
  export default Perfil