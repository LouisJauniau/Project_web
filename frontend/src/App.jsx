import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import EventDetailsPage from './pages/EventDetailsPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import ParticipantsPage from './pages/ParticipantsPage';

export default function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="page-container">
        <Routes>
          <Route path="/login" element={<LoginPage/>} />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsPage/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetailsPage/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/participants"
            element={
              <ProtectedRoute>
                <ParticipantsPage/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage/>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace/>} />
          <Route path="*" element={<Navigate to="/dashboard" replace/>} />
        </Routes>
      </main>
    </div>
  );
}
