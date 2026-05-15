import { useNavigate } from 'react-router-dom'
import './pages.css'

const logros = [
  { id: 'primer-evento', icono: '📅', titulo: 'Primer evento', desc: 'Asististe a tu primer evento' },
  { id: 'organizador',   icono: '🗂️', titulo: 'Organizador',   desc: 'Organizaste tu primer evento' },
  { id: 'social-pro',    icono: '🤝', titulo: 'Social Pro',    desc: 'Conecta con 50 personas' },
]

function Perfil() {
  const navigate = useNavigate()

  return (
    <div className="pagina centrada">

      <div className="header">
        <button onClick={() => navigate(-1)}>←</button>
        <h1>Perfil</h1>
        <button>↪</button>
      </div>

      <div className="identidad">
        <div className="avatar">👤</div>
        <strong>AgusA</strong>
        <p>@agusaiello</p>
      </div>

      <div className="stats">
        <div className="card"><strong>0</strong><p>Asistidos</p></div>
        <div className="card"><strong>0</strong><p>Creados</p></div>
        <div className="card"><strong>0</strong><p>Amigos</p></div>
      </div>

      <div className="card nivel">
        <p>⚡ Nivel 1</p>
        <div className="barra"><div /></div>
        <small>100 XP para el siguiente nivel</small>
      </div>

      <div className="seccion">
        <h2>Mis intereses</h2>
        <p className="vacio">Todavía no agregaste intereses.</p>
      </div>

      <div className="seccion">
        <h2>Mis amigos</h2>
        <p className="vacio">Todavía no tenés amigos. Buscá personas en Explorar 👋</p>
      </div>

      <div className="seccion">
        <h2>Logros</h2>
        {logros.map((l) => (
          <div key={l.id} className="logro">
            <p>{l.icono}</p>
            <div>
              <strong>{l.titulo}</strong>
              <p>{l.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Perfil
