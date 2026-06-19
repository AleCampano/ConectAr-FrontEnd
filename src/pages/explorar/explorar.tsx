import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import { listarEventos, borrarEvento, unirseEvento, abandonarEvento, listarPersonas, buscarPersonas } from '../../services/eventos'
import './explorar.css'

const TABS = [
  { id: 'Todos',    label: '🌐 Todos'   },
  { id: 'Eventos',  label: '📅 Eventos' },
  { id: 'Personas', label: '👤 Personas'},
]

const TENDENCIAS = [
  { id: 'deporte',  label: '⚽ Deporte'  },
  { id: 'concierto', label: '🎵 Concierto' },
  { id: 'cultura',  label: '🎭 Cultura'  },
  { id: 'fiesta',   label: '🎉 Fiesta'   },
  { id: 'otro',     label: '✨ Otro'     },
]

function Explorar() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [eventos, setEventos] = useState<any[]>([])
  const [cargandoEventos, setCargandoEventos] = useState(true)
  const [eventosUnidos, setEventosUnidos] = useState<string[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [buscandoPersonas, setBuscandoPersonas] = useState(false)
  const [amigosAgregados, setAmigosAgregados] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    setCargandoEventos(true)
    listarEventos(tendencia || undefined)
      .then(async (data) => {
        setEventos(data)
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
              // ignoramos si falla
            }
          })
        )
        setEventosUnidos(unidos)
      })
      .catch(console.error)
      .finally(() => setCargandoEventos(false))
  }, [tendencia])

  // Búsqueda de personas con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (busqueda.length < 2) {
      setPersonas([])
      return
    }

    setBuscandoPersonas(true)
    debounceRef.current = setTimeout(() => {
      buscarPersonas(busqueda)
        .then(setPersonas)
        .catch(() => setPersonas([]))
        .finally(() => setBuscandoPersonas(false))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [busqueda])

  const eventosFiltrados = eventos.filter(ev => {
    return (
      ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.description.toLowerCase().includes(busqueda.toLowerCase())
    )
  })

  const seleccionarTendencia = (t: string) => {
    setTendencia(prev => (prev === t ? '' : t))
  }

  const handleAgregarAmigo = (id: string) => {
    setAmigosAgregados(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
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
            key={t.id}
            className={t.id === tab ? 'tab tab-activo' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
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
                key={t.id}
                className={tendencia === t.id ? 'tag tag-activo' : 'tag'}
                onClick={() => seleccionarTendencia(t.id)}
              >
                {t.label}
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
          {cargandoEventos ? (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="card-skeleton">
                  <div className="skeleton-titulo" />
                  <div className="skeleton-linea" />
                  <div className="skeleton-linea skeleton-linea-corta" />
                  <div className="skeleton-footer">
                    <div className="skeleton-tag" />
                    <div className="skeleton-btn" />
                  </div>
                </div>
              ))}
            </>
          ) : eventosFiltrados.length === 0 ? (
            <p className="vacio">No hay eventos todavía.</p>
          ) : (
            eventosFiltrados.map(ev => {
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
          )}
        </div>
      )}

      {/* Personas */}
      {mostrarPersonas && (
        <div className="lista">
          {tab !== 'Todos' && <p className="seccion-label">Personas</p>}
          {buscandoPersonas ? (
            <p className="vacio">Buscando...</p>
          ) : busqueda.length < 2 ? (
            <p className="vacio">Escribí al menos 2 caracteres para buscar personas.</p>
          ) : personas.length === 0 ? (
            <p className="vacio">No se encontraron personas.</p>
          ) : (
            personas.map(persona => (
              <div key={persona.id} className="card-persona">
                <div className="persona-avatar">
                  {persona.avatar_url
                    ? <img src={persona.avatar_url} alt={persona.username} />
                    : <div className="avatar-placeholder">👤</div>
                  }
                </div>
                <div className="persona-info">
                  <p className="persona-nombre">{persona.full_name}</p>
                  <p className="persona-username">@{persona.username}</p>
                  {persona.bio && <p className="persona-bio">{persona.bio}</p>}
                </div>
                <button
                  className={amigosAgregados.includes(persona.id) ? 'btn-amigo-agregado' : 'btn-agregar-amigo'}
                  onClick={() => handleAgregarAmigo(persona.id)}
                >
                  {amigosAgregados.includes(persona.id) ? '✅ Agregado' : '➕ Agregar'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Explorar

