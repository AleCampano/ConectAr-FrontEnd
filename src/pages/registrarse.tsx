import { useState } from 'react'
import { Link } from 'react-router-dom'
import InputTexto from '../components/InputTexto'
import InputPassword from '../components/InputPassword'
import Boton from '../components/Boton'
import logo from '../assets/logo.png'
import './pages.css'

function Registrarse() {
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    console.log({ usuario, correo, contrasena })
  }

  return (
    <div className="pagina centrada">
      <img src={logo} alt="ConectAr" className="logo" />

      <form onSubmit={enviar}>
        <InputTexto placeholder="Username" value={usuario} onChange={setUsuario} />
        <InputTexto type="email" placeholder="Email" value={correo} onChange={setCorreo} />
        <InputPassword placeholder="Contraseña" value={contrasena} onChange={setContrasena} />
        <Boton texto="Continuar" tipo="submit" />
      </form>

      <p className="pie">¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link></p>
    </div>
  )
}

export default Registrarse
