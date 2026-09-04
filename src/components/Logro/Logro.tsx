import { useTheme } from '../../context/ThemeContext'
import logoLogroDark from '../../assets/descarga (1).png'
import './Logro.css'

function Logro({ icono, titulo, desc, desbloqueado = false }: any) {
  const { theme } = useTheme()

  return (
    <div className={`logro ${desbloqueado ? 'desbloqueado' : ''}`}>
      {theme === 'dark' ? (
        <img
          src={logoLogroDark}
          alt={titulo}
          className="logro-img"
        />
      ) : (
        <p className="logro-icono">{icono}</p>
      )}
      <div>
        <strong>{titulo}</strong>
        <p>{desc}</p>
      </div>
    </div>
  )
}

export default Logro
