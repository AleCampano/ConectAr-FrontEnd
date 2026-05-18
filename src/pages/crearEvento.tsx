import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import InputTexto from '../components/InputTexto'
import Boton from '../components/Boton'
import { buscarDirecciones } from '../ubicacionApi'
import './pages.css'

const TIPOS = ['#Concierto', '#Deportes', '#Cultura', '#Fiesta']

const INICIAL = {
  titulo: '', fecha: '', hora: '', ubicacion: '',
  descripcion: '', tipo: '', maxPersonas: 0,
  acceso: 'privado', portada: ''
}

function CrearEvento() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INICIAL)
  const [error, setError] = useState('')
  const [sugerencias, setSugerencias] = useState<any[]>([])

  const set = (campo: string) => (valor: any) => {
    setError('') // limpia el error cuando el usuario edita algo
    setForm(f => ({ ...f, [campo]: valor }))
  }

  const buscarDireccion = async (texto: string) => {
    setForm(f => ({ ...f, ubicacion: texto }))
    setError('')
    if (texto.length < 3) { setSugerencias([]); return }
    const data = await buscarDirecciones(texto)
    setSugerencias(data)
  }

  const elegirSugerencia = (s: any) => {
    setForm(f => ({ ...f, ubicacion: s.label }))
    setSugerencias([])
  }

  const handleImagen = (e: any) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    const reader = new FileReader()
    reader.onload = () => set('portada')(reader.result)
    reader.readAsDataURL(archivo)
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const msg = camposFaltantes()
    if (msg) { setError(msg); return }
    const eventos = JSON.parse(localStorage.getItem('eventos') || '[]')
    localStorage.setItem('eventos', JSON.stringify([...eventos, form]))
    navigate('/home')
  }

  const camposFaltantes = () => {
    if (!form.portada)     return 'Falta la imagen de portada'
    if (!form.titulo)      return 'Falta el título'
    if (!form.fecha)       return 'Falta la fecha'
    if (!form.hora)        return 'Falta la hora'
    if (!form.ubicacion)   return 'Falta la ubicación'
    if (!form.descripcion) return 'Falta la descripción'
    if (!form.tipo)        return 'Falta el tipo de evento'
    return null
  }

  const claseTag = (t: string) => t === form.tipo ? 'tag tag-activo' : 'tag'
  const claseAcceso = (v: string) => v === form.acceso ? 'toggle toggle-activo' : 'toggle'

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
            <InputTexto placeholder="Fecha" value={form.fecha} onChange={set('fecha')} type="date" />
            <InputTexto placeholder="Hora" value={form.hora} onChange={set('hora')} type="time" />
          </div>
        </div>

        {/* Ubicación */}
        <div className="seccion">
          <p className="seccion-label">Ubicación</p>
          <div className="campo">
            <input
              placeholder="Escribí una dirección..."
              value={form.ubicacion}
              onChange={e => buscarDireccion(e.target.value)}
              autoComplete="off"
            />
            {sugerencias.length > 0 && (
              <div className="sugerencias">
                {sugerencias.map((s, i) => (
                  <button key={i} type="button" className="sugerencia" onClick={() => elegirSugerencia(s)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              rows={4}
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="seccion">
          <p className="seccion-label">Tipo de evento</p>
          <div className="tags">
            {TIPOS.map(t => (
              <button key={t} type="button" className={claseTag(t)} onClick={() => set('tipo')(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cant. personas */}
        <div className="seccion">
          <p className="seccion-label">Máximo de personas</p>
          <div className="contador">
            <button type="button" onClick={() => set('maxPersonas')(Math.max(0, form.maxPersonas - 1))}>−</button>
            <span>{form.maxPersonas === 0 ? 'Sin límite' : form.maxPersonas}</span>
            <button type="button" onClick={() => set('maxPersonas')(form.maxPersonas + 1)}>+</button>
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
        <Boton texto="Publicar evento" tipo="submit" />

      </form>
    </div>
  )
}

export default CrearEvento
