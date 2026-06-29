import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Boton from '../../components/Boton/Boton'
import MapaPicker from '../../components/MapaPicker/MapaPicker'
import './crearEvento.css'
import { crearEvento } from '../../services/eventos'
import { buscarDirecciones } from '../../ubicacionApi'

const TIPOS = [
  { label: 'Deporte',        emoji: '⚽', value: 'deporte'   },
  { label: 'Música',          emoji: '🎵', value: 'concierto' },
  { label: 'Cultura',         emoji: '🎭', value: 'cultura'   },
  { label: 'Salida nocturna', emoji: '🌙', value: 'fiesta'    },
  { label: 'Estudio',         emoji: '📚', value: 'otro'      },
  { label: 'Gaming',          emoji: '🎮', value: 'otro'      },
  { label: 'Aire libre',      emoji: '🌿', value: 'otro'      },
]

export default function CrearEvento() {
  const navigate = useNavigate()
  
  // Un solo estado para todo el formulario, simple y directo
  const [form, setForm] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    ubicacion: '',
    descripcion: '',
    tipo: '',
    maxPersonas: '',
    acceso: 'publico',
    portada: ''
  })

  const [error, setError] = useState('')
  const [sugerencias, setSugerencias] = useState<any[]>([])
  const [coordenadas, setCoordenadas] = useState<[number, number] | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)

  // Función simple para actualizar cualquier campo del formulario
  const actualizarCampo = (campo: string, valor: any) => {
    setError('')
    setForm({ ...form, [campo]: valor })
  }

  // En vez de "debounce" complejo, buscamos manualmente al hacer clic en el botón
  const manejarBuscarUbicacion = async () => {
    if (form.ubicacion.length < 3) return
    
    setBuscandoUbicacion(true)
    setSugerencias([])
    
    try {
      const resultados = await buscarDirecciones(form.ubicacion)
      setSugerencias(resultados)
    } catch (err) {
      setError('Error al buscar la dirección')
    } finally {
      setBuscandoUbicacion(false)
    }
  }

  const seleccionarSugerencia = (s: any) => {
    actualizarCampo('ubicacion', s.label)
    setCoordenadas([s.lat, s.lng])
    setSugerencias([]) // Limpiamos la lista una vez seleccionado
  }

  const handleImagen = (e: any) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    const reader = new FileReader()
    reader.onload = () => actualizarCampo('portada', reader.result)
    reader.readAsDataURL(archivo)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    // Validación directa y fácil de leer
    if (!form.titulo || !form.tipo || !form.fecha || !form.hora || !form.ubicacion) {
      setError('Hay campos vacíos obligatorios')
      return
    }

    const tipoSeleccionado = TIPOS.find(t => t.label === form.tipo)

    const nuevoEvento = {
      creator_id: localStorage.getItem('user_id') || '',
      title: form.titulo,
      description: form.descripcion,
      location: form.ubicacion,
      event_date: new Date(`${form.fecha}T${form.hora}:00`).toISOString(),
      event_type: tipoSeleccionado?.value ?? 'otro',
      accessibility: form.acceso,
      max_participants: form.maxPersonas === '' ? null : Number(form.maxPersonas),
      image_url: form.portada || null
    }

    try {
      await crearEvento(nuevoEvento)
      navigate('/home')
    } catch (err: any) {
      setError(err.message || 'Error al crear el evento. Intentá de nuevo.')
    }
  }

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="pagina">
      <Header titulo="Crear evento" onVolver={() => navigate(-1)} />

      <form onSubmit={handleSubmit}>

        {/* Portada */}
        <label className="subir-imagen">
          {form.portada ? (
            <img src={form.portada} alt="portada" className="portada-preview" />
          ) : (
            <div className="subir-imagen-placeholder">
              <span>📷 Agregar foto de portada</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImagen} hidden />
        </label>

        {/* Nombre */}
        <div className="seccion">
          <p className="seccion-label">Nombre del evento *</p>
          <div className="campo">
            <input
              type="text"
              placeholder="Ej: Fútbol 5 en Palermo"
              value={form.titulo}
              onChange={e => actualizarCampo('titulo', e.target.value)}
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="seccion">
          <p className="seccion-label">Descripción</p>
          <textarea
            className="textarea"
            placeholder="Contá de qué se trata..."
            value={form.descripcion}
            onChange={e => actualizarCampo('descripcion', e.target.value)}
            rows={4}
          />
        </div>

        {/* Categoría */}
        <div className="seccion">
          <p className="seccion-label">Categoría *</p>
          <div className="tags">
            {TIPOS.map(t => (
              <button
                key={t.label}
                type="button"
                className={t.label === form.tipo ? 'tag tag-activo' : 'tag'}
                onClick={() => actualizarCampo('tipo', t.label)}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="seccion">
          <div className="fila-dos">
            <div>
              <p className="seccion-label">📅 Fecha *</p>
              <div className="campo">
                <input
                  type="date"
                  value={form.fecha}
                  min={hoy}
                  onChange={e => actualizarCampo('fecha', e.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="seccion-label">Hora</p>
              <div className="campo">
                <input
                  type="time"
                  value={form.hora}
                  onChange={e => actualizarCampo('hora', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="seccion">
          <p className="seccion-label">📍 Ubicación *</p>
          <div className="campo" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ej: Parque Centenario, CABA"
              value={form.ubicacion}
              onChange={e => actualizarCampo('ubicacion', e.target.value)}
              autoComplete="off"
            />
            <button 
              type="button" 
              onClick={manejarBuscarUbicacion}
              className="boton-buscar-ubi" // Podés estilizar este botón en tu CSS
            >
              Buscar
            </button>
          </div>

          {buscandoUbicacion && <p className="cargando-texto">Buscando direcciones...</p>}

          {sugerencias.length > 0 && (
            <div className="sugerencias">
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="sugerencia"
                  onClick={() => seleccionarSugerencia(s)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {coordenadas && <MapaPicker posicion={coordenadas} />}
        </div>

        {/* Máximo de personas */}
        <div className="seccion">
          <p className="seccion-label">👥 Máximo de personas</p>
          <div className="campo">
            <input
              type="number"
              placeholder="Ej: 10"
              value={form.maxPersonas}
              min={1}
              onChange={e => actualizarCampo('maxPersonas', e.target.value)}
            />
          </div>
        </div>

        {/* Accesibilidad */}
        <div className="seccion">
          <p className="seccion-label">Accesibilidad</p>
          <div className="toggle-grupo">
            <button 
              type="button" 
              className={form.acceso === 'publico' ? 'toggle toggle-activo' : 'toggle'} 
              onClick={() => actualizarCampo('acceso', 'publico')}
            >
              🌐 Público
            </button>
            <button 
              type="button" 
              className={form.acceso === 'privado' ? 'toggle toggle-activo' : 'toggle'} 
              onClick={() => actualizarCampo('acceso', 'privado')}
            >
              🔒 Privado
            </button>
          </div>
        </div>

        {error && <p className="error-form">{error}</p>}

        <Boton texto="Publicar evento 🚀" tipo="submit" />

      </form>
    </div>
  )
}