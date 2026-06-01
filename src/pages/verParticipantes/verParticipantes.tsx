import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Header from "../../components/Header/Header"
import { listarPersonas } from "../../services/eventos"
import "./verParticipantes.css"

function VerParticipantes() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [participantes, setParticipantes] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [agregados, setAgregados] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      listarPersonas(id).then(setParticipantes)
    }
  }, [id])

  const participantesFiltrados = participantes.filter((p: any) =>
    p.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const agregarUsuario = (usuario: string) => {
    if (agregados.includes(usuario)) {
      setAgregados(agregados.filter((u) => u !== usuario))
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

      {participantesFiltrados.length === 0 && (
        <p className="vacio">No hay participantes todavía.</p>
      )}

      {participantesFiltrados.map((participante: any) => (
        <div key={participante.id} className="participante">
          <div className="participante-avatar">👤</div>

          <div className="participante-info">
            <strong>{participante.full_name}</strong>
            <span>@{participante.username}</span>
          </div>

          {agregados.includes(participante.username) ? (
            <button className="btn-agregado" onClick={() => agregarUsuario(participante.username)}>
              Agregado
            </button>
          ) : (
            <button className="btn-agregar" onClick={() => agregarUsuario(participante.username)}>
              👤+ Agregar
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default VerParticipantes
