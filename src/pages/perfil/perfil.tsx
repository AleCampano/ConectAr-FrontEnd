import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Logro from '../../components/Logro/Logro'
import { obtenerPerfil, actualizarPerfil } from '../../services/auth'
import { obtenerEventosAsistidos, calificarEvento, obtenerMiRating } from '../../services/ratings'
import { obtenerAmigos } from '../../services/friendships'
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

  // Gráfico de asistencia por mes
  const [eventosPorMes, setEventosPorMes] = useState<{ mes: string; count: number }[]>([])

  // Eventos asistidos con rating
  type EventoAsistido = { id: string; title: string; event_date: string; event_type: string }
  const [eventosAsistidos, setEventosAsistidos] = useState<EventoAsistido[]>([])
  const [ratingsMap, setRatingsMap] = useState<Record<string, number | null>>({})
  const [enviandoRating, setEnviandoRating] = useState<string | null>(null)

  // Lista de amigos y modal
  type Amigo = { id: string; full_name: string; username: string; avatar_url: string | null }
  const [amigos, setAmigos] = useState<Amigo[]>([])
  const [mostrarAmigos, setMostrarAmigos] = useState(false)

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

      // Cargar eventos asistidos para el gráfico
      obtenerEventosAsistidos(userId)
        .then(async (eventos: any[]) => {
          // Últimos 12 meses
          const ahora = new Date()
          const meses: { mes: string; count: number }[] = []

          for (let i = 11; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
            const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
            const label = fecha.toLocaleString('es-AR', { month: 'short' })
            const count = eventos.filter((ev: any) => {
              const evFecha = new Date(ev.event_date)
              return (
                evFecha.getFullYear() === fecha.getFullYear() &&
                evFecha.getMonth() === fecha.getMonth()
              )
            }).length
            meses.push({ mes: label, count })
          }

          setEventosPorMes(meses)
          // Actualizar contador de asistidos
          setUsuario(prev => ({ ...prev, asistidos: eventos.length }))
          setEventosAsistidos(eventos)

          // Cargar mi rating previo para cada evento en paralelo
          const resultados = await Promise.allSettled(
            eventos.map((ev: any) => obtenerMiRating(String(ev.id)))
          )
          const nuevoRatingsMap: Record<string, number | null> = {}
          resultados.forEach((res, i) => {
            const evId = String(eventos[i].id)
            nuevoRatingsMap[evId] = res.status === 'fulfilled' ? (res.value?.score ?? null) : null
          })
          setRatingsMap(nuevoRatingsMap)
        })
        .catch(() => {})
      // Cargar amigos
      obtenerAmigos()
        .then((lista: Amigo[]) => {
          setAmigos(lista ?? [])
          setUsuario(prev => ({ ...prev, amigos: (lista ?? []).length }))
        })
        .catch(() => {})
    }
  }, [])

  async function handleFotoSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    const userId = localStorage.getItem('user_id')
    if (!userId) return

    setSubiendoFoto(true)

    try {
      // Redimensionar y comprimir a máximo 400x400 y calidad 0.7
      const base64 = await comprimirImagen(archivo, 400, 0.7)

      // Preview instantáneo
      setUsuario(prev => ({ ...prev, avatarUrl: base64 }))

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

  function comprimirImagen(archivo: File, maxSize: number, calidad: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          // Escalar manteniendo proporción
          if (width > height) {
            if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize }
          } else {
            if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Canvas no disponible')); return }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', calidad))
        }
        img.onerror = reject
        img.src = ev.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(archivo)
    })
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

  async function handleCalificar(eventId: string, score: number) {
    setEnviandoRating(eventId)
    const yaCalificado = ratingsMap[eventId] !== null && ratingsMap[eventId] !== undefined
    try {
      await calificarEvento(eventId, score, yaCalificado)
      setRatingsMap(prev => ({ ...prev, [eventId]: score }))
    } catch (e: any) {
      console.error('[Rating] Error al calificar:', e?.message, '| yaCalificado:', yaCalificado, '| eventId:', eventId, '| score:', score)
      alert(`Error al calificar: ${e?.message ?? 'desconocido'}`)
    } finally {
      setEnviandoRating(null)
    }
  }

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
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setMostrarAmigos(true)}>
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

      {/* Estadísticas de asistencia */}
      <section className="stat-grafico-section">
        <h2>Eventos asistidos por mes</h2>
        {eventosPorMes.every(m => m.count === 0) ? (
          <p className="vacio">Todavía no asististe a ningún evento.</p>
        ) : (
          <div className="stat-grafico">
            {(() => {
              const max = Math.max(...eventosPorMes.map(m => m.count), 1)
              return eventosPorMes.map((m, i) => (
                <div key={i} className="stat-col">
                  <span className="stat-count">{m.count > 0 ? m.count : ''}</span>
                  <div className="stat-barra-bg">
                    <div
                      className="stat-barra-fill"
                      style={{ height: `${(m.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="stat-mes">{m.mes}</span>
                </div>
              ))
            })()}
          </div>
        )}
      </section>

      {/* Eventos asistidos con puntuación */}
      <section>
        <h2>Eventos a los que asististe</h2>
        {eventosAsistidos.length === 0 ? (
          <p className="vacio">Todavía no asististe a ningún evento.</p>
        ) : (
          <div className="asistidos-lista">
            {eventosAsistidos.map(ev => {
              const yaTermino = new Date(ev.event_date) < new Date()
              const miRating = ratingsMap[String(ev.id)] ?? null
              const cargando = enviandoRating === String(ev.id)
              const fecha = new Date(ev.event_date).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric'
              })
              return (
                <div key={ev.id} className="asistido-item">
                  <div className="asistido-info">
                    <p className="asistido-titulo">{ev.title}</p>
                    <p className="asistido-fecha">{fecha}{ev.event_type ? ` · #${ev.event_type}` : ''}</p>
                  </div>
                  {yaTermino ? (
                    <div className={`asistido-estrellas${cargando ? ' cargando' : ''}`}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`estrella${miRating !== null && star <= miRating ? ' activa' : ''}`}
                          onClick={() => !cargando && handleCalificar(String(ev.id), star)}
                          aria-label={`Puntuar con ${star} estrella${star > 1 ? 's' : ''}`}
                          disabled={cargando}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="asistido-pendiente">Próximo</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

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
        {amigos.length === 0 ? (
          <div className="amigos-vacio">
            Todavía no tenés amigos. Buscá personas en Explorar 👋
          </div>
        ) : (
          <div className="amigos-lista">
            {amigos.slice(0, 5).map(a => {
              const iniciales = (a.full_name || a.username || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={a.id} className="amigo-item">
                  {a.avatar_url
                    ? <img src={a.avatar_url} alt={a.full_name} className="amigo-avatar-img" />
                    : <div className="amigo-avatar-ph">{iniciales}</div>
                  }
                  <div className="amigo-info">
                    <span className="amigo-nombre">{a.full_name}</span>
                    <span className="amigo-user">@{a.username}</span>
                  </div>
                </div>
              )
            })}
            {amigos.length > 5 && (
              <button className="amigos-ver-todos" onClick={() => setMostrarAmigos(true)}>
                Ver todos ({amigos.length})
              </button>
            )}
          </div>
        )}
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

      {/* Modal conexiones */}
      {mostrarAmigos && (
        <div className="modal-overlay" onClick={() => setMostrarAmigos(false)}>
          <div className="modal modal-amigos" onClick={e => e.stopPropagation()}>
            <div className="modal-amigos-header">
              <p className="modal-titulo">Mis conexiones ({amigos.length})</p>
              <button className="modal-amigos-close" onClick={() => setMostrarAmigos(false)}>✕</button>
            </div>
            {amigos.length === 0 ? (
              <p className="modal-desc">Todavía no tenés conexiones.</p>
            ) : (
              <div className="amigos-lista amigos-lista-modal">
                {amigos.map(a => {
                  const iniciales = (a.full_name || a.username || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={a.id} className="amigo-item">
                      {a.avatar_url
                        ? <img src={a.avatar_url} alt={a.full_name} className="amigo-avatar-img" />
                        : <div className="amigo-avatar-ph">{iniciales}</div>
                      }
                      <div className="amigo-info">
                        <span className="amigo-nombre">{a.full_name}</span>
                        <span className="amigo-user">@{a.username}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

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