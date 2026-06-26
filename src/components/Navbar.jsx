import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../config/admins'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/logo2.png" alt="Logo" className="navbar-logo" />
        Registro de inscripciones
      </Link>
      {user && (
        <div className="navbar-links">
          <Link to="/register">Registrar</Link>
          {isAdmin(user.email) && <Link to="/dashboard">Dashboard</Link>}
          <span className="navbar-user">{user.email}</span>
          <button className="btn-outline" onClick={handleLogout}>Salir</button>
        </div>
      )}
    </nav>
  )
}
