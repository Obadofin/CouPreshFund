import { useEffect, useState } from 'react'
import {
  addGuardianSupportContribution,
  clearGuardianAuthToken,
  getGuardianRewards,
  getGuardianStudents,
  hasGuardianAuthToken,
  loginGuardian,
} from '../utils/authApi.js'
import formatNaira from '../utils/formatNaira.js'
import './GuardianDashboardPage.css'

function GuardianLogin({ onLogin }) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      await onLogin({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      })
    } catch (requestError) {
      setError(requestError.message || 'Could not sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="guardian-login-card" onSubmit={submit}>
      <p className="guardian-eyebrow">GUARDIAN ACCESS</p>
      <h1>Sign in to support a student</h1>
      <p>Your access is read-only except for recording support toward a linked goal.</p>
      <label>Email address<input autoComplete="email" name="email" required type="email" /></label>
      <label>Password<input autoComplete="current-password" name="password" required type="password" /></label>
      {error && <p className="guardian-dashboard-error" role="alert">{error}</p>}
      <button className="guardian-dashboard-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function SupportForm({ student, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onSubmit({ studentId: student.id, amount, note })
      setAmount('')
      setNote('')
    } catch (requestError) {
      setError(requestError.message || 'Could not record support.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="guardian-support-form" onSubmit={submit}>
      <h3>Record support</h3>
      <p>This records a contribution toward the goal; it does not transfer money.</p>
      <label>Amount (₦)<input min="100" onChange={(event) => setAmount(event.target.value)} required step="1" type="number" value={amount} /></label>
      <label>Note (optional)<input maxLength="250" onChange={(event) => setNote(event.target.value)} value={note} /></label>
      {error && <p className="guardian-dashboard-error" role="alert">{error}</p>}
      <button className="guardian-dashboard-primary" disabled={busy} type="submit">{busy ? 'Recording…' : 'Record support'}</button>
    </form>
  )
}

function StudentGoal({ entry, onSupport }) {
  const { student, goal, savings } = entry
  const progress = savings.progressPercent || 0
  return (
    <article className="guardian-student-card">
      <div className="guardian-student-heading">
        <div><p className="guardian-eyebrow">LINKED STUDENT</p><h2>{student.fullName}</h2></div>
        <span className="guardian-readonly">Read only</span>
      </div>
      {goal ? (
        <>
          <div className="guardian-goal-details">
            <p>{goal.institution} · {goal.course}</p>
            <strong>{goal.purpose}</strong>
          </div>
          <div className="guardian-goal-progress">
            <div><span>Progress</span><strong>{progress}%</strong></div>
            <div aria-label={`Goal ${progress}% complete`} aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} className="guardian-progress-track" role="progressbar">
              <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
            </div>
            <p>{formatNaira(savings.totalSaved)} saved of {formatNaira(goal.goalAmount)}</p>
          </div>
          <SupportForm onSubmit={onSupport} student={student} />
        </>
      ) : <p className="guardian-empty-goal">This student has not set a savings goal yet.</p>}
      <div className="guardian-contributions">
        <h3>Recent contributions</h3>
        {savings.recentContributions.length
          ? savings.recentContributions.map((contribution) => (
            <div className="guardian-contribution-row" key={contribution.id}>
              <span>{contribution.note || 'Savings contribution'}</span>
              <strong>{formatNaira(contribution.amount)}</strong>
            </div>
          ))
          : <p>No contributions recorded yet.</p>}
      </div>
    </article>
  )
}

export default function GuardianDashboardPage() {
  const [hasToken, setHasToken] = useState(hasGuardianAuthToken())
  const [students, setStudents] = useState([])
  const [rewards, setRewards] = useState({ points: 0, rewards: [] })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(hasGuardianAuthToken())
  const [refreshing, setRefreshing] = useState(false)

  async function loadDashboard() {
    const [linkedStudents, guardianRewards] = await Promise.all([
      getGuardianStudents(),
      getGuardianRewards(),
    ])
    setStudents(linkedStudents)
    setRewards(guardianRewards)
  }

  useEffect(() => {
    let active = true
    if (!hasToken) return undefined
    Promise.all([getGuardianStudents(), getGuardianRewards()])
      .then(([linkedStudents, guardianRewards]) => {
        if (!active) return
        setStudents(linkedStudents)
        setRewards(guardianRewards)
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError.status === 401 || requestError.status === 403) {
          clearGuardianAuthToken()
          setHasToken(false)
        } else {
          setError(requestError.message || 'Could not load guardian dashboard.')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [hasToken])

  useEffect(() => {
    if (!hasToken) return undefined
    let active = true
    const refresh = () => {
      if (document.visibilityState === 'hidden') return
      Promise.all([getGuardianStudents(), getGuardianRewards()])
        .then(([linkedStudents, guardianRewards]) => {
          if (!active) return
          setStudents(linkedStudents)
          setRewards(guardianRewards)
          setError('')
        })
        .catch((requestError) => {
          if (!active) return
          if (requestError.status === 401 || requestError.status === 403) {
            clearGuardianAuthToken()
            setHasToken(false)
          }
        })
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [hasToken])

  async function handleRefresh() {
    setRefreshing(true)
    setError('')
    try {
      await loadDashboard()
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) {
        clearGuardianAuthToken()
        setHasToken(false)
      } else {
        setError(requestError.message || 'Could not refresh your guardian dashboard.')
      }
    } finally {
      setRefreshing(false)
    }
  }

  async function handleLogin(credentials) {
    await loginGuardian(credentials)
    setError('')
    setHasToken(true)
    setLoading(true)
  }

  async function handleSupport(contribution) {
    await addGuardianSupportContribution(contribution)
    setNotice('Support contribution recorded.')
    setError('')
    try {
      await loadDashboard()
    } catch (requestError) {
      setError(requestError.message || 'The support was recorded, but the latest goal summary could not be refreshed.')
    }
  }

  if (!hasToken) return <main className="guardian-dashboard-page"><GuardianLogin onLogin={handleLogin} /></main>
  if (loading) return <main className="guardian-dashboard-page"><p className="guardian-dashboard-status">Loading your guardian dashboard…</p></main>

  return (
    <main className="guardian-dashboard-page">
      <header className="guardian-dashboard-header">
        <div><p className="guardian-eyebrow">COUPRESHFUND · GUARDIAN</p><h1>Student goals</h1><p>View progress and record support for linked students.</p></div>
        <button className="guardian-dashboard-secondary" onClick={() => {
          clearGuardianAuthToken()
          setHasToken(false)
          setStudents([])
        }} type="button">Sign out</button>
      </header>
      {error && <p className="guardian-dashboard-error" role="alert">{error}</p>}
      {notice && <p className="guardian-dashboard-success" role="status">{notice}</p>}
      <section className="guardian-rewards-summary">
        <div>
          <p className="guardian-eyebrow">SUPPORT REWARDS</p>
          <strong>{rewards.points} points</strong>
          <span>Points are awarded by the CouPreshFund team.</span>
          <button className="guardian-dashboard-secondary guardian-refresh" disabled={refreshing} onClick={handleRefresh} type="button">
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {rewards.rewards.length > 0 ? (
          <ul>{rewards.rewards.map((reward) => (
            <li key={reward.id}>
              <span>
                {reward.reason}
                <small>{new Date(reward.createdAt).toLocaleDateString('en-NG')}</small>
              </span>
              <strong>+{reward.points}</strong>
            </li>
          ))}</ul>
        ) : <p className="guardian-rewards-empty">No rewards yet. Awards from the CouPreshFund team will appear here.</p>}
      </section>
      {students.length
        ? <section className="guardian-student-list">{students.map((entry) => (
          <StudentGoal entry={entry} key={entry.student.id} onSupport={handleSupport} />
        ))}</section>
        : <section className="guardian-empty-state"><h2>No linked students yet</h2><p>Ask a student to send you a guardian invitation, then use its code to link your account.</p></section>}
    </main>
  )
}
