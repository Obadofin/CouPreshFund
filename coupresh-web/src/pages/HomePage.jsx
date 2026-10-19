import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell.jsx'
import formatNaira from '../utils/formatNaira.js'

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function monthsUntilGraduation(graduationYear) {
  const now = new Date()
  const targetMonth = 5
  return Math.max(
    0,
    (Number(graduationYear) - now.getFullYear()) * 12
      + targetMonth - now.getMonth()
      - (now.getDate() > 1 ? 1 : 0),
  )
}

export default function HomePage({ profile }) {
  const [notice, setNotice] = useState('')
  const name = profile.fullName.trim() || 'Ada'
  const graduationYear = profile.graduationYear || '2028'
  const goal = Number(profile.goalAmount) || 500000
  const saved = 125000
  const progress = Math.min(100, Math.round((saved / goal) * 100))
  const contribution = Number(profile.contribution) || 5000
  const graduationMonths = monthsUntilGraduation(graduationYear)

  return (
    <DashboardShell>
      <header className="dashboard-greeting">
        <div>
          <h1>Hi, {name.split(/\s+/)[0]}</h1>
          <p>You’re on track</p>
        </div>
        <Link
          className="dashboard-avatar"
          to="/profile"
          aria-label={`View profile for ${name}`}
        >
          {getInitials(name)}
        </Link>
      </header>

      <section className="saved-card" aria-labelledby="saved-heading">
        <div className="saved-card-topline">
          <h2 id="saved-heading">Total Saved</h2>
          <span className="points-badge">340 pts</span>
        </div>
        <p className="saved-total">{formatNaira(saved)}</p>
        <p className="saved-goal">of {formatNaira(goal)} goal</p>
        <div
          className="saved-progress"
          role="progressbar"
          aria-label="Savings goal progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="tier-copy">Tier: Grower ~ N125,000 to Accelerator</p>
      </section>

      <section className="milestone-grid" aria-label="Your milestones">
        <article className="milestone-tile">
          <svg className="graduation-icon" viewBox="0 0 64 48" aria-hidden="true">
            <path d="m3 15 29-12 29 12-29 13L3 15Z" />
            <path d="M13 20v13c0 7 9 12 19 12s19-5 19-12V20" />
            <path d="M61 16v18" />
          </svg>
          <p className="milestone-value">{graduationMonths} months</p>
          <p className="milestone-label">to graduation</p>
        </article>
        <article className="milestone-tile">
          <svg className="streak-icon" viewBox="0 0 40 48" aria-hidden="true">
            <path d="M21 2c2 9-7 11-5 19 2-3 5-5 8-7 1 7 9 10 9 19a13 13 0 1 1-26 0c0-7 4-12 8-17 3-4 5-8 6-14Z" />
            <path className="streak-core" d="M21 23c1 5-4 7-3 12a5 5 0 0 0 10-1c0-4-3-7-7-11Z" />
          </svg>
          <p className="milestone-value">8 weeks</p>
          <p className="milestone-label">savings streak</p>
        </article>
      </section>

      <section className="weekly-card" aria-labelledby="weekly-heading">
        <div className="weekly-card-copy">
          <h2 id="weekly-heading">This week: {formatNaira(contribution)}</h2>
          <p>Keep your streak going with a contribution.</p>
        </div>
        <button
          className="weekly-action"
          onClick={() => setNotice('Demo only. This contribution has not been saved.')}
          type="button"
        >
          Log savings
        </button>
        <p className="dashboard-notice" aria-live="polite" role="status">{notice}</p>
      </section>
      <p className="dashboard-demo-note">Preview data only. No money has been moved.</p>
    </DashboardShell>
  )
}