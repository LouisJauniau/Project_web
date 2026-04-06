import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function EventDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [eventData, setEventData] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [participants, setParticipants] = useState([])
  const [selectedParticipantId, setSelectedParticipantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const extractError = (err, fallback) => {
    const data = err?.response?.data
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0]
    if (Array.isArray(data?.participant) && data.participant[0]) return data.participant[0]
    if (Array.isArray(data?.event) && data.event[0]) return data.event[0]
    return fallback
  }

  const fetchDetails = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [eventRes, regRes, participantsRes] = await Promise.all([
        api.get(`/events/${id}/`),
        api.get(`/registrations/?event=${id}`),
        api.get('/participants/'),
      ])
      setEventData(eventRes.data)
      setRegistrations(regRes.data)
      setParticipants(participantsRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load event details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!selectedParticipantId && participants.length > 0) {
      setSelectedParticipantId(String(participants[0].id))
    }
  }, [participants, selectedParticipantId])

  const selectedRegistration = registrations.find(
    (registration) => String(registration.participant) === String(selectedParticipantId)
  )

  const handleRegisterParticipant = async () => {
    if (!selectedParticipantId) {
      return
    }

    setActionLoading(true)
    setActionError('')

    try {
      const response = await api.post('/registrations/', {
        participant: Number(selectedParticipantId),
        event: Number(id),
      })
      setRegistrations((current) => [response.data, ...current])
    } catch (err) {
      setActionError(extractError(err, 'Could not register participant.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnregisterParticipant = async (registrationId) => {
    setActionLoading(true)
    setActionError('')

    try {
      await api.delete(`/registrations/${registrationId}/`)
      setRegistrations((current) => current.filter((registration) => registration.id !== registrationId))
    } catch (err) {
      setActionError(extractError(err, 'Could not unregister participant.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleRegistration = async () => {
    if (selectedRegistration) {
      await handleUnregisterParticipant(selectedRegistration.id)
      return
    }

    await handleRegisterParticipant()
  }

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  if (loading) {
    return <LoadingState label="Loading event details..." />
  }

  if (error && !eventData) {
    return <ErrorState message={error} onRetry={fetchDetails} />
  }

  return (
    <section className="event-details-page">
      <Link to="/events" className="event-details-back-link">
        Back to events
      </Link>

      <header className="card event-details-hero">
        <div className="event-details-head">
          <div className="event-details-main">
            <p className="section-eyebrow">Workshop details</p>
            <h2 className="event-details-title">{eventData.title}</h2>
            <p className="event-details-description">{eventData.description}</p>
          </div>
          <span className="tag event-details-status">{eventData.status}</span>
        </div>

        <div className="event-details-meta-grid">
          <div className="event-details-meta-item">
            <p className="form-field-label">Date & time</p>
            <p className="event-details-meta-value">{new Date(eventData.date).toLocaleString()}</p>
          </div>
          <div className="event-details-meta-item">
            <p className="form-field-label">Location</p>
            <p className="event-details-meta-value">{eventData.location}</p>
          </div>
          <div className="event-details-meta-item">
            <p className="form-field-label">Registered participants</p>
            <p className="event-details-meta-value">{registrations.length}</p>
          </div>
        </div>
      </header>

      {user?.is_staff ? (
        <article className="card">
          <h3 className="section-title">Manage registrations</h3>
          <div className="event-details-form-grid">
            <label className="events-field" htmlFor="participant-select">
              <span className="form-field-label">Participant</span>
              <select
                id="participant-select"
                className="select"
                value={selectedParticipantId}
                onChange={(event) => setSelectedParticipantId(event.target.value)}
              >
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.first_name} {participant.last_name} ({participant.email})
                  </option>
                ))}
              </select>
            </label>

            <div className="event-details-form-actions">
              <button
                type="button"
                className={selectedRegistration ? 'btn' : 'btn btn-primary'}
                onClick={handleToggleRegistration}
                disabled={actionLoading || !selectedParticipantId}
              >
                {actionLoading ? 'Saving...' : selectedRegistration ? 'Unregister' : 'Register'}
              </button>
            </div>
          </div>

          {actionError ? <p>{actionError}</p> : null}
        </article>
      ) : null}

      <article className="card event-details-participant-stream-card">
        <h3 className="section-title">Registered participants</h3>
        {registrations.length === 0 ? <p className="muted">No registrations yet.</p> : null}
        {registrations.map((registration) => (
          <div key={registration.id} className="list-row list-row-spaced event-details-participant-stream-row">
            <div>
              <p className="event-details-participant-stream-name">
                {registration.participant_details?.first_name} {registration.participant_details?.last_name}
              </p>
              <p className="event-details-participant-stream-email">{registration.participant_details?.email}</p>
            </div>
            <span className="tag">Registered</span>
          </div>
        ))}
      </article>
    </section>
  )
}
