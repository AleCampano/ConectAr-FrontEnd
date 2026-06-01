import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarEventos } from '../../services/eventos'
import './home.css'

function Home() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<any[]>([])

  useEffect(() => {
    listarEventos().then(setEventos)
  }, [])

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

      {eventos.map((ev: any) => {
        const ciudad = ev.location?.split(',')[0] ?? ''
        const esPrivado = ev.accessibility === 'privado'
        const mapaUrl = `https://www.google.com/maps/search/${encodeURIComponent(ev.location)}`

        return (
          <div key={ev.id} className="card-evento">

            {ev.image_url
              ? <img src={ev.image_url} alt="portada" className="img-evento" />
              : <div className="img-evento-vacia">📅</div>
            }

            <div className="info-evento">
              <div className="info-evento-header">
                <strong>{ev.title}</strong>
              </div>

              <div className="meta-evento">
                <span>📅 {ev.event_date?.split('T')[0]} · {ev.event_date?.split('T')[1]?.slice(0,5)}</span>
                {ciudad && <a href={mapaUrl} target="_blank" className="link-mapa">📍 {ciudad}</a>}
                {ev.max_participants > 0 && (
                  <span
                    className="link-participantes"
                    onClick={() => navigate(`/participantes/${ev.id}`)}
                  >
                    👥 {ev.max_participants} personas máx.
                  </span>
                )}
              </div>

              <div className="footer-evento">
                {ev.event_type && <span className="tag tag-activo">#{ev.event_type}</span>}
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
