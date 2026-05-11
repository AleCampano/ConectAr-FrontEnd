import { useState } from 'react'
import './pages.css'

function Registrarse() {
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)

  function enviarFormulario(e) {
    e.preventDefault()
    // TODO: conectar con el backend
    console.log({ usuario, correo, contrasena })
  }

  return (
    <div className="pagina">

      <p className="logo">conectAr</p>

      <form onSubmit={enviarFormulario}>

        <div className="campo">
          <input
            type="text"
            placeholder="Username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </div>

        <div className="campo">
          <input
            type="email"
            placeholder="Email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        <div className="campo">
          <input
            type={verContrasena ? 'text' : 'password'}
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <button
            type="button"
            className="ojo"
            onClick={() => setVerContrasena(!verContrasena)}
          >
            {verContrasena ? '🚫' : '👁️‍🗨️'}
          </button>
        </div>

        <button type="submit" className="boton">
          Continuar
        </button>

      </form>

    </div>
  )
}

export default Registrarse
