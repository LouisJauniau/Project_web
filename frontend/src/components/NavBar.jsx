import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="nav-brand" aria-label="Eventhub dashboard">
        <span className="nav-brand-text">Eventhub</span>
      </NavLink>
      {isAuthenticated ? (
        <nav className="nav-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            Events
          </NavLink>
          <NavLink
            to="/participants"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            Participants
          </NavLink>
          <span className={`role-badge ${user?.is_staff ? 'role-badge-admin' : 'role-badge-viewer'}`}>
            {user?.is_staff ? 'admin' : 'viewer'}
          </span>
          <button type="button" className="btn nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      ) : (
        <nav className="nav-links">
          <NavLink
            to="/login"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            Login
          </NavLink>
        </nav>
      )}
    </nav>
  );
}
