const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, '')
  : import.meta.env.PROD
    ? ''
    : '/api/v1'
const TOKEN_KEY = 'coupreshfund.adminToken'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Set VITE_API_BASE_URL to the HTTPS backend URL ending in /api/v1.')
  }
  if (
    import.meta.env.PROD
    && (!/^https:\/\//i.test(API_BASE_URL) || !/\/api\/v1$/i.test(API_BASE_URL))
  ) {
    throw new Error('VITE_API_BASE_URL must be an HTTPS backend URL ending in /api/v1.')
  }

  const headers = new Headers(options.headers)
  const token = localStorage.getItem(TOKEN_KEY)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Could not reach the backend. Check the API URL and try again.')
  }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(result.message || 'The request could not be completed.', response.status)
  }
  return result
}

export async function loginAdmin(credentials) {
  const result = await api('/admin-auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  if (!result.token || !result.admin) {
    throw new Error('The backend returned an invalid admin sign-in response.')
  }
  localStorage.setItem(TOKEN_KEY, result.token)
  return result.admin
}

export async function getCurrentAdmin() {
  const result = await api('/admin-auth/me')
  if (!result.admin) throw new Error('The backend returned an invalid admin session.')
  return result.admin
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasAdminToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}
