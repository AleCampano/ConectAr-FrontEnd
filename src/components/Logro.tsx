function Logro({ icono, titulo, desc, desbloqueado = false }: any) {
  return (
    <div className={`logro ${desbloqueado ? 'desbloqueado' : ''}`}>
      <p>{icono}</p>
      <div>
        <strong>{titulo}</strong>
        <p>{desc}</p>
      </div>
    </div>
  )
}

export default Logro
