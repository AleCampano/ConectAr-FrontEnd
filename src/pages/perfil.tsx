import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Logro from '../components/Logro'
import './pages.css'

function Perfil() {
  const navigate = useNavigate()

  return (
    <div className="pagina centrada">

      <Header titulo="Perfil" onVolver={() => navigate(-1)} onAccion={() => {}} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <div className="avatar">👤</div>
        <strong>AgusA</strong>
        <p>@agusaiello</p>
      </div>

      <div className="stats">
        <div className="card cyan"><strong>0</strong><p>Asistidos</p></div>
        <div className="card cyan"><strong>0</strong><p>Creados</p></div>
        <div className="card cyan"><strong>0</strong><p>Amigos</p></div>
      </div>

      <div className="card nivel cyan">
        <p>⚡ Nivel 1</p>
        <div className="barra"><div /></div>
        <small>100 XP para el siguiente nivel</small>
      </div>

      <section className="cyan">
        <h2>Mis intereses</h2>
        <p className="vacio">Todavía no agregaste intereses.</p>
      </section>

      <section className="cyan">
        <h2>Mis amigos</h2>
        <p className="vacio">Todavía no tenés amigos. Buscá personas en Explorar 👋</p>
      </section>

      <section>
        <h2>Logros</h2>
        <Logro icono="📅" titulo="Primer evento" desc="Asististe a tu primer evento" />
        <Logro icono="🗂️" titulo="Organizador" desc="Organizaste tu primer evento" />
        <Logro icono="🤝" titulo="Social Pro" desc="Conecta con 50 personas" />
      </section>

    </div>
  )
}

export default Perfil
