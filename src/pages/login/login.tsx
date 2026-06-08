import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputTexto from '../../components/InputTexto/InputTexto'
import InputPassword from '../../components/InputPassword/InputPassword'
import Boton from '../../components/Boton/Boton'
import logo from '../../assets/Logo.png'
import { login } from '../../services/auth'
import './login.css'

function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login({ correo, contrasena })
      navigate('/home')
    } catch {
      setError('Email o contraseña incorrectos.')
    }
  }

  return (
    <div className="pagina centrada">
      <img src={logo} alt="ConectAr" className="logo" />

      <form onSubmit={enviar}>
        <InputTexto type="email" placeholder="Email" value={correo} onChange={setCorreo} />
        <InputPassword placeholder="Contraseña" value={contrasena} onChange={setContrasena} />

        <p className="olvidaste">
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>

        <Boton texto="Iniciar Sesión" tipo="submit" />
        {error && <p className="error-form">{error}</p>}
      </form>

      <p className="pie">
        ¿No tienes cuenta? <Link to="/">Crear usuario</Link>
      </p>
    </div>
  )
}

export default Login
