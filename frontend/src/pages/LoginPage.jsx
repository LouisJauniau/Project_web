import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, signup, isAuthenticated } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  // Redirect to intended page if already authenticated, otherwise show login/signup form
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password !== passwordConfirmation) {
          setError('Passwords do not match.')
          setLoading(false)
          return
        }
        await signup({ username, password, passwordConfirmation })
      } else {
        await login(username, password)
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.password_confirmation?.[0] ||
          err.response?.data?.username?.[0] ||
          err.response?.data?.password?.[0] ||
          'Authentication failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card login-card">
      <h2>{mode === 'login' ? 'Login' : 'Sign up'}</h2>
      <div className="row login-mode-switch">
        <button
          type="button"
          className={`btn ${mode === 'login' ? 'btn-primary' : ''}`}
          onClick={() => {
            setMode('login')
            setError('')
          }}
        >
          Login
        </button>
        <button
          type="button"
          className={`btn ${mode === 'signup' ? 'btn-primary' : ''}`}
          onClick={() => {
            setMode('signup')
            setError('')
          }}
        >
          Sign up
        </button>
      </div>
      <p className="muted">
        {mode === 'login'
          ? 'Use your EventHub credentials.'
          : 'Create a viewer account with username and password.'}
      </p>
      <form onSubmit={handleSubmit} className="grid">
        <label>
          Username
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {mode === 'signup' ? (
          <label>
            Confirm password
            <input
              className="input"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
          </label>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      {error ? <p>{error}</p> : null}
    </section>
  )
}
