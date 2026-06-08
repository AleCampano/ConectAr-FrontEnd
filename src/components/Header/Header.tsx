import './Header.css'

function Header({ titulo, onVolver, onAccion, iconoAccion = '↪', onAccion2, iconoAccion2 }: any) {
  return (
    <div className="header">
      {onVolver ? <button onClick={onVolver}>←</button> : <div />}
      <h1>{titulo}</h1>
      <div className="header-actions">
        {onAccion && <button onClick={onAccion}>{iconoAccion}</button>}
        {onAccion2 && <button onClick={onAccion2}>{iconoAccion2}</button>}
        {!onAccion && !onAccion2 && <div />}
      </div>
    </div>
  )
}

export default Header
