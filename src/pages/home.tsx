import { useNavigate } from 'react-router-dom'
import './pages.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="pagina">

      <div className="header">
        <h1>ConectAr</h1>
        <button onClick={() => navigate('/perfil')}>👤</button>
      </div>

    </div>
  )
}

export default Home
