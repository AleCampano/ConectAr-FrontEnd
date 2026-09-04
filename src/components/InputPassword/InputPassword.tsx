import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import './InputPassword.css'

function InputPassword({ placeholder, value, onChange }: any) {
  const [ver, setVer] = useState(false)

  return (
    <div className="campo">
      <input
        type={ver ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
        {ver ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

export default InputPassword
