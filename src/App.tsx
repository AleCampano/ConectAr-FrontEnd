import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Registrarse from './pages/registrarse/registrarse'
import Login from './pages/login/login'
import Home from './pages/home/home'
import Perfil from './pages/perfil/perfil'
import CrearEvento from './pages/crearEvento/crearEvento'
import Explorar from './pages/explorar/explorar'
import VerParticipantes from './pages/verParticipantes/verParticipantes'
import Notificaciones from './pages/notificaciones/notificaciones'
import ChatEvento from './pages/chatEvento/chatEvento'

// Wrapper para acceder al chat como página standalone desde /chat/:id
function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  if (!id) return null
  return <ChatEvento eventId={id} onCerrar={() => navigate(-1)} />
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Registrarse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/crear-evento" element={<CrearEvento />} />
          <Route path="/participantes/:id" element={<VerParticipantes />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/chat/:id" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
