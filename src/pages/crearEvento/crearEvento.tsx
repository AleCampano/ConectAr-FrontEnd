import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const modoEdicion = searchParams.get('editar') !== null

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Busca automáticamente cuando el usuario deja de escribir por 600ms
  useEffect(() => {
    const texto = form.ubicacion.trim()

    if (texto.length < 3) {
      setSugerencias([])
      setBuscandoUbicacion(false)
      return
    }

    // Mostramos el loader inmediatamente al empezar a escribir
    setBuscandoUbicacion(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const resultados = await buscarDirecciones(texto)
        setSugerencias(resultados)
      } catch {
        setError('Error al buscar la dirección')
      } finally {
        setBuscandoUbicacion(false)
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form.ubicacion])

  // Función simple para actualizar cualquier campo del formulario
  const actualizarCampo = (campo: string, valor: any) => {
    setError('')
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const seleccionarSugerencia = (s: any) => {
    setForm(prev => ({ ...prev, ubicacion: s.label }))
    setCoordenadas([s.lat, s.lng])
    setSugerencias([])
    setBuscandoUbicacion(false)
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
      <Header titulo={modoEdicion ? 'Editar evento' : 'Crear evento'} onVolver={() => navigate(-1)} />

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
          <div className="campo ubicacion-campo">
            <input
              type="text"
              placeholder="Ej: Parque Centenario, CABA"
              value={form.ubicacion}
              onChange={e => actualizarCampo('ubicacion', e.target.value)}
              autoComplete="off"
            />
          </div>

          {buscandoUbicacion && (
            <div className="sugerencias sugerencias-skeleton">
              <div className="sugerencia-skeleton" />
              <div className="sugerencia-skeleton" />
              <div className="sugerencia-skeleton" />
            </div>
          )}

          {!buscandoUbicacion && sugerencias.length > 0 && (
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

        <Boton texto={modoEdicion ? 'Guardar cambios ✅' : 'Publicar evento 🚀'} tipo="submit" />

      </form>
    </div>
  )
}
