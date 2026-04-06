const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'eventhub_token'

// API client with methods for GET, POST, PUT, DELETE requests
const api = {
  async get(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${normalizeEndpoint(endpoint)}`, {
      ...options,
      method: 'GET',
      headers: {
        ...authHeaders(false),
        ...options.headers,
      },
    })

    return readJsonResponse(response)
  },

  async post(endpoint, data, options = {}) {
    const response = await fetch(`${BASE_URL}${normalizeEndpoint(endpoint)}`, {
      ...options,
      method: 'POST',
      headers: {
        ...authHeaders(true),
        ...options.headers,
      },
      body: JSON.stringify(data),
    })

    return readJsonResponse(response)
  },

  async put(endpoint, data, options = {}) {
    const response = await fetch(`${BASE_URL}${normalizeEndpoint(endpoint)}`, {
      ...options,
      method: 'PUT',
      headers: {
        ...authHeaders(true),
        ...options.headers,
      },
      body: JSON.stringify(data),
    })

    return readJsonResponse(response)
  },

  async delete(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${normalizeEndpoint(endpoint)}`, {
      ...options,
      method: 'DELETE',
      headers: {
        ...authHeaders(false),
        ...options.headers,
      },
    })

    return readJsonResponse(response)
  },
}

// Authorize endpoint both with and without leading slash
const normalizeEndpoint = (endpoint) => (endpoint.startsWith('/') ? endpoint : `/${endpoint}`)

// Read JSON response and handle errors
const readJsonResponse = async (response) => {
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const error = new Error(data?.error || data?.detail || `Request failed with status ${response.status}`)
    error.response = { status: response.status, data }
    throw error
  }

  return { data, status: response.status }
}

// Generate headers with optional JSON content type and authorization token
const authHeaders = (withJson = false) => {
  const headers = {}
  const token = localStorage.getItem(TOKEN_KEY)

  if (withJson) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Token ${token}`
  }

  return headers
}

export default api