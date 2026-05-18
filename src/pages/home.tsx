import { useNavigate } from 'react-router-dom'
import './pages.css'

function Home() {
  const navigate = useNavigate()
  const eventos = JSON.parse(localStorage.getItem('eventos') || '[]')

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
        const mapaUrl = ev.lat
          ? `https://www.google.com/maps?q=${ev.lat},${ev.lng}`
          : `https://www.google.com/maps/search/${encodeURIComponent(ev.ubicacion)}`

        return (
          <div key={i} className="card-evento">

            {ev.portada
              ? <img src={ev.portada} alt="portada" className="img-evento" />
              : <div className="img-evento-vacia">📅</div>
            }

            <div className="info-evento">
              <strong>{ev.titulo}</strong>

              <div className="meta-evento">
                <span>📅 {ev.fecha} · {ev.hora}</span>
                {ciudad && <a href={mapaUrl} target="_blank" className="link-mapa">📍 {ciudad}</a>}
                {ev.maxPersonas > 0 && <span>👥 1/{ev.maxPersonas} personas</span>}
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
