import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputTexto from '../../components/InputTexto/InputTexto'
import InputPassword from '../../components/InputPassword/InputPassword'
import Boton from '../../components/Boton/Boton'
import logoOscuro from '../../assets/LogoNoFondo.png'
import logoClaro from '../../assets/LogoNoFondoBlanco.png'
import './registrarse.css'
import { registrarse, login } from '../../services/auth'
import { useTheme } from '../../context/ThemeContext'

function Registrarse() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const logo = theme === 'light' ? logoClaro : logoOscuro
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [error, setError] = useState('')

  function calcularEdad(fecha: string): number {
    const hoy = new Date()
    const nacimiento = new Date(fecha)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const m = hoy.getMonth() - nacimiento.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return edad
  }

  // Fecha máxima permitida: exactamente 18 años atrás
  const hoy = new Date()
  const maxFecha = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate())
    .toISOString().split('T')[0]

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fechaNacimiento) {
      setError('Ingresá tu fecha de nacimiento.')
      return
    }
    if (calcularEdad(fechaNacimiento) < 18) {
      setError('Tenés que tener al menos 18 años para registrarte.')
      return
    }

    try {
      await registrarse({ nombreCompleto, usuario, correo, contrasena, fechaNacimiento })
      // Login automático para obtener el access_token
      await login({ correo, contrasena })
      navigate('/home')
    } catch {
      setError('No se pudo registrar. Intentá con otros datos.')
    }
  }

  return (
    <div className="pagina centrada">
      <img src={logo} alt="ConectAr" className="logo" />

      <form onSubmit={enviar}>
        <InputTexto placeholder="Nombre completo" value={nombreCompleto} onChange={setNombreCompleto} />
        <InputTexto placeholder="Username" value={usuario} onChange={setUsuario} />
        <InputTexto type="email" placeholder="Email" value={correo} onChange={setCorreo} />
        <InputPassword placeholder="Contraseña" value={contrasena} onChange={setContrasena} />

        {/* Fecha de nacimiento */}
        <div className="reg-fecha-wrapper">
          <label className="reg-fecha-label">Fecha de nacimiento</label>
          <input
            type="date"
            className="reg-fecha-input"
            value={fechaNacimiento}
            max={maxFecha}
            onChange={e => setFechaNacimiento(e.target.value)}
            required
          />
          <p className="reg-fecha-hint">Debés tener 18 años o más para registrarte.</p>
        </div>

        <Boton texto="Continuar" tipo="submit" />
        {error && <p className="error-form">{error}</p>}
      </form>

      <p className="pie">¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link></p>
    </div>
  )
}

export default Registrarse
