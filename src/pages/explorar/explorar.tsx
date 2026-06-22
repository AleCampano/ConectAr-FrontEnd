import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEventos, borrarEvento, unirseEvento, abandonarEvento, listarPersonas, buscarPersonas } from '../../services/eventos'
import BottomNav from '../../components/BottomNav/BottomNav'
import './explorar.css'

const TENDENCIAS = [
  { id: '',          label: '🌐 Todos'    },
  { id: 'deporte',   label: '⚽ Deporte'  },
  { id: 'concierto', label: '🎵 Música'   },
  { id: 'cultura',   label: '� Cultura'  },
  { id: 'fiesta',    label: '🌙 Salida Nocturna'  },
  { id: 'otro',      label: '✨ Otros'    },
]

function Explorar() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'Eventos' | 'Personas'>('Eventos')
  const [busqueda, setBusqueda] = useState('')
  const [tendencia, setTendencia] = useState('')
  const [eventos, setEventos] = useState<any[]>([])
  const [cargandoEventos, setCargandoEventos] = useState(true)
  const [eventosUnidos, setEventosUnidos] = useState<string[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [buscandoPersonas, setBuscandoPersonas] = useState(false)
  const [amigosAgregados, setAmigosAgregados] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const userId = localStorage.getItem('user_id')

  useEffect(() => {
    setCargandoEventos(true)
    listarEventos()
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
            } catch { /* ignorar */ }
          })
        )
        setEventosUnidos(unidos)
      })
      .catch(console.error)
      .finally(() => setCargandoEventos(false))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (tab !== 'Personas' || busqueda.length < 2) {
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [busqueda, tab])

  const eventosFiltrados = eventos.filter(ev => {
    const coincideTendencia = !tendencia || ev.event_type === tendencia
    const coincideBusqueda = !busqueda ||
      ev.title?.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.description?.toLowerCase().includes(busqueda.toLowerCase())
    return coincideTendencia && coincideBusqueda
  })

  const handleBorrar = async (id: string) => {
    if (!confirm('¿Seguro que querés borrar este evento?')) return
    try {
      await borrarEvento(id)
      setEventos(prev => prev.filter(ev => ev.id !== id))
    } catch { alert('No se pudo borrar el evento.') }
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
    } catch { alert('No se pudo completar la acción.') }
  }

  return (
    <div className="exp-wrapper">

      {/* ── Header ── */}
      <header className="exp-header">
        <h1 className="exp-titulo">Explorar</h1>
      </header>

      {/* ── Buscador ── */}
      <div className="exp-buscador">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" className="exp-search-icon">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscá eventos, lugares, personas..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button className="exp-clear" onClick={() => setBusqueda('')}>✕</button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="exp-tabs">
        <button
          className={`exp-tab ${tab === 'Eventos' ? 'activo' : ''}`}
          onClick={() => setTab('Eventos')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Eventos
        </button>
        <button
          className={`exp-tab ${tab === 'Personas' ? 'activo' : ''}`}
          onClick={() => setTab('Personas')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Personas
        </button>
      </div>

      <div className="exp-scroll">

        {/* ── Tendencias (solo en Eventos) ── */}
        {tab === 'Eventos' && (
          <>
            <p className="exp-seccion-label">Tendencias en Buenos Aires</p>
            <div className="exp-tendencias">
              {TENDENCIAS.map(t => (
                <button
                  key={t.id}
                  className={`exp-chip ${tendencia === t.id ? 'activo' : ''}`}
                  onClick={() => setTendencia(prev => (t.id !== '' && prev === t.id) ? '' : t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>



          </>
        )}

        {/* ── Feed de Eventos ── */}
        {tab === 'Eventos' && (
          <div className="exp-lista">
            {cargandoEventos ? (
              [1, 2, 3].map(i => (
                <div key={i} className="exp-skeleton">
                  <div className="sk-avatar" />
                  <div className="sk-titulo" />
                  <div className="sk-linea" />
                  <div className="sk-linea sk-corta" />
                </div>
              ))
            ) : eventosFiltrados.length === 0 ? (
              <p className="exp-vacio">No hay eventos todavía.</p>
            ) : (
              eventosFiltrados.map(ev => {
                const esMio = ev.created_by === userId || ev.user_id === userId || ev.creator_id === userId
                const yaUnido = eventosUnidos.includes(ev.id)
                const creatorNombre = ev.users?.full_name ?? ev.users?.username ?? ev.creator_name ?? ev.username ?? 'Usuario'
                const iniciales = creatorNombre
                  .split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <article key={ev.id} className="exp-card">
                    {/* autor */}
                    <div className="exp-card-autor">
                      {ev.users?.avatar_url
                        ? <img src={ev.users.avatar_url} alt={creatorNombre} className="exp-avatar exp-avatar-foto" />
                        : <div className="exp-avatar">{iniciales}</div>
                      }
                      <span className="exp-autor-nombre">{creatorNombre}</span>
                      {esMio && (
                        <div className="exp-card-actions">
                          <button className="exp-btn-icono" onClick={() => navigate(`/crear-evento?editar=${ev.id}`)}>✏️</button>
                          <button className="exp-btn-icono exp-btn-borrar" onClick={() => handleBorrar(ev.id)}>🗑️</button>
                        </div>
                      )}
                    </div>

                    {/* cuerpo */}
                    <div className="exp-card-body">
                      <h2 className="exp-card-titulo">{ev.title}</h2>
                      {ev.description && <p className="exp-card-desc">{ev.description}</p>}
                      {ev.image_url && (
                        <img src={ev.image_url} alt="portada" className="exp-card-img" />
                      )}
                      <div className="exp-card-tags">
                        {ev.event_type && <span className="exp-tag">#{ev.event_type}</span>}
                      </div>
                    </div>

                    {/* footer */}
                    <div className="exp-card-footer">
                      <button className="exp-btn-participantes" onClick={() => navigate(`/participantes/${ev.id}`)}>
                        👥 Ver participantes
                      </button>
                      {!esMio && (
                        <button
                          className={yaUnido ? 'exp-btn-unido' : 'exp-btn-unirse'}
                          onClick={() => handleUnirse(ev.id)}
                        >
                          {yaUnido ? '✅ Unido' : '+ Unirse'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}

        {/* ── Personas ── */}
        {tab === 'Personas' && (
          <div className="exp-lista">
            {buscandoPersonas ? (
              <p className="exp-vacio">Buscando...</p>
            ) : busqueda.length < 2 ? (
              <p className="exp-vacio">Escribí al menos 2 caracteres para buscar personas.</p>
            ) : personas.length === 0 ? (
              <p className="exp-vacio">No se encontraron personas.</p>
            ) : (
              personas.map(persona => {
                const agregado = amigosAgregados.includes(persona.id)
                return (
                  <div key={persona.id} className="exp-card-persona">
                    <div className="exp-persona-avatar">
                      {persona.avatar_url
                        ? <img src={persona.avatar_url} alt={persona.username} />
                        : <div className="exp-avatar-ph">👤</div>
                      }
                    </div>
                    <div className="exp-persona-info">
                      <p className="exp-persona-nombre">{persona.full_name}</p>
                      <p className="exp-persona-user">@{persona.username}</p>
                    </div>
                    <button
                      className={agregado ? 'exp-btn-agregado' : 'exp-btn-agregar'}
                      onClick={() => setAmigosAgregados(prev =>
                        prev.includes(persona.id) ? prev.filter(a => a !== persona.id) : [...prev, persona.id]
                      )}
                    >
                      {agregado ? '✅ Agregado' : '+ Agregar'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav />

    </div>
  )
}

export default Explorar
