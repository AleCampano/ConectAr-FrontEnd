import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Boton from '../../components/Boton/Boton'
import './crearEvento.css'
import { crearEvento } from '../../services/eventos'
import { buscarDirecciones } from '../../ubicacionApi'

const TIPOS = [
  { label: 'Deporte',         emoji: '⚽', value: 'deporte'   },
  { label: 'Música',          emoji: '🎵', value: 'concierto' },
  { label: 'Cultura',         emoji: '🎭', value: 'cultura'   },
  { label: 'Salida nocturna', emoji: '🌙', value: 'fiesta'    },
  { label: 'Estudio',         emoji: '📚', value: 'otro'      },
  { label: 'Gaming',          emoji: '🎮', value: 'otro'      },
  { label: 'Aire libre',      emoji: '🌿', value: 'otro'      },
]

const INICIAL = {
  titulo: '',
  fecha: '',
  hora: '',
  ubicacion: '',
  descripcion: '',
  tipo: '',
  maxPersonas: '',
  acceso: 'publico',
  portada: ''
}

function CrearEvento() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INICIAL)
  const [error, setError] = useState('')
  const [sugerencias, setSugerencias] = useState<{ label: string }[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = (campo: string) => (valor: any) => {
    setError('')
    setForm(f => ({ ...f, [campo]: valor }))
  }

  const handleUbicacionChange = (valor: string) => {
    set('ubicacion')(valor)
    setSugerencias([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (valor.length < 3) return
    debounceRef.current = setTimeout(async () => {
      const resultados = await buscarDirecciones(valor)
      setSugerencias(resultados)
    }, 400)
  }

  const seleccionarSugerencia = (label: string) => {
    set('ubicacion')(label)
    setSugerencias([])
  }

  const handleImagen = (e: any) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const reader = new FileReader()
    reader.onload = () => set('portada')(reader.result)
    reader.readAsDataURL(archivo)
  }

  const camposFaltantes = () => {
    if (!form.titulo)      return 'Hay campos vacíos'
    if (!form.descripcion) return 'Hay campos vacíos'
    if (!form.tipo)        return 'Hay campos vacíos'
    if (!form.fecha)       return 'Hay campos vacíos'
    if (!form.hora)        return 'Hay campos vacíos'
    if (!form.ubicacion)   return 'Hay campos vacíos'
    return null
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const msg = camposFaltantes()
    if (msg) { setError(msg); return }

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

  const claseTag = (t: string) => t === form.tipo ? 'tag tag-activo' : 'tag'
  const claseAcceso = (v: string) => v === form.acceso ? 'toggle toggle-activo' : 'toggle'
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="pagina">
      <Header titulo="Crear evento" onVolver={() => navigate(-1)} />

      <form onSubmit={handleSubmit}>

        {/* Portada */}
        <label className="subir-imagen">
          {form.portada
            ? <img src={form.portada} alt="portada" className="portada-preview" />
            : <div className="subir-imagen-placeholder">
                <div className="subir-imagen-icono">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <span>Agregar foto de portada</span>
              </div>
          }
          <input type="file" accept="image/*" onChange={handleImagen} hidden />
        </label>

        {/* Nombre */}
        <div className="seccion">
          <p className="seccion-label">Nombre del evento <span className="requerido">*</span></p>
          <div className="campo">
            <input
              type="text"
              placeholder="Ej: Fútbol 5 en Palermo"
              value={form.titulo}
              onChange={e => set('titulo')(e.target.value)}
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
            onChange={e => set('descripcion')(e.target.value)}
            rows={4}
          />
        </div>

        {/* Categoría */}
        <div className="seccion">
          <p className="seccion-label">Categoría <span className="requerido">*</span></p>
          <div className="tags">
            {TIPOS.map(t => (
              <button
                key={t.label}
                type="button"
                className={claseTag(t.label)}
                onClick={() => set('tipo')(t.label)}
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
      <p className="seccion-label">📅 Fecha <span className="requerido">*</span></p>
      <div className="campo">
        <input
          type="date"
          value={form.fecha}
          min={hoy}
          onChange={e => set('fecha')(e.target.value)}
        />
      </div>
    </div>
    <div>
      <p className="seccion-label">Hora</p>
      <div className="campo">
        <input
          type="time"
          value={form.hora}
          onChange={e => set('hora')(e.target.value)}
        />
      </div>
    </div>
  </div>
</div>

        {/* Ubicación */}
        <div className="seccion">
          <p className="seccion-label"><span>📍</span> Ubicación <span className="requerido">*</span></p>
          <div className="campo">
            <input
              type="text"
              placeholder="Ej: Parque Centenario, CABA"
              value={form.ubicacion}
              onChange={e => handleUbicacionChange(e.target.value)}
              autoComplete="off"
            />
          </div>
          {sugerencias.length > 0 && (
            <div className="sugerencias">
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="sugerencia"
                  onClick={() => seleccionarSugerencia(s.label)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Máximo de personas */}
        <div className="seccion">
          <p className="seccion-label"><span>👥</span> Máximo de personas</p>
          <div className="campo">
            <input
              type="number"
              placeholder="Ej: 10"
              value={form.maxPersonas}
              min={1}
              onChange={e => set('maxPersonas')(e.target.value)}
            />
          </div>
        </div>

        {/* Accesibilidad */}
        <div className="seccion">
          <p className="seccion-label">Accesibilidad</p>
          <div className="toggle-grupo">
            <button type="button" className={claseAcceso('publico')} onClick={() => set('acceso')('publico')}>🌐 Público</button>
            <button type="button" className={claseAcceso('privado')} onClick={() => set('acceso')('privado')}>🔒 Privado</button>
          </div>
        </div>

        {error && <p className="error-form">{error}</p>}

        <Boton texto="Publicar evento 🚀" tipo="submit" />

      </form>
    </div>
  )
}

export default CrearEvento