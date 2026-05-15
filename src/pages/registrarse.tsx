import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import './pages.css'

function Registrarse() {
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verPass, setVerPass] = useState(false)

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    console.log({ usuario, correo, contrasena })
  }

  return (
    <div className="pagina centrada">

      <img src={logo} alt="ConectAr" className="logo" />

      <form onSubmit={enviar}>
        <div className="campo">
          <input type="text" placeholder="Username" value={usuario}
            onChange={(e) => setUsuario(e.target.value)} />
          <p>👤</p>
        </div>

        <div className="campo">
          <input type="email" placeholder="Email" value={correo}
            onChange={(e) => setCorreo(e.target.value)} />
          <p>✉️</p>
        </div>

        <div className="campo">
          <input type={verPass ? 'text' : 'password'} placeholder="Contraseña"
            value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          <button type="button" onClick={() => setVerPass(!verPass)}>
            {verPass ? '🙈' : '👁️'}
          </button>
        </div>

        <button type="submit" className="boton">Continuar</button>
      </form>

      <p className="pie">¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link></p>

    </div>
  )
}

export default Registrarse
