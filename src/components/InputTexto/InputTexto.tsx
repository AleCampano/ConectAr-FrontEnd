import './InputTexto.css'

function InputTexto({ placeholder, value, onChange, type = 'text' }: any) {
  return (
    <div className="campo">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default InputTexto
