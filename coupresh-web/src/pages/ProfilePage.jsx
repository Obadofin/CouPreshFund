import DashboardShell from '../components/DashboardShell.jsx'
import formatNaira from '../utils/formatNaira.js'

export default function ProfilePage({ onLogout, profile }) {
  const profileDetails = [
    { label: 'Full name', value: profile.fullName || 'Ada Okafor' },
    { label: 'Email', value: profile.email || 'ada@example.com' },
    { label: 'Institution', value: profile.institution || 'University of Lagos' },
    { label: 'Course', value: profile.course || 'Computer Science' },
    { label: 'Current level', value: profile.level || '300 level' },
    { label: 'Graduation year', value: profile.graduationYear || '2028' },
    { label: 'Graduation goal', value: formatNaira(profile.goalAmount || 500000) },
    { label: 'Saving toward', value: profile.purpose || 'Starting a business' },
  ]

  return (
    <DashboardShell backTo="/home">
      <section className="profile-content" aria-labelledby="profile-title">
        <header className="profile-heading">
          <span className="profile-avatar" aria-hidden="true">
            {(profile.fullName || 'Ada Okafor')
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')}
          </span>
          <div>
            <h1 id="profile-title">Your profile</h1>
            <p>Student account</p>
          </div>
        </header>

        <dl className="profile-details">
          {profileDetails.map((detail) => (
            <div className="profile-detail" key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>

        <p className="profile-demo-note">Preview profile. Details are held in memory only.</p>
        <button className="profile-logout" onClick={onLogout} type="button">
          Log out
        </button>
      </section>
    </DashboardShell>
  )
}