import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Registrarse from './pages/registrarse'
import Perfil from './pages/perfil'
import CrearEvento from './pages/crearEvento'
import Explorar from './pages/explorar'
import VerParticipantes from './pages/verParticipantes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Registrarse />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/crear-evento" element={<CrearEvento />} />
        <Route path="/participantes/:id" element={<VerParticipantes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
