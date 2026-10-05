import { useEffect, useState } from 'react'
import { obtenerAmigos } from '../../services/friendships'
import { enviarMensajeDirecto } from '../../services/mensajesDirectos'
import { obtenerShareEvento } from '../../services/eventos'
import './CompartirSheet.css'

interface CompartirSheetProps {
  eventoId: string
  onClose: () => void
}

interface ShareData {
  url: string
  title: string
  description: string
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
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [copiado, setCopiado] = useState(false)

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
    // Las dos llamadas son independientes: si share falla, los amigos igual se muestran
    const cargarAmigos = obtenerAmigos()
      .then(data => setAmigos(Array.isArray(data) ? data : []))
      .catch(() => setAmigos([]))

    const cargarShare = obtenerShareEvento(eventoId)
      .then(data => setShareData(data))
      .catch(() => { /* share no disponible, usamos fallback */ })

    Promise.all([cargarAmigos, cargarShare])
      .finally(() => setCargando(false))
  }, [eventoId])

  async function handleCompartir(amigoId: string) {
    if (enviandoA.includes(amigoId) || compartidoA.includes(amigoId)) return
    setEnviandoA(prev => [...prev, amigoId])
    const mensaje = shareData
      ? `¡Mirá este evento! ${shareData.title} — ${shareData.url}`
      : `¡Mirá este evento! ID:${eventoId}`
    try {
      await enviarMensajeDirecto(amigoId, mensaje)
      setCompartidoA(prev => [...prev, amigoId])
    } catch { /* silencioso */ } finally {
      setEnviandoA(prev => prev.filter(id => id !== amigoId))
    }
  }

  async function handleCopiarLink() {
    const url = shareData?.url ?? `${window.location.origin}/events/${eventoId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch { /* silencioso */ }
  }

  async function handleWebShare() {
    if (!shareData) return
    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.description,
        url: shareData.url,
      })
    } catch { /* el usuario canceló o no soportado */ }
  }

  const amigosFiltrados = amigos.filter((a: any) =>
    (a.full_name ?? a.username ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const tieneWebShare = typeof navigator !== 'undefined' && !!navigator.share

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

        {/* Acciones rápidas: copiar link y Web Share */}
        <div className="cs-acciones">
          <button className={`cs-accion-btn${copiado ? ' copiado' : ''}`} onClick={handleCopiarLink} aria-label="Copiar link">
            {copiado ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
            <span>{copiado ? '¡Copiado!' : 'Copiar link'}</span>
          </button>

          {tieneWebShare && shareData && (
            <button className="cs-accion-btn" onClick={handleWebShare} aria-label="Compartir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Compartir</span>
            </button>
          )}
        </div>

        {/* Divisor */}
        <div className="cs-divisor">
          <span>o enviá a un amigo</span>
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
            <p className="cs-vacio">Cargando…</p>
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
