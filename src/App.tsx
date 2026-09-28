import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { MensajesProvider } from './context/MensajesContext'
import Registrarse from './pages/registrarse/registrarse'
import Login from './pages/login/login'
import Home from './pages/home/home'
import Perfil from './pages/perfil/perfil'
import CrearEvento from './pages/crearEvento/crearEvento'
import Explorar from './pages/explorar/explorar'
import VerParticipantes from './pages/verParticipantes/verParticipantes'
import Notificaciones from './pages/notificaciones/notificaciones'
import ChatEvento from './pages/chatEvento/chatEvento'
import Mensajes from './pages/mensajes/mensajes'
import ChatDirecto from './pages/mensajes/chatDirecto'
import RecuperarContrasena from './pages/recuperarContrasena/recuperarContrasena'
import ResetPassword from './pages/resetPassword/resetPassword'

// Wrapper para acceder al chat como página standalone desde /chat/:id
function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  if (!id) return null
  return <ChatEvento eventId={id} onCerrar={() => navigate(-1)} />
}

// Detecta si la URL raíz tiene un hash de recuperación de contraseña de Supabase
// y redirige a /reset-password preservando el hash
function RootRedirect() {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const type = params.get('type')
  const token = params.get('access_token')

  if (token && type === 'recovery') {
    return <Navigate to={`/reset-password${window.location.hash}`} replace />
  }

  return <Registrarse />
}

function App() {
  return (
    <ThemeProvider>
      <MensajesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/crear-evento" element={<CrearEvento />} />
            <Route path="/participantes/:id" element={<VerParticipantes />} />
            <Route path="/notificaciones" element={<Notificaciones />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/mensajes" element={<Mensajes />} />
            <Route path="/mensajes/:userId" element={<ChatDirecto />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BrowserRouter>
      </MensajesProvider>
    </ThemeProvider>
  )
}

export default App
