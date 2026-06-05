import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputTexto from '../../components/InputTexto/InputTexto'
import InputPassword from '../../components/InputPassword/InputPassword'
import Boton from '../../components/Boton/Boton'
import logo from '../../assets/logo.png'
import './registrarse.css'
import { registrarse } from '../../services/auth'

function Registrarse() {
  const navigate = useNavigate()
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await registrarse({ nombreCompleto, usuario, correo, contrasena })
      // El registro no devuelve token, solo confirmamos que existe el user
      if (data?.user?.id) {
        localStorage.setItem('user_id', data.user.id)
        localStorage.setItem('usuario', JSON.stringify(data.user))
      }
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
        <Boton texto="Continuar" tipo="submit" />
        {error && <p className="error-form">{error}</p>}
      </form>

      <p className="pie">¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link></p>
    </div>
  )
}

export default Registrarse
