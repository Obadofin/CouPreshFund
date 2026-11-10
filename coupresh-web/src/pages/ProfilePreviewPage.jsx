import BrandPanel from '../components/BrandPanel.jsx'
import formatNaira from '../utils/formatNaira.js'

export default function ProfilePreviewPage({ error, isSubmitting, onContinue, profile }) {
  const firstName = profile.fullName.trim().split(' ')[0] || 'student'

  return (
    <main className="app-shell">
      <BrandPanel />
      <section className="form-panel" aria-label="Account setup complete">
        <div className="onboarding-wrap">
          <div className="onboarding-topline">
            <span>STUDENT SETUP</span>
            <span>Setup complete</span>
          </div>
          <section className="completion-panel" aria-live="polite">
            <span className="completion-mark" aria-hidden="true">OK</span>
            <p className="form-kicker">YOUR STARTING PLAN</p>
            <h2>Your plan is ready, {firstName}.</h2>
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
            {error && <p className="account-form-error" role="alert">{error}</p>}
            <button
              className="primary-button reset-button"
              disabled={isSubmitting}
              onClick={onContinue}
              type="button"
            >
              {isSubmitting ? 'Saving your setup…' : 'Continue to home'}
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}