import BrandPanel from './BrandPanel.jsx'

const defaultStepLabels = ['Your details', 'Campus life', 'Your goal']

export default function OnboardingLayout({
  children,
  description,
  nextLabel = 'Continue',
  onBack,
  onNext,
  step,
  stepLabels = defaultStepLabels,
  statusText = 'About 2 minutes',
  title,
}) {
  function handleSubmit(event) {
    event.preventDefault()
    onNext()
  }

  return (
    <main className="app-shell">
      <BrandPanel />
      <section className="form-panel" aria-label="Student onboarding">
        <div className="onboarding-wrap">
          <div className="onboarding-topline">
            <span>STUDENT SETUP</span>
            <span>{statusText}</span>
          </div>

          <ol className="step-list" aria-label="Onboarding progress">
            {stepLabels.map((label, index) => (
              <li
                className={[
                  'step-item',
                  index === step ? 'is-current' : '',
                  index < step ? 'is-complete' : '',
                ].filter(Boolean).join(' ')}
                key={label}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="step-number">{index < step ? 'OK' : `0${index + 1}`}</span>
                <span className="step-label">{label}</span>
              </li>
            ))}
          </ol>

          <header className="form-heading">
            <p className="form-kicker">STEP 0{step + 1} / 0{stepLabels.length}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </header>

          <form className="onboarding-form" onSubmit={handleSubmit}>
            {children}
            <div className="form-actions">
              <button className="back-button" onClick={onBack} type="button">
                Back
              </button>
              <button className="primary-button" type="submit">
                {nextLabel}
              </button>
            </div>
          </form>
          <p className="privacy-note">Demo only. Your details stay in this page and are not sent or saved.</p>
        </div>
      </section>
    </main>
  )
}