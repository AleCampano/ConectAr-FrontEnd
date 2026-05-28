import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './home.css'

function Home() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState(JSON.parse(localStorage.getItem('eventos') || '[]'))

  const borrar = (i: number) => {
    const nuevos = eventos.filter((_: any, idx: number) => idx !== i)
    localStorage.setItem('eventos', JSON.stringify(nuevos))
    setEventos(nuevos)
  }

  return (
    <div className="pagina">

      <div className="header">
        <h1>ConectAr</h1>
        <button onClick={() => navigate('/perfil')}>👤</button>
      </div>

      <button className="boton boton-primario boton-crear" onClick={() => navigate('/crear-evento')}>
        + Crear evento
      </button>

      {eventos.length === 0 && <p className="vacio">Todavía no hay eventos. ¡Creá el primero!</p>}

      {eventos.map((ev: any, i: number) => {
        const ciudad = ev.ubicacion?.split(',')[0] ?? ''
        const esPrivado = ev.acceso === 'privado'
        const mapaUrl = `https://www.google.com/maps/search/${encodeURIComponent(ev.ubicacion)}`

        return (
          <div key={i} className="card-evento">

            {ev.portada
              ? <img src={ev.portada} alt="portada" className="img-evento" />
              : <div className="img-evento-vacia">📅</div>
            }

            <div className="info-evento">
              <div className="info-evento-header">
                <strong>{ev.titulo}</strong>
                <button className="btn-borrar" onClick={() => borrar(i)}>🗑</button>
              </div>

              <div className="meta-evento">
                <span>📅 {ev.fecha} · {ev.hora}</span>
                {ciudad && <a href={mapaUrl} target="_blank" className="link-mapa">📍 {ciudad}</a>}
                {ev.maxPersonas > 0 && (
                  <span
                    className="link-participantes"
                    onClick={() => navigate(`/participantes/${i}`)}
                  >
                    👥 1/{ev.maxPersonas} personas
                  </span>
                )}
              </div>

              <div className="footer-evento">
                {ev.tipo && <span className="tag tag-activo">{ev.tipo}</span>}
                <span className={esPrivado ? 'badge privado' : 'badge publico'}>
                  {esPrivado ? '🔒 Privado' : '🌐 Público'}
                </span>
              </div>
            </div>

          </div>
        )
      })}

    </div>
  )
}

export default Home
