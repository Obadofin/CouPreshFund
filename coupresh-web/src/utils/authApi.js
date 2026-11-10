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
    const validationMessage = result.errors
      ?.map((error) => error.message)
      .filter(Boolean)
      .join('. ')
    throw new ApiError(
      validationMessage || result.message || 'The request could not be completed.',
      response.status,
    )
  }

  return result
}

export async function registerStudent({ fullName, email, phone, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName,
      email: email || undefined,
      phone: phone || undefined,
      password,
    }),
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

export async function saveStudentOnboarding(onboarding) {
  const result = await request('/students/me/onboarding', {
    method: 'PUT',
    body: JSON.stringify({
      institution: onboarding.institution,
      course: onboarding.course,
      level: onboarding.level,
      graduationYear: Number(onboarding.graduationYear),
      goalAmount: Number(onboarding.goalAmount),
      purpose: onboarding.purpose,
      contribution: Number(onboarding.contribution),
      cadence: onboarding.cadence,
    }),
  })
  return result.onboarding
}

export async function saveStudentGoal(onboarding) {
  const result = await request('/students/me/goal', {
    method: 'PUT',
    body: JSON.stringify({
      institution: onboarding.institution,
      course: onboarding.course,
      level: onboarding.level,
      graduationYear: Number(onboarding.graduationYear),
      goalAmount: Number(onboarding.goalAmount),
      purpose: onboarding.purpose,
      contribution: Number(onboarding.contribution),
      cadence: onboarding.cadence,
    }),
  })
  return result.onboarding
}

export async function getStudentDashboard() {
  return request('/students/me/dashboard')
}

export async function getStudentContributions(limit = 20) {
  return request(`/students/me/contributions?limit=${encodeURIComponent(limit)}`)
}

export async function addStudentContribution({ amount, note }) {
  return request('/students/me/contributions', {
    method: 'POST',
    body: JSON.stringify({
      amount: Number(amount),
      ...(note ? { note } : {}),
    }),
  })
}

export async function getStudentBudgets() {
  const result = await request('/students/me/budgets')
  return result.budgets
}

export async function saveStudentBudget(period, amount) {
  const result = await request(`/students/me/budgets/${encodeURIComponent(period)}`, {
    method: 'PUT',
    body: JSON.stringify({ amount: Number(amount) }),
  })
  return result.budget
}

export async function getStudentExpenses(period = 'monthly') {
  return request(`/students/me/expenses?period=${encodeURIComponent(period)}`)
}

export async function addStudentExpense({ amount, category, occurredOn, note }) {
  const result = await request('/students/me/expenses', {
    method: 'POST',
    body: JSON.stringify({
      amount: Number(amount),
      category,
      occurredOn,
      ...(note ? { note } : {}),
    }),
  })
  return result.expense
}

export async function getLearningLessons() {
  const result = await request('/learning/lessons')
  return result.lessons
}

export async function getLearningLesson(lessonId) {
  const result = await request(`/learning/lessons/${encodeURIComponent(lessonId)}`)
  return result.lesson
}

export async function getStudentLessonProgress() {
  const result = await request('/students/me/learning/progress')
  return result.progress
}

export async function saveStudentLessonProgress(lessonId, progressPercent) {
  const result = await request(
    `/students/me/learning/progress/${encodeURIComponent(lessonId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ progressPercent }),
    },
  )
  return result.progress
}

export async function getSkillChallenges() {
  const result = await request('/skills/challenges')
  return result.challenges
}

export async function getSkillChallenge(challengeId) {
  const result = await request(`/skills/challenges/${encodeURIComponent(challengeId)}`)
  return result.challenge
}

export async function getStudentSkillProjects() {
  return request('/students/me/skills/projects')
}

export async function saveStudentSkillProject(challengeId, completedSteps) {
  const result = await request(
    `/students/me/skills/projects/${encodeURIComponent(challengeId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ completedSteps }),
    },
  )
  return result.progress
}

export async function getStudentPoints() {
  return request('/students/me/points')
}

export async function getStudentPointTransactions() {
  const result = await request('/students/me/points/transactions')
  return result.transactions
}

export async function getOpportunities(type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  const result = await request(`/opportunities${query}`)
  return result.opportunities
}

export async function getOpportunity(opportunityId) {
  const result = await request(`/opportunities/${encodeURIComponent(opportunityId)}`)
  return result.opportunity
}

export async function getSavedOpportunities() {
  const result = await request('/opportunities/me/saved')
  return result.opportunityIds
}

export async function saveOpportunity(opportunityId) {
  return request(`/opportunities/me/saved/${encodeURIComponent(opportunityId)}`, {
    method: 'PUT',
  })
}

export async function removeSavedOpportunity(opportunityId) {
  return request(`/opportunities/me/saved/${encodeURIComponent(opportunityId)}`, {
    method: 'DELETE',
  })
}

export async function getGuardianInvitations() {
  const result = await request('/students/me/guardian-invitations')
  return result.invitations
}

export async function createGuardianInvitation() {
  const result = await request('/students/me/guardian-invitations', { method: 'POST' })
  return result.invitation
}

export async function revokeGuardianInvitation(invitationId) {
  return request(`/students/me/guardian-invitations/${encodeURIComponent(invitationId)}`, {
    method: 'DELETE',
  })
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function hasAuthToken() {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
}
