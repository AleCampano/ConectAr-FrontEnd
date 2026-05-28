import './Boton.css'

function Boton({ texto, tipo = 'button', variante = 'primario', onClick }: any) {
  return (
    <button type={tipo} className={`boton boton-${variante}`} onClick={onClick}>
      {texto}
    </button>
  )
}

export default Boton
