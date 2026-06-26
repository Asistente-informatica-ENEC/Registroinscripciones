import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../config/admins'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin(user.email)) return <Navigate to="/register" replace />

  return children
}
