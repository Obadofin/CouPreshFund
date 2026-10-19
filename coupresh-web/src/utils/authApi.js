const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
const TOKEN_STORAGE_KEY = 'coupreshfund.authToken'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const headers = new Headers(options.headers)

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Could not reach the server. Check that the backend is running and try again.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(result.message || 'The request could not be completed.', response.status)
  }

  return result
}

export async function registerStudent({ fullName, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  })
}

export async function loginStudent({ emailOrPhone, password }) {
  const identity = emailOrPhone.includes('@')
    ? { email: emailOrPhone }
    : { phone: emailOrPhone }
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ ...identity, password }),
  })

  localStorage.setItem(TOKEN_STORAGE_KEY, result.token)
  return result.student
}

export async function getCurrentStudent() {
  const result = await request('/auth/me')
  return result.student
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
