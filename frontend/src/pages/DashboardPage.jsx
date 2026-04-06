import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import api from '../services/api'

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    events: 0,
    participants: 0,
    registrations: 0,
    upcomingEvents: 0,
    completedEvents: 0,
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [eventsRes, participantsRes, registrationsRes] = await Promise.all([
        api.get('/events/'),
        api.get('/participants/'),
        api.get('/registrations/'),
      ])

      // Sort events by date and take the 3 most recent ones
      const events = [...eventsRes.data].sort((a, b) => new Date(a.date) - new Date(b.date))
      setRecentEvents(events.slice(0, 3))

      setSummary({
        events: events.length,
        participants: participantsRes.data.length,
        registrations: registrationsRes.data.length,
        upcomingEvents: events.filter((event) => event.status === 'upcoming').length,
        completedEvents: events.filter((event) => event.status === 'completed').length,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  if (loading) {
    return <LoadingState label="Loading dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchSummary} />
  }

  return (
    <section className="dashboard-page">
      {error ? <ErrorState message={error} onRetry={fetchSummary} /> : null}

      <header className="card dashboard-hero">
        <p className="section-eyebrow">EventHub</p>
        <h2 className="section-title-lg">Live Overview</h2>
        <p className="muted dashboard-subtitle">Track what is happening now across events, participants, and registrations.</p>
      </header>

      <section className="dashboard-stats">
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Total events</p>
          <p className="dashboard-stat-value">{summary.events}</p>
        </article>
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Total participants</p>
          <p className="dashboard-stat-value">{summary.participants}</p>
        </article>
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Total registrations</p>
          <p className="dashboard-stat-value">{summary.registrations}</p>
        </article>
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Upcoming events</p>
          <p className="dashboard-stat-value">{summary.upcomingEvents}</p>
        </article>
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Completed events</p>
          <p className="dashboard-stat-value">{summary.completedEvents}</p>
        </article>
      </section>

      <section className="card">
        <h3 className="section-eyebrow">Recent events</h3>
        {recentEvents.length === 0 ? <p className="muted">No events found.</p> : null}
        {recentEvents.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="dashboard-recent-event-link">
            <div className="list-row list-row-spaced">
              <div className="dashboard-recent-events-info">
                <strong className="section-title-lg">{event.title}</strong>
                <div className="muted">{new Date(event.date).toLocaleString()}</div>
              </div>
              <span className="tag">{event.status}</span>
            </div>
          </Link>
        ))}
      </section>
    </section>
  )
}
