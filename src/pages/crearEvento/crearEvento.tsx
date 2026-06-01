import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import InputTexto from '../../components/InputTexto/InputTexto'
import Boton from '../../components/Boton/Boton'
import './crearEvento.css'
import { crearEvento } from '../../services/eventos'

const TIPOS = ['#Concierto', '#Deportes', '#Cultura', '#Fiesta']

const INICIAL = {
  titulo: '', 
  fecha: '', 
  hora: '', 
  ubicacion: '',
  descripcion: '',
   tipo: '', 
   maxPersonas: 0,
  acceso: 'privado', 
  portada: ''
}

function CrearEvento() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INICIAL)
  const [error, setError] = useState('')

  const set = (campo: string) => (valor: any) => {
    setError('')
    setForm(f => ({ ...f, [campo]: valor }))
  }

  const handleImagen = (e: any) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const reader = new FileReader()
    reader.onload = () => set('portada')(reader.result)
    reader.readAsDataURL(archivo)
  }

  const handleSubmit = async (e: any) => {
  e.preventDefault()

  const msg = camposFaltantes()

  if (msg) {
    setError(msg)
    return
  }

  const nuevoEvento = {
    title: form.titulo,
    description: form.descripcion,
    location: form.ubicacion,
    event_date: `${form.fecha}T${form.hora}:00`,
    event_type: form.tipo.replace('#', '').toLowerCase(),
    accessibility: form.acceso,
    max_participants: form.maxPersonas === 0 ? null : form.maxPersonas,
    image_url: form.portada || null
  }

  await crearEvento(nuevoEvento)

  navigate('/home')
}

  const camposFaltantes = () => {
    if (!form.portada)     return 'Hay campos vacios'
    if (!form.titulo)      return 'Hay campos vacios'
    if (!form.fecha)       return 'Hay campos vacios'
    if (!form.hora)        return 'Hay campos vacios'
    if (!form.ubicacion)   return 'Hay campos vacios'
    if (!form.descripcion) return 'Hay campos vacios'
    if (!form.tipo)        return 'Hay campos vacios'
    return null
  }

  const sumar = () => set('maxPersonas')(form.maxPersonas + 1)
  const restar = () => set('maxPersonas')(Math.max(0, form.maxPersonas - 1))
  const labelPersonas = form.maxPersonas === 0 ? 'Sin límite' : form.maxPersonas
  const claseTag = (t: string) => t === form.tipo ? 'tag tag-activo' : 'tag'
  const claseAcceso = (v: string) => v === form.acceso ? 'toggle toggle-activo' : 'toggle'
  const setAcceso = (v: string) => () => set('acceso')(v)
  const setTipo = (t: string) => () => set('tipo')(t)

  const hoy = new Date().toISOString().split('T')[0]
  const ahora = new Date().toTimeString().slice(0, 5)
  const horaMin = form.fecha === hoy ? ahora : ''

  return (
    <div className="pagina">
      <Header titulo="Crear evento" onVolver={() => navigate(-1)} onAccion={() => {}} />

      <form onSubmit={handleSubmit}>

        {/* Portada */}
        <label className="subir-imagen">
          {form.portada
            ? <img src={form.portada} alt="portada" className="portada-preview" />
            : <div className="subir-imagen-placeholder">
                <span className="subir-imagen-icono">📷</span>
                <span>Subir imagen de portada</span>
              </div>
          }
          <input type="file" accept="image/*" onChange={handleImagen} hidden />
        </label>

        {/* Datos */}
        <div className="seccion">
          <InputTexto placeholder="Título del evento" value={form.titulo} onChange={set('titulo')} />
          <div className="fila-dos">
            <div className="campo">
              <input type="date" value={form.fecha} min={hoy} onChange={e => set('fecha')(e.target.value)} />
            </div>
            <div className="campo">
              <input type="time" value={form.hora} min={horaMin} onChange={e => set('hora')(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="seccion">
          <p className="seccion-label">Ubicación</p>
          <InputTexto placeholder="Ej: Av. Corrientes 1234, Buenos Aires" value={form.ubicacion} onChange={set('ubicacion')} />
        </div>

        {/* Descripción */}
        <div className="seccion">
          <p className="seccion-label">Descripción</p>
          <div className="campo">
            <textarea
              placeholder="Contá de qué se trata el evento..."
              value={form.descripcion}
              onChange={e => set('descripcion')(e.target.value)}
              className="textarea"
              rows={5}
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="seccion">
          <p className="seccion-label">Tipo de evento</p>
          <div className="tags">
            {TIPOS.map(t => (
              <button key={t} type="button" className={claseTag(t)} onClick={setTipo(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cant. personas */}
        <div className="seccion">
          <p className="seccion-label">Máximo de personas</p>
          <div className="contador">
            <button type="button" onClick={restar}>−</button>
            <span>{labelPersonas}</span>
            <button type="button" onClick={sumar}>+</button>
          </div>
        </div>

        {/* Accesibilidad */}
        <div className="seccion">
          <p className="seccion-label">Accesibilidad</p>
          <div className="toggle-grupo">
            <button type="button" className={claseAcceso('publico')} onClick={setAcceso('publico')}>🌐 Público</button>
            <button type="button" className={claseAcceso('privado')} onClick={setAcceso('privado')}>🔒 Privado</button>
          </div>
        </div>

        {error && <p className="error-form">{error}</p>}
        <Boton texto="Publicar evento" tipo="submit" />

      </form>
    </div>
  )
}

export default CrearEvento
