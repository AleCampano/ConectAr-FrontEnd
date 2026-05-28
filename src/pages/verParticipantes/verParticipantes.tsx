import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import "./verParticipantes.css"

function VerParticipantes() {
  const navigate = useNavigate()
  const { id } = useParams()

  const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")
  const evento = eventos[Number(id)]

  const [busqueda, setBusqueda] = useState("")
  const [agregados, setAgregados] = useState<string[]>([])

  if (!evento) {
    return (
      <div className="pagina">
        <Header titulo="Participantes" onVolver={() => navigate(-1)} />
        <p className="vacio">Evento no encontrado.</p>
      </div>
    )
  }

  const participantes = evento.participantes || []

  const participantesFiltrados = participantes.filter((participante: any) =>
    participante.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const agregarUsuario = (usuario: string) => {
    if (agregados.includes(usuario)) {
      setAgregados(
        agregados.filter((u) => u !== usuario)
      )
    } else {
      setAgregados([...agregados, usuario])
    }
  }

  return (
    <div className="pagina">
      <Header titulo="Participantes" onVolver={() => navigate(-1)} />

      <div className="buscador">
        <span className="buscador-icono">🔍</span>

        <input
          type="text"
          placeholder="Buscar participante..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {participantesFiltrados.map((participante: any) => (
        <div
          key={participante.usuario}
          className="participante"
        >
          <div className="participante-avatar">
            👤
          </div>

          <div className="participante-info">
            <strong>{participante.nombre}</strong>
            <span>@{participante.usuario}</span>
          </div>

          {agregados.includes(participante.usuario) ? (
            <button
              className="btn-agregado"
              onClick={() =>
                agregarUsuario(participante.usuario)
              }
            >
              Agregado
            </button>
          ) : (
            <button
              className="btn-agregar"
              onClick={() =>
                agregarUsuario(participante.usuario)
              }
            >
              👤+ Agregar
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default VerParticipantes