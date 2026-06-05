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

  const miId = localStorage.getItem('user_id')

  useEffect(() => {
    if (id) {
      listarPersonas(id).then(setParticipantes).catch(console.error)
    }
  }, [id])

  // La respuesta del back tiene la info del usuario dentro de .users
  const participantesFiltrados = participantes.filter((p: any) => {
    const user = p.users || p
    return (
      user.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(busqueda.toLowerCase())
    )
  })

  const agregarUsuario = (userId: string) => {
    if (agregados.includes(userId)) {
      setAgregados(agregados.filter((u) => u !== userId))
    } else {
      setAgregados([...agregados, userId])
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

      {participantesFiltrados.map((participante: any) => {
        const user = participante.users || participante
        const esYo = participante.user_id === miId || user.id === miId
        return (
          <div key={participante.user_id || user.id} className="participante">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="avatar" className="participante-avatar" />
              : <div className="participante-avatar">👤</div>
            }

            <div className="participante-info">
              <strong>{user.full_name}</strong>
              <span>@{user.username}</span>
            </div>

            {!esYo && (
              agregados.includes(user.id) ? (
                <button className="btn-agregado" onClick={() => agregarUsuario(user.id)}>
                  Agregado
                </button>
              ) : (
                <button className="btn-agregar" onClick={() => agregarUsuario(user.id)}>
                  👤+ Agregar
                </button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

export default VerParticipantes
