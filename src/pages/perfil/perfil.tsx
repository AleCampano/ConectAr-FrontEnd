  import { useNavigate } from 'react-router-dom'
  import Header from '../../components/Header/Header'
  import Logro from '../../components/Logro/Logro'
  import './perfil.css'

  function Perfil() {
    const navigate = useNavigate()

    const usuario = {
      nombre: 'Alejo',
      username: 'ale',
      asistidos: 0,
      creados: 0,
      amigos: 0,
      nivel: 1,
      xpFaltante: 100,
      intereses: []
    }


    return (
      <div className="pagina centrada">

        <Header
          titulo="Perfil"
          onVolver={() => navigate(-1)}
        />

        <div className="perfil-info">
          <div className="avatar">👤</div>
          <strong>{usuario.nombre}</strong>
          <p>@{usuario.username}</p>
        </div>

        <div className="stats">
          <div className="card cyan">
            <strong>{usuario.asistidos}</strong>
            <p>Asistidos</p>
          </div>

          <div className="card cyan">
            <strong>{usuario.creados}</strong>
            <p>Creados</p>
          </div>

          <div className="card cyan">
            <strong>{usuario.amigos}</strong>
            <p>Amigos</p>
          </div>
        </div>

        <div className="card nivel cyan">
          <p>⚡ Nivel {usuario.nivel}</p>
          <div className="barra">
            <div />
          </div>
          <small>
            {usuario.xpFaltante} XP para el siguiente nivel
          </small>
        </div>

        <section className="cyan">
          <h2>Mis intereses</h2>

          {usuario.intereses.length === 0 ? (
            <p className="vacio">
              Todavía no agregaste intereses.
            </p>
          ) : (
            usuario.intereses.map(interes => (
              <span key={interes}>{interes}</span>
            ))
          )}
        </section>

        <section className="cyan">
          <h2>Mis amigos</h2>
          <p className="vacio">
            Todavía no tenés amigos. Buscá personas en Explorar 👋
          </p>
        </section>

        <section>
          <h2>Logros</h2>

          <Logro
            icono="📅"
            titulo="Primer evento"
            desc="Asististe a tu primer evento"
          />

          <Logro
            icono="🗂️"
            titulo="Organizador"
            desc="Organizaste tu primer evento"
          />

          <Logro
            icono="🤝"
            titulo="Social Pro"
            desc="Conecta con 50 personas"
          />
        </section>

      </div>
    )
  }

  export default Perfil