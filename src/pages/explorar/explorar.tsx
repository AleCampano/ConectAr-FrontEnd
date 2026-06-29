import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEventos, borrarEvento, unirseEvento, abandonarEvento, listarPersonas, buscarPersonas } from '../../services/eventos'
import BottomNav from '../../components/BottomNav/BottomNav'
import './explorar.css'

const TENDENCIAS = [
  { id: '',         label: '🌐 Todos'    },
  { id: 'deporte',  label: '⚽ Deporte'  },
  { id: 'concierto', label: '🎵 Música'   },
  { id: 'cultura',   label: '🎭 Cultura'  },
  { id: 'fiesta',    label: '🌙 Salida Nocturna' },
  { id: 'otro',      label: '✨ Otros'    },
]

export default function Explorar() {
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

  const userId = localStorage.getItem('user_id')

  // Carga inicial de eventos al montar la página
  useEffect(() => {
    async function cargarEventos() {
      try {
        setCargandoEventos(true)
        const listaEventos = await listarEventos()
        setEventos(listaEventos)

        // Revisamos a qué eventos ya está unido el usuario
        const unidos: string[] = []
        for (const ev of listaEventos) {
          try {
            const participantes = await listarPersonas(ev.id)
            const yaUnido = participantes.some(
              (p: any) => p.user_id === userId || p.users?.id === userId
            )
            if (yaUnido) unidos.push(ev.id)
          } catch (err) {
            // Si falla uno, ignoramos y seguimos con el resto
          }
        }
        setEventosUnidos(unidos)
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setCargandoEventos(false)
      }
    }

    cargarEventos()
  }, [userId])

  // Función manual para buscar personas (adiós debounce complejo)
  const manejarBuscarPersonas = async () => {
    if (busqueda.length < 2) {
      alert('Escribí al menos 2 caracteres para buscar.')
      return
    }

    setBuscandoPersonas(true)
    try {
      const resultado = await buscarPersonas(busqueda)
      setPersonas(resultado)
    } catch (error) {
      setPersonas([])
    } finally {
      setBuscandoPersonas(false)
    }
  }

  // Filtrado local de eventos en base a lo que se escribe y la categoría elegida
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

  return (
    <div className="exp-wrapper">
      
      {/* Header */}
      <header className="exp-header">
        <h1 className="exp-titulo">Explorar</h1>
      </header>

      {/* Buscador */}
      <div className="exp-buscador" style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder={tab === 'Eventos' ? "🔍 Buscar eventos..." : "🔍 Buscar personas..."}
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {tab === 'Personas' && (
          <button type="button" onClick={manejarBuscarPersonas} className="exp-tab activo">
            Buscar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="exp-tabs">
        <button
          className={`exp-tab ${tab === 'Eventos' ? 'activo' : ''}`}
          onClick={() => { setTab('Eventos'); setBusqueda(''); }}
        >
          📅 Eventos
        </button>
        <button
          className={`exp-tab ${tab === 'Personas' ? 'activo' : ''}`}
          onClick={() => { setTab('Personas'); setBusqueda(''); setPersonas([]); }}
        >
          👥 Personas
        </button>
      </div>

      <div className="exp-scroll">
        
        {/* Categorías (solo se ven en Eventos) */}
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

        {/* Sección: Lista de Eventos */}
        {tab === 'Eventos' && (
          <div className="exp-lista">
            {cargandoEventos ? (
              <p className="exp-vacio">Cargando eventos...</p>
            ) : eventosFiltrados.length === 0 ? (
              <p className="exp-vacio">No se encontraron eventos.</p>
            ) : (
              eventosFiltrados.map(ev => {
                const esMio = ev.created_by === userId || ev.user_id === userId || ev.creator_id === userId
                const yaUnido = eventosUnidos.includes(ev.id)
                const creatorNombre = ev.users?.full_name ?? ev.users?.username ?? ev.creator_name ?? ev.username ?? 'Usuario'
                const iniciales = creatorNombre.slice(0, 2).toUpperCase()

                return (
                  <article key={ev.id} className="exp-card">
                    <div className="exp-card-autor">
                      {ev.users?.avatar_url ? (
                        <img src={ev.users.avatar_url} alt={creatorNombre} className="exp-avatar exp-avatar-foto" />
                      ) : (
                        <div className="exp-avatar">{iniciales}</div>
                      )}
                      <span className="exp-autor-nombre">{creatorNombre}</span>
                      
                      {esMio && (
                        <div className="exp-card-actions">
                          <button onClick={() => navigate(`/crear-evento?editar=${ev.id}`)}>✏️</button>
                          <button onClick={() => handleBorrar(ev.id)}>🗑️</button>
                        </div>
                      )}
                    </div>

                    <div className="exp-card-body">
                      <h2 className="exp-card-titulo">{ev.title}</h2>
                      {ev.description && <p className="exp-card-desc">{ev.description}</p>}
                      {ev.image_url && <img src={ev.image_url} alt="portada" className="exp-card-img" />}
                      <div className="exp-card-tags">
                        {ev.event_type && <span className="exp-tag">#{ev.event_type}</span>}
                      </div>
                    </div>

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

        {/* Sección: Lista de Personas */}
        {tab === 'Personas' && (
          <div className="exp-lista">
            {buscandoPersonas ? (
              <p className="exp-vacio">Buscando personas...</p>
            ) : personas.length === 0 ? (
              <p className="exp-vacio">Escribí el nombre de alguien y dale a Buscar.</p>
            ) : (
              personas.map(persona => {
                const agregado = amigosAgregados.includes(persona.id)
                return (
                  <div key={persona.id} className="exp-card-persona">
                    <div className="exp-persona-avatar">
                      {persona.avatar_url ? <img src={persona.avatar_url} alt={persona.username} /> : <div>👤</div>}
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

      <BottomNav />
    </div>
  )
}