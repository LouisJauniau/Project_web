import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ErrorState from '../components/ErrorState'
import LoadingState from '../components/LoadingState'
import api from '../services/api'

export default function ParticipantsPage() {
  const { user } = useAuth()
  const [participants, setParticipants] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [participantActionLoading, setParticipantActionLoading] = useState(false)
  const [userActionLoading, setUserActionLoading] = useState(false)
  const [participantSearch, setParticipantSearch] = useState('')
  const [participantForm, setParticipantForm] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
  })
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  })
  const participantFormRef = useRef(null)

  const extractError = (err, fallback) => {
    const data = err?.response?.data
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0]
    if (Array.isArray(data?.username) && data.username[0]) return data.username[0]
    if (Array.isArray(data?.email) && data.email[0]) return data.email[0]
    if (Array.isArray(data?.password) && data.password[0]) return data.password[0]
    return fallback
  }

  const resetParticipantForm = () => {
    setParticipantForm({ id: null, first_name: '', last_name: '', email: '' })
  }

  // Fetch participants, registrations, and users (if admin) in parallel
  const fetchParticipants = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) {
      setLoading(true)
    }
    setFetchError('')

    try {
      const [participantsRes, registrationsRes] = await Promise.all([
        api.get('/participants/'),
        api.get('/registrations/'),
      ])
      setParticipants(participantsRes.data)
      setRegistrations(registrationsRes.data)

      // If user is admin, also fetch all users for management
      if (user?.is_staff) {
        const usersRes = await api.get('/auth/users/')
        setUsers(usersRes.data)
      }
    } catch (err) {
      setFetchError(extractError(err, 'Failed to load participants.'))
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [user?.is_staff])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  // Scroll to participant form when editing a participant
  useEffect(() => {
    if (!participantForm.id || !participantFormRef.current) {
      return
    }

    participantFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [participantForm.id])

  // Group registrations by participant for easy lookup
  const registrationsByParticipant = useMemo(() => {
    const grouped = new Map()

    // For each registration, add the event title to the corresponding participant's list
    registrations.forEach((registration) => {
      const participantId = registration.participant
      const current = grouped.get(participantId) || []
      current.push(registration.event_details?.title || 'Unknown event')
      grouped.set(participantId, current)
    })

    // The final structure looks like this: { participantId: [eventTitle1, eventTitle2, ...], ... }
    return grouped
  }, [registrations])

  const filteredParticipants = useMemo(() => {
    const query = participantSearch.trim().toLowerCase()
    if (!query) {
      return participants
    }

    return participants.filter((participant) => {
      const searchable = `${participant.first_name} ${participant.last_name} ${participant.email}`.toLowerCase()
      return searchable.includes(query)
    })
  }, [participants, participantSearch])

  const handlePromote = async (userId) => {
    setUserActionLoading(true)
    setActionError('')

    try {
      await api.post(`/auth/users/${userId}/promote/`)
      // Refresh users and participants
      await fetchParticipants({ showLoader: false })
    } catch (err) {
      setActionError(extractError(err, 'Could not promote user.'))
    } finally {
      setUserActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    setUserActionLoading(true)
    setActionError('')

    try {
      await api.delete(`/auth/users/${userId}/`)
      // Refresh users and participants
      await fetchParticipants({ showLoader: false })
    } catch (err) {
      setActionError(extractError(err, 'Could not delete user.'))
    } finally {
      setUserActionLoading(false)
    }
  }
  
  const handleParticipantFieldChange = (event) => {
    const { name, value } = event.target
    setParticipantForm((current) => ({ ...current, [name]: value }))
  }

  const handleUserFieldChange = (event) => {
    const { name, value } = event.target
    setUserForm((current) => ({ ...current, [name]: value }))
  }

  const handleParticipantSubmit = async (event) => {
    event.preventDefault()
    setActionError('')
    setParticipantActionLoading(true)

    try {
      const payload = {
        first_name: participantForm.first_name.trim(),
        last_name: participantForm.last_name.trim(),
        email: participantForm.email.trim(),
      }

      // If participantForm has an id, we're editing an existing participant, otherwise we're creating a new one
      if (participantForm.id) {
        const response = await api.put(`/participants/${participantForm.id}/`, payload)
        setParticipants((current) =>
          current.map((participant) => (participant.id === participantForm.id ? response.data : participant))
        )
      } else {
        const response = await api.post('/participants/', payload)
        setParticipants((current) => [...current, response.data])
      }

      resetParticipantForm()
    } catch (err) {
      setActionError(extractError(err, 'Could not save participant.'))
    } finally {
      setParticipantActionLoading(false)
    }
  }

  const startParticipantEdit = (participant) => {
    setActionError('')
    setParticipantForm({
      id: participant.id,
      first_name: participant.first_name,
      last_name: participant.last_name,
      email: participant.email,
    })
  }

  const handleParticipantDelete = async (participantId) => {
    if (!window.confirm('Delete this participant profile?')) {
      return
    }

    setParticipantActionLoading(true)
    setActionError('')

    try {
      await api.delete(`/participants/${participantId}/`)
      if (participantForm.id === participantId) {
        resetParticipantForm()
      }
      setParticipants((current) => current.filter((participant) => participant.id !== participantId))
      setRegistrations((current) => current.filter((registration) => registration.participant !== participantId))
    } catch (err) {
      setActionError(extractError(err, 'Could not delete participant.'))
    } finally {
      setParticipantActionLoading(false)
    }
  }

  const handleUserCreate = async (event) => {
    event.preventDefault()
    setUserActionLoading(true)
    setActionError('')

    try {
      await api.post('/auth/users/', {
        username: userForm.username.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        is_staff: userForm.role === 'admin',
      })

      setUserForm({ username: '', email: '', password: '', role: 'viewer' })
      await fetchParticipants({ showLoader: false })
    } catch (err) {
      setActionError(extractError(err, 'Could not create user.'))
    } finally {
      setUserActionLoading(false)
    }
  }

  if (loading) {
    return <LoadingState label="Loading participants..." />
  }

  if (fetchError) {
    return <ErrorState message={fetchError} onRetry={fetchParticipants} />
  }

  return (
    <section className="participants-page">
      
      <article className="card participants-hero">
        <p className="section-eyebrow">Participants</p>
        <h2 className="section-title-lg">People and Access Management</h2>
        <p className="muted dashboard-subtitle">
          Manage participant profiles, review registrations, and control user access in one place.
        </p>
      </article>

      {actionError ? (
        <article className="card">
          <p>{actionError}</p>
        </article>
      ) : null}

      <section className="participants-layout">
        <section className="participants-main-stack">
          {user?.is_staff ? (
            <article
              ref={participantFormRef}
              className={`card participants-form-card${participantForm.id ? ' participants-form-card-active' : ''}`}
            >
              {participantForm.id ? (
                <p className="participants-editing-banner">
                  Editing {participantForm.first_name} {participantForm.last_name}
                </p>
              ) : null}
              <h3 className="section-title">{participantForm.id ? 'Update participant' : 'Create participant'}</h3>
              <form className="participants-form-grid" onSubmit={handleParticipantSubmit}>
                <label className="participants-field" htmlFor="participant-first-name">
                  <span className="form-field-label">First name</span>
                  <input
                    id="participant-first-name"
                    className="input"
                    name="first_name"
                    value={participantForm.first_name}
                    onChange={handleParticipantFieldChange}
                    required
                  />
                </label>

                <label className="participants-field" htmlFor="participant-last-name">
                  <span className="form-field-label">Last name</span>
                  <input
                    id="participant-last-name"
                    className="input"
                    name="last_name"
                    value={participantForm.last_name}
                    onChange={handleParticipantFieldChange}
                    required
                  />
                </label>

                <label className="participants-field participants-field-full" htmlFor="participant-email">
                  <span className="form-field-label">Email</span>
                  <input
                    id="participant-email"
                    className="input"
                    type="email"
                    name="email"
                    value={participantForm.email}
                    onChange={handleParticipantFieldChange}
                    required
                  />
                </label>

                <div className="participants-form-actions participants-field-full">
                  <button className="btn btn-primary" type="submit" disabled={participantActionLoading}>
                    {participantActionLoading
                      ? 'Saving...'
                      : participantForm.id
                        ? 'Update participant'
                        : 'Create participant'}
                  </button>
                  {participantForm.id ? (
                    <button type="button" className="btn" onClick={resetParticipantForm}>
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </article>
          ) : null}

          <article className="card participants-list-card">
            <h3 className="section-title">Participant profiles</h3>
            <label className="participants-field participants-field-full participants-search-field" htmlFor="participants-search">
              <span className="form-field-label">Search participants</span>
              <input
                id="participants-search"
                className="input"
                value={participantSearch}
                onChange={(event) => setParticipantSearch(event.target.value)}
                placeholder="Search by name or email"
              />
            </label>
            {filteredParticipants.length === 0 ? <p className="muted">No participants found.</p> : null}
            {filteredParticipants.map((participant) => {
              const events = registrationsByParticipant.get(participant.id) || []
              return (
                <div key={participant.id} className="participants-profile-row">
                  <div className="participants-profile-main">
                    <h4 className="participants-name">
                      {participant.first_name} {participant.last_name}
                    </h4>
                    <p className="muted participants-email">{participant.email}</p>
                  </div>

                  <select
                    className="select participants-events-select"
                    disabled={events.length === 0}
                    defaultValue=""
                    aria-label={`Registered events for ${participant.first_name} ${participant.last_name}`}
                  >
                    <option value="" disabled>
                      {events.length === 0 ? 'No registrations' : 'Registered events'}
                    </option>
                    {events.map((title) => (
                      <option key={`${participant.id}-${title}`} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>

                  {user?.is_staff ? (
                    <div className="participants-profile-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={participantActionLoading}
                        onClick={() => startParticipantEdit(participant)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={participantActionLoading}
                        onClick={() => handleParticipantDelete(participant.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </article>
        </section>

        {user?.is_staff ? (
          <aside className="participants-admin-stack">
            <article className="card participants-user-create-card">
              <h3 className="section-title">Create user account</h3>
              <form className="participants-form-grid" onSubmit={handleUserCreate}>
                <label className="participants-field participants-field-full" htmlFor="user-username">
                  <span className="form-field-label">Username</span>
                  <input
                    id="user-username"
                    className="input"
                    name="username"
                    value={userForm.username}
                    onChange={handleUserFieldChange}
                    required
                  />
                </label>

                <label className="participants-field participants-field-full" htmlFor="user-email">
                  <span className="form-field-label">Email</span>
                  <input
                    id="user-email"
                    className="input"
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleUserFieldChange}
                  />
                </label>

                <label className="participants-field participants-field-full" htmlFor="user-password">
                  <span className="form-field-label">Password</span>
                  <input
                    id="user-password"
                    className="input"
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserFieldChange}
                    required
                  />
                </label>

                <label className="participants-field participants-field-full" htmlFor="user-role">
                  <span className="form-field-label">Role</span>
                  <select
                    id="user-role"
                    className="select"
                    name="role"
                    value={userForm.role}
                    onChange={handleUserFieldChange}
                  >
                    <option value="viewer">viewer</option>
                    <option value="admin">admin</option>
                  </select>
                </label>

                <div className="participants-form-actions participants-field-full">
                  <button className="btn btn-primary" type="submit" disabled={userActionLoading}>
                    {userActionLoading ? 'Creating...' : 'Create user'}
                  </button>
                </div>
              </form>
            </article>

            <article className="card participants-user-management-card">
              <h3 className="section-title">Admin user management</h3>
              {users.length === 0 ? <p className="muted">No users found.</p> : null}
              {users.map((listedUser) => (
                <div key={listedUser.id} className="list-row list-row-spaced participants-user-row">
                  <strong>{listedUser.username}</strong>
                  <div className="row">
                    <span className={`role-badge ${listedUser.is_staff ? 'role-badge-admin' : 'role-badge-viewer'}`}>
                      {listedUser.is_staff ? 'admin' : 'viewer'}
                    </span>
                    {!listedUser.is_staff ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={userActionLoading}
                        onClick={() => handlePromote(listedUser.id)}
                      >
                        Promote
                      </button>
                    ) : null}
                    {listedUser.id !== user?.id ? (
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={userActionLoading}
                        onClick={() => handleDeleteUser(listedUser.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </article>
          </aside>
        ) : null}
      </section>
    </section>
  )
}