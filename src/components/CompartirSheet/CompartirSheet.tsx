import { useEffect, useState } from 'react'
import { obtenerAmigos } from '../../services/friendships'
import { enviarMensajeDirecto } from '../../services/mensajesDirectos'
import './CompartirSheet.css'

interface CompartirSheetProps {
  eventoId: string
  onClose: () => void
}

function Avatar({ url, nombre }: { url: string | null; nombre: string }) {
  const ini = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={nombre} className="cs-avatar-img" />
  return <div className="cs-avatar-ini">{ini}</div>
}

export default function CompartirSheet({ eventoId, onClose }: CompartirSheetProps) {
  const [amigos, setAmigos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [enviandoA, setEnviandoA] = useState<string[]>([])
  const [compartidoA, setCompartidoA] = useState<string[]>([])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    obtenerAmigos()
      .then(data => setAmigos(Array.isArray(data) ? data : []))
      .catch(() => setAmigos([]))
      .finally(() => setCargando(false))
  }, [])

  async function handleCompartir(amigoId: string) {
    if (enviandoA.includes(amigoId) || compartidoA.includes(amigoId)) return
    setEnviandoA(prev => [...prev, amigoId])
    try {
      await enviarMensajeDirecto(amigoId, `¡Mirá este evento! ID:${eventoId}`)
      setCompartidoA(prev => [...prev, amigoId])
    } catch { /* silencioso */ } finally {
      setEnviandoA(prev => prev.filter(id => id !== amigoId))
    }
  }

  const amigosFiltrados = amigos.filter((a: any) =>
    (a.full_name ?? a.username ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="cs-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Compartir evento">
      <div className="cs-sheet" onClick={e => e.stopPropagation()}>

        {/* Handle visual */}
        <div className="cs-handle" />

        {/* Header */}
        <div className="cs-header">
          <span className="cs-titulo">Compartir evento</span>
          <button className="cs-cerrar" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Buscador */}
        <div className="cs-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="cs-search"
            placeholder="Buscar amigo…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            autoFocus
          />
        </div>

        {/* Lista */}
        <div className="cs-lista">
          {cargando ? (
            <p className="cs-vacio">Cargando amigos…</p>
          ) : amigosFiltrados.length === 0 ? (
            <p className="cs-vacio">{amigos.length === 0 ? 'No tenés amigos todavía.' : 'Ningún amigo coincide.'}</p>
          ) : (
            amigosFiltrados.map((amigo: any) => {
              const amigoId = String(amigo.id ?? amigo.user_id ?? '')
              const nombre = amigo.full_name ?? amigo.username ?? 'Usuario'
              const enviado = compartidoA.includes(amigoId)
              const enviando = enviandoA.includes(amigoId)
              return (
                <div key={amigoId} className="cs-item">
                  <Avatar url={amigo.avatar_url ?? null} nombre={nombre} />
                  <span className="cs-nombre">{nombre}</span>
                  <button
                    className={`cs-btn${enviado ? ' enviado' : ''}`}
                    onClick={() => handleCompartir(amigoId)}
                    disabled={enviando || enviado}
                  >
                    {enviando ? '…' : enviado ? '✓ Enviado' : 'Enviar'}
                  </button>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
