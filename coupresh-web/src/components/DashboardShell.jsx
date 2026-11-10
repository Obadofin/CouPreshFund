import { Link } from 'react-router-dom'
import BrandIdentity from './BrandIdentity.jsx'
import DashboardNav from './DashboardNav.jsx'

export default function DashboardShell({ backTo, children }) {
  return (
    <main className="dashboard-screen">
      <div className={`dashboard-page${backTo ? ' has-back' : ' is-home'}`}>
        <header className="dashboard-header">
          <Link className="dashboard-home-link" to="/home" aria-label="Go to home">
            <BrandIdentity />
          </Link>
          {backTo && (
            <Link className="dashboard-back" to={backTo} aria-label="Back to home">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="m15 4-8 8 8 8" />
              </svg>
            </Link>
          )}
        </header>
        <div className="dashboard-content">{children}</div>
        <DashboardNav />
      </div>
    </main>
  )
}