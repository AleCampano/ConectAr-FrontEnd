import { createContext, useContext, useState, useCallback } from 'react'
import { listarConversaciones } from '../services/mensajesDirectos'

interface MensajesContextValue {
  mensajesNoLeidos: number
  setMensajesNoLeidos: (n: number) => void
  refrescarMensajes: () => Promise<void>
}

const MensajesContext = createContext<MensajesContextValue>({
  mensajesNoLeidos: 0,
  setMensajesNoLeidos: () => {},
  refrescarMensajes: async () => {},
})

export function MensajesProvider({ children }: { children: React.ReactNode }) {
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0)

  const refrescarMensajes = useCallback(async () => {
    if (!localStorage.getItem('access_token')) return
    try {
      const convs = await listarConversaciones()
      const total = convs.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0)
      setMensajesNoLeidos(total)
    } catch { /* silencioso */ }
  }, [])

  return (
    <MensajesContext.Provider value={{ mensajesNoLeidos, setMensajesNoLeidos, refrescarMensajes }}>
      {children}
    </MensajesContext.Provider>
  )
}

export function useMensajes() {
  return useContext(MensajesContext)
}
