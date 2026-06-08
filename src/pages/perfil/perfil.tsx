import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Logro from '../../components/Logro/Logro'
import { obtenerPerfil } from '../../services/auth'
import './perfil.css'

function Perfil() {
  const navigate = useNavigate()

  const [mostrarConfirmLogout, setMostrarConfirmLogout] = useState(false)

  const [usuario, setUsuario] = useState({
    nombre: '',
    username: '',
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
      username: usuarioGuardado.username || ''
    }))

    if (userId) {
      obtenerPerfil(userId)
        .then(data => {
          setUsuario(prev => ({
            ...prev,
            nombre: data.full_name || usuarioGuardado.full_name || '',
            username: data.username || usuarioGuardado.username || ''
          }))
          localStorage.setItem('usuario', JSON.stringify({ ...usuarioGuardado, ...data }))
        })
        .catch(() => {})
    }
  }, [])

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
        onAccion={() => {/* editar perfil */}}
        iconoAccion="✏️"
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
        <div className="avatar-wrapper">
          <div className="avatar">{inicialAvatar}</div>
          <div className="avatar-camara">📷</div>
        </div>
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