import BrandPanel from '../components/BrandPanel.jsx'
import formatNaira from '../utils/formatNaira.js'

export default function ProfilePreviewPage({ onContinue, profile }) {
  const firstName = profile.fullName.trim().split(' ')[0] || 'student'

  return (
    <main className="app-shell">
      <BrandPanel />
      <section className="form-panel" aria-label="Profile preview">
        <div className="onboarding-wrap">
          <div className="onboarding-topline">
            <span>STUDENT SETUP</span>
            <span>Preview complete</span>
          </div>
          <section className="completion-panel" aria-live="polite">
            <span className="completion-mark" aria-hidden="true">OK</span>
            <p className="form-kicker">PROFILE PREVIEW</p>
            <h2>You’ve got a starting plan, {firstName}.</h2>
            <p className="completion-intro">
              Here’s the goal you set for {profile.graduationYear}.
            </p>
            <dl className="summary-list">
              <div>
                <dt>Goal</dt>
                <dd>{formatNaira(profile.goalAmount)}</dd>
              </div>
              <div>
                <dt>Contribution</dt>
                <dd>{formatNaira(profile.contribution)} / {profile.cadence}</dd>
              </div>
              <div>
                <dt>Saving toward</dt>
                <dd>{profile.purpose}</dd>
              </div>
              <div>
                <dt>School</dt>
                <dd>{profile.institution}</dd>
              </div>
            </dl>
            <p className="privacy-note">This is a local preview, not a financial account.</p>
            <button className="primary-button reset-button" onClick={onContinue} type="button">
              Continue to home
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}