import { useState } from 'react'

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
      <button type="button" onClick={() => setVer(!ver)}>
        {ver ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

export default InputPassword
