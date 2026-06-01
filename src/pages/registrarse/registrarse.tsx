import { useState } from 'react'
import { Link } from 'react-router-dom'
import InputTexto from '../../components/InputTexto/InputTexto'
import InputPassword from '../../components/InputPassword/InputPassword'
import Boton from '../../components/Boton/Boton'
import logo from '../../assets/logo.png'
import './registrarse.css'
import { registrarse } from '../../services/auth'

function Registrarse() {
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')

  async function enviar(e: React.FormEvent) {
  e.preventDefault()

  await registrarse({
    usuario,
    correo,
    contrasena
  })
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
