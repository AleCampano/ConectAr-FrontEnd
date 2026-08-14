import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '../../services/auth'
import { useTheme } from '../../context/ThemeContext'
import logoOscuro from '../../assets/LogoNoFondo.png'
import logoClaro from '../../assets/LogoNoFondoBlanco.png'
import './resetPassword.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const logo = theme === 'light' ? logoClaro : logoOscuro

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tokenInvalido, setTokenInvalido] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarPass, setMostrarPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  // Leer el token del hash al montar
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get('access_token')
    const type = params.get('type')

    if (!token || type !== 'recovery') {
      setTokenInvalido(true)
      return
    }
    setAccessToken(token)
    // Limpiar el hash de la URL por seguridad
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!accessToken) return

    setCargando(true)
    try {
      await resetPassword(accessToken, newPassword)
      setExito(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cambiar la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pagina centrada">
      <img src={logo} alt="ConectAr" className="logo" />

      {/* Token inválido o expirado */}
      {tokenInvalido && (
        <div className="rp-estado">
          <span className="rp-estado-icono">⚠️</span>
          <h2 className="rp-titulo">Link inválido o expirado</h2>
          <p className="rp-subtitulo">
            Este link ya no es válido. Solicitá uno nuevo desde la pantalla de login.
          </p>
          <button className="rp-btn" onClick={() => navigate('/recuperar-contrasena')}>
            Solicitar nuevo link
          </button>
        </div>
      )}

      {/* Éxito */}
      {exito && (
        <div className="rp-estado">
          <span className="rp-estado-icono">✅</span>
          <h2 className="rp-titulo">¡Contraseña actualizada!</h2>
          <p className="rp-subtitulo">
            Tu contraseña fue cambiada correctamente. Te redirigimos al login…
          </p>
        </div>
      )}

      {/* Formulario */}
      {!tokenInvalido && !exito && (
        <>
          <div className="rp-header">
            <h1 className="rp-titulo">Nueva contraseña</h1>
            <p className="rp-subtitulo">Ingresá tu nueva contraseña para recuperar el acceso.</p>
          </div>

          <form onSubmit={handleSubmit} className="rp-form">
            <div className="rp-input-wrap">
              <input
                type={mostrarPass ? 'text' : 'password'}
                className="rp-input"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoFocus
                minLength={6}
              />
              <button
                type="button"
                className="rp-toggle-pass"
                onClick={() => setMostrarPass(p => !p)}
                aria-label={mostrarPass ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarPass ? '🙈' : '👁'}
              </button>
            </div>

            <input
              type={mostrarPass ? 'text' : 'password'}
              className="rp-input"
              placeholder="Confirmar contraseña"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              minLength={6}
            />

            <button
              type="submit"
              className="rp-btn"
              disabled={cargando || !newPassword || !confirmar}
            >
              {cargando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>

            {error && <p className="rp-error">{error}</p>}
          </form>
        </>
      )}
    </div>
  )
}
