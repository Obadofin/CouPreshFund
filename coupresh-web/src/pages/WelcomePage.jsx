import './WelcomePage.css'
import { Link } from 'react-router-dom'

export default function WelcomePage({ onStart, onSignIn }) {
  return (
    <main className="onboarding-splash">
      <header className="onboarding-splash-top">
        <span aria-hidden="true" />
        <button onClick={onStart} type="button">Skip</button>
      </header>

      <section className="onboarding-splash-content" aria-labelledby="welcome-title">
        <div className="onboarding-brand-art">
          <img
            alt="Coupresh Fund — Build Today. Launch Tomorrow."
            className="onboarding-logo"
            src="/coupreshfund-logo.png"
          />
          <span aria-hidden="true" className="onboarding-art-spark onboarding-art-spark-one" />
          <span aria-hidden="true" className="onboarding-art-spark onboarding-art-spark-two" />
        </div>

        <div className="onboarding-splash-copy">
          <h1 id="welcome-title">Your future starts here</h1>
          <p>Build your savings, gain valuable skills, and get ready for life after university.</p>
        </div>
      </section>

      <footer className="onboarding-splash-footer">
        <div aria-label="Introduction screen 1 of 3" className="onboarding-dots">
          <span className="is-current" />
          <span />
          <span />
        </div>
        <button className="onboarding-primary" onClick={onStart} type="button">Get Started</button>
        <button className="onboarding-login" onClick={onSignIn} type="button">
          I already have an account
        </button>
        <Link className="onboarding-privacy-link" to="/privacy">Privacy Policy</Link>
      </footer>
    </main>
  )
}
