import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import './explorar.css'
import { useEffect, useState } from 'react'
import { listarEventos, listarPersonas } from '../../services/eventos'

const TABS = ['Todos', 'Eventos', 'Personas']
const TENDENCIAS = ['Fútbol', 'Música', 'Previas', 'Estudio', 'Cultura']

function Explorar() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [tendencia, setTendencia] = useState('')

const [eventos, setEventos] = useState<any[]>([])
const [personas, setPersonas] = useState<any[]>([])

useEffect(() => {
  async function cargarDatos() {
    const eventosData = await listarEventos()
    const personasData = await listarPersonas()

    setEventos(eventosData)
    setPersonas(personasData)
  }

  cargarDatos()
}, [])

  const eventosFiltrados = eventos.filter(ev => {
    const coincideBusqueda =
      ev.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    const coincideTendencia =
      !tendencia || ev.tags.some((t: string) => t.toLowerCase().includes(tendencia.toLowerCase()))
    return coincideBusqueda && coincideTendencia
  })

  const personasFiltradas = personas.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.usuario.toLowerCase().includes(busqueda.toLowerCase())
  )

  const seleccionarTendencia = (t: string) => {
    setTendencia(prev => (prev === t ? '' : t))
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
            : eventosFiltrados.map(ev => (
                <div key={ev.id} className="card-evento">
                  <div className="card-creador">
                    <div className="avatar-chico">👤</div>
                    <strong>{ev.creador.nombre}</strong>
                  </div>
                  <h2 className="card-titulo">{ev.titulo}</h2>
                  <p className="card-desc">{ev.descripcion}</p>
                  {ev.portada && (
                    <img src={ev.portada} alt="portada" className="card-portada" />
                  )}
                  <div className="card-tags">
                    {ev.tags.map((tag: string) => (
                      <span key={tag} className="tag tag-activo">{tag}</span>
                    ))}
                  </div>
                </div>
              ))
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
