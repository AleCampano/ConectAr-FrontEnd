import './Header.css'

function Header({ titulo, onVolver, onAccion, iconoAccion = '↪' }: any) {
  return (
    <div className="header">
      {onVolver ? <button onClick={onVolver}>←</button> : <div />}
      <h1>{titulo}</h1>
      {onAccion ? <button onClick={onAccion}>{iconoAccion}</button> : <div />}
    </div>
  )
}

export default Header
