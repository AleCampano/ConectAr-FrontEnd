import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { listarEventos, borrarEvento, unirseEvento, abandonarEvento, listarPersonas } from '../../services/eventos'
import './explorar.css'

const TABS = ['Todos', 'Eventos', 'Personas']
const TENDENCIAS = ['Fútbol', 'Música', 'Previas', 'Estudio', 'Cultura']

function Explorar() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [eventos, setEventos] = useState<any[]>([])
  const [personas] = useState<any[]>([])
  const [eventosUnidos, setEventosUnidos] = useState<string[]>([])

  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    listarEventos()
      .then(async (data) => {
        setEventos(data)
        // Para cada evento, traemos los participantes y chequeamos si ya estamos unidos
        const unidos: string[] = []
        await Promise.all(
          data.map(async (ev: any) => {
            try {
              const participantes = await listarPersonas(ev.id)
              const yaUnido = participantes.some(
                (p: any) => p.user_id === userId || p.users?.id === userId
              )
              if (yaUnido) unidos.push(ev.id)
            } catch {
              // si falla ignoramos ese evento
            }
          })
        )
        setEventosUnidos(unidos)
      })
      .catch(console.error)
  }, [])

  const eventosFiltrados = eventos.filter(ev => {
    const coincideBusqueda =
      ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.description.toLowerCase().includes(busqueda.toLowerCase())
    const coincideTendencia =
      !tendencia || ev.event_type.toLowerCase().includes(tendencia.toLowerCase())
    return coincideBusqueda && coincideTendencia
  })

  const personasFiltradas = personas.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.usuario.toLowerCase().includes(busqueda.toLowerCase())
  )

  const seleccionarTendencia = (t: string) => {
    setTendencia(prev => (prev === t ? '' : t))
  }

  const handleBorrar = async (id: string) => {
    if (!confirm('¿Seguro que querés borrar este evento?')) return
    try {
      await borrarEvento(id)
      setEventos(prev => prev.filter(ev => ev.id !== id))
    } catch {
      alert('No se pudo borrar el evento.')
    }
  }

  const handleUnirse = async (id: string) => {
    try {
      if (eventosUnidos.includes(id)) {
        await abandonarEvento(id)
        setEventosUnidos(prev => prev.filter(e => e !== id))
      } else {
        await unirseEvento(id)
        setEventosUnidos(prev => [...prev, id])
      }
    } catch {
      alert('No se pudo completar la acción.')
    }
  }

  const mostrarEventos = tab === 'Todos' || tab === 'Eventos'
  const mostrarPersonas = tab === 'Todos' || tab === 'Personas'

  return (
    <div className="pagina">
      <Header titulo="Explorar" onVolver={() => navigate(-1)} />

      {/* Buscador */}
      <div className="buscador">
        <span className="buscador-icono">🔍</span>
        <input
          type="text"
          placeholder="Buscá eventos, lugares, personas..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={t === tab ? 'tab tab-activo' : 'tab'}
            onClick={() => setTab(t)}
          >
            {t === 'Eventos' ? '📅 ' : t === 'Personas' ? '👤 ' : ''}{t}
          </button>
        ))}
      </div>

      {/* Tendencias */}
      {(tab === 'Todos' || tab === 'Eventos') && (
        <>
          <p className="seccion-label">Tendencias en Buenos Aires</p>
          <div className="tendencias">
            {TENDENCIAS.map(t => (
              <button
                key={t}
                className={tendencia === t ? 'tag tag-activo' : 'tag'}
                onClick={() => seleccionarTendencia(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ubicacion-badge">
            📍 Mostrando eventos en Buenos Aires, CABA
          </div>
        </>
      )}

      {/* Eventos */}
      {mostrarEventos && (
        <div className="lista">
          {tab !== 'Todos' && <p className="seccion-label">Eventos</p>}
          {eventosFiltrados.length === 0
            ? <p className="vacio">No hay eventos todavía.</p>
            : eventosFiltrados.map(ev => {
                const esMio = ev.created_by === userId || ev.user_id === userId
                const yaUnido = eventosUnidos.includes(ev.id)
                return (
                  <div key={ev.id} className="card-evento">
                    <div className="card-header">
                      <h2 className="card-titulo">{ev.title}</h2>
                      {esMio && (
                        <div className="card-acciones">
                          <button
                            className="btn-icono"
                            title="Editar evento"
                            onClick={() => navigate(`/crear-evento?editar=${ev.id}`)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icono btn-borrar"
                            title="Borrar evento"
                            onClick={() => handleBorrar(ev.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="card-desc">{ev.description}</p>
                    {ev.image_url && (
                      <img src={ev.image_url} alt="portada" className="card-portada" />
                    )}
                    <div className="card-footer">
                      <div className="card-tags">
                        <span className="tag tag-activo">#{ev.event_type}</span>
                      </div>
                      <div className="card-botones">
                        <button
                          className="btn-participantes"
                          onClick={() => navigate(`/participantes/${ev.id}`)}
                        >
                          👥 Ver participantes
                        </button>
                        {!esMio && (
                          <button
                            className={yaUnido ? 'btn-unido' : 'btn-unirse'}
                            onClick={() => handleUnirse(ev.id)}
                          >
                            {yaUnido ? '✅ Unido' : '➕ Unirse'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* Personas */}
      {mostrarPersonas && (
        <div className="lista">
          {tab !== 'Todos' && <p className="seccion-label">Personas</p>}
          {personasFiltradas.length === 0
            ? <p className="vacio">No hay personas todavía.</p>
            : personasFiltradas.map(p => (
                <div key={p.id} className="card-persona">
                  <div className="avatar-chico">👤</div>
                  <div className="persona-info">
                    <strong>{p.nombre}</strong>
                    <span>@{p.usuario}</span>
                  </div>
                  <button className="btn-agregar">👤+ Agregar</button>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

export default Explorar

