import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from './LoadingState'

export default function ProtectedRoute({ children }) {
  // This component is used to protect routes that require authentication
  const { isAuthenticated, loadingAuth } = useAuth()
  const location = useLocation()

  if (loadingAuth) {
    return <LoadingState label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
