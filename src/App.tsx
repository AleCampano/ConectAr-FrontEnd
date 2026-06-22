import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Registrarse from './pages/registrarse/registrarse'
import Login from './pages/login/login'
import Home from './pages/home/home'
import Perfil from './pages/perfil/perfil'
import CrearEvento from './pages/crearEvento/crearEvento'
import Explorar from './pages/explorar/explorar'
import VerParticipantes from './pages/verParticipantes/verParticipantes'

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
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
