import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import api from '../services/api'

export default function EventsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [eventForm, setEventForm] = useState({
    id: null,
    title: '',
    description: '',
    location: '',
    date: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const updateFormRef = useRef(null)

  useEffect(() => {
    if (!eventForm.id || !updateFormRef.current) {
      return
    }

    updateFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [eventForm])


  const toDateTimeLocal = (value) => {
    if (!value) {
      return ''
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const pad = (n) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
      date.getMinutes()
    )}`
  }

  const resetForm = () => {
    setEventForm({
      id: null,
      title: '',
      description: '',
      location: '',
      date: '',
    })
  }

  const extractError = (err, fallback) => {
    const data = err?.response?.data
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0]
    if (Array.isArray(data?.title) && data.title[0]) return data.title[0]
    if (Array.isArray(data?.date) && data.date[0]) return data.date[0]
    if (Array.isArray(data?.location) && data.location[0]) return data.location[0]
    return fallback
  }

  const fetchEvents = useCallback(async (nextStatus = '') => {
    setLoading(true)
    setError('')

    try {
      const endpoint = nextStatus ? `/events/?status=${encodeURIComponent(nextStatus)}` : '/events/'
      const response = await api.get(endpoint)
      setEvents(response.data)
    } catch (err) {
      setError(extractError(err, 'Failed to load events.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents('')
  }, [fetchEvents])


  const onStatusChange = (nextStatus) => {
    setStatus(nextStatus)
    fetchEvents(nextStatus)
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setEventForm((current) => ({ ...current, [name]: value }))
  }

  const handleEventSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setActionError('')

    try {
      const payload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        location: eventForm.location.trim(),
        date: new Date(eventForm.date).toISOString(),
      }

      if (eventForm.id) {
        const response = await api.put(`/events/${eventForm.id}/`, payload)
        const updatedEvent = response.data
        setEvents((current) => {
          const matchesCurrentStatus = !status || updatedEvent.status === status
          if (!matchesCurrentStatus) {
            return current.filter((event) => event.id !== updatedEvent.id)
          }

          return current.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
        })
      } else {
        await api.post('/events/', payload)
        await fetchEvents(status)
      }

      resetForm()
    } catch (err) {
      setActionError(extractError(err, 'Could not save event.'))
    } finally {
      setSaving(false)
    }
  }

  const startEditEvent = (eventData) => {
    setActionError('')
    setEventForm({
      id: eventData.id,
      title: eventData.title,
      description: eventData.description || '',
      location: eventData.location,
      date: toDateTimeLocal(eventData.date),
    })
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) {
      return
    }

    setSaving(true)
    setActionError('')

    try {
      await api.delete(`/events/${eventId}/`)
      if (eventForm.id === eventId) {
        resetForm()
      }
      setEvents((current) => current.filter((event) => event.id !== eventId))
    } catch (err) {
      setActionError(extractError(err, 'Could not delete event.'))
    } finally {
      setSaving(false)
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredEvents = normalizedSearch
    ? events.filter((event) => {
        const searchable = `${event.title} ${event.description} ${event.location}`.toLowerCase()
        return searchable.includes(normalizedSearch)
      })
    : events

  return (
    <section className="events-page">

      <header className="card events-hero">
        <p className="section-eyebrow">Workshops</p>
        <h2 className="section-title-lg">Discover and Track Sessions</h2>
        <p className="muted dashboard-subtitle">
          Search quickly, filter by status, and inspect each workshop details.
        </p>
      </header>

      <section className="card events-toolbar">
        <div className="events-toolbar-head">
          <h3 className="section-title">Find a workshop</h3>
          <span className="tag events-count-tag">{filteredEvents.length} result(s)</span>
        </div>

        <div className="events-filter-grid">
          <label className="events-field" htmlFor="event-search">
            <span className="form-field-label">Search</span>
            <div className="events-search-input-wrap">
              <input
                id="event-search"
                className="input events-search-input"
                placeholder="Title, location, or description"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </label>

          <label className="events-field" htmlFor="status-filter">
            <span className="form-field-label">Status</span>
            <select
              id="status-filter"
              className="select events-select"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </section>

      {user?.is_staff ? (
        <section className="card">
          <h3 className="section-title">{eventForm.id ? 'Update event' : 'Create event'}</h3>
          <form className="events-form-grid" onSubmit={handleEventSubmit}>
            <label className="events-field" htmlFor="event-title">
              <span className="form-field-label">Title</span>
              <input
                id="event-title"
                className="input"
                name="title"
                value={eventForm.title}
                onChange={handleFormChange}
                required
              />
            </label>

            <label className="events-field" htmlFor="event-location">
              <span className="form-field-label">Location</span>
              <input
                id="event-location"
                className="input"
                name="location"
                value={eventForm.location}
                onChange={handleFormChange}
                required
              />
            </label>

            <label className="events-field" htmlFor="event-description">
              <span className="form-field-label">Description</span>
              <textarea
                id="event-description"
                className="input"
                name="description"
                value={eventForm.description}
                onChange={handleFormChange}
                rows={3}
              />
            </label>

            <label className="events-field" htmlFor="event-date">
              <span className="form-field-label">Date and time</span>
              <input
                id="event-date"
                className="input"
                type="datetime-local"
                name="date"
                value={eventForm.date}
                onChange={handleFormChange}
                required
              />
            </label>

            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : eventForm.id ? 'Update event' : 'Create event'}
              </button>
              {eventForm.id ? (
                <button type="button" className="btn" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {actionError ? (
        <section className="card">
          <p>{actionError}</p>
        </section>
      ) : null}

      {loading ? <LoadingState label="Loading events..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => fetchEvents(status)} /> : null}

      {!loading && !error && filteredEvents.length === 0 ? (
        <div className="card">
          <p className="muted">No events found for this filter/search.</p>
        </div>
      ) : null}

      {!loading && !error
        ? filteredEvents.map((event) => (
            <article
              key={event.id}
              className="card events-workshop-card events-workshop-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/events/${event.id}`)}
              onKeyDown={(eventKey) => {
                if (eventKey.key === 'Enter' || eventKey.key === ' ') {
                  eventKey.preventDefault()
                  navigate(`/events/${event.id}`)
                }
              }}
            >
              <div className="events-workshop-head list-row-spaced">
                <div className="events-workshop-main">
                  <p className="section-eyebrow events-workshop-label">Workshop</p>
                  <h3 className="events-workshop-title">{event.title}</h3>
                  <p className="events-workshop-description">{event.description}</p>
                </div>
                <span className="tag events-workshop-status-tag">{event.status}</span>
              </div>

              <div className="events-workshop-footer-row">
                <div className="events-workshop-meta-grid">
                  <div className="events-workshop-meta-item">
                    <p className="form-field-label">Date & time</p>
                    <p className="events-workshop-meta-value">{new Date(event.date).toLocaleString()}</p>
                  </div>
                  <div className="events-workshop-meta-item">
                    <p className="form-field-label">Location</p>
                    <p className="events-workshop-meta-value">{event.location}</p>
                  </div>
                </div>

                <div className="events-workshop-actions">
                  {user?.is_staff ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={(eventClick) => {
                        eventClick.stopPropagation()
                        startEditEvent(event)
                      }}
                    >
                      Edit
                    </button>
                  ) : null}
                  {user?.is_staff ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={saving}
                      onClick={(eventClick) => {
                        eventClick.stopPropagation()
                        handleDeleteEvent(event.id)
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                  <Link
                    className="btn btn-primary"
                    to={`/events/${event.id}`}
                    onClick={(eventClick) => eventClick.stopPropagation()}
                  >
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))
        : null}
    </section>
  )
}
