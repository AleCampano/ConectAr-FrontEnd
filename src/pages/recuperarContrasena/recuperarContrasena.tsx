import { useState } from 'react'
import { Link } from 'react-router-dom'
import { olvidasteContrasena } from '../../services/auth'
import { useTheme } from '../../context/ThemeContext'
import logoOscuro from '../../assets/LogoNoFondo.png'
import logoClaro from '../../assets/LogoNoFondoBlanco.png'
import './recuperarContrasena.css'

export default function RecuperarContrasena() {
  const { theme } = useTheme()
  const logo = theme === 'light' ? logoClaro : logoOscuro

  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setCargando(true)
    setError('')
    try {
      await olvidasteContrasena(email.trim())
      setEnviado(true)
    } catch {
      setError('No pudimos procesar tu solicitud. Verificá el email e intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pagina centrada">
      <img src={logo} alt="ConectAr" className="logo" />

      {!enviado ? (
        <>
          <div className="rc-header">
            <h1 className="rc-titulo">Recuperar contraseña</h1>
            <p className="rc-subtitulo">
              Ingresá tu email y te enviamos un link para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rc-form">
            <input
              type="email"
              className="rc-input"
              placeholder="Tu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <button
              type="submit"
              className="rc-btn"
              disabled={cargando || !email.trim()}
            >
              {cargando ? 'Enviando…' : 'Enviar link'}
            </button>
            {error && <p className="rc-error">{error}</p>}
          </form>
        </>
      ) : (
        <div className="rc-exito">
          <div className="rc-exito-icono">✉️</div>
          <h2 className="rc-titulo">¡Revisá tu email!</h2>
          <p className="rc-subtitulo">
            Si <strong>{email}</strong> está registrado, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
          </p>
          <p className="rc-subtitulo rc-hint">
            Si no lo ves, revisá la carpeta de spam.
          </p>
        </div>
      )}

      <p className="pie">
        <Link to="/login">← Volver al inicio de sesión</Link>
      </p>
    </div>
  )
}
