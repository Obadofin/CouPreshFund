import { useState } from 'react'
import './StudentDetailsPage.css'

function FieldIcon({ name }) {
  const icons = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  }
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  )
}

export default function StudentDetailsPage({
  error,
  isSubmitting,
  onBack,
  onChange,
  onSignIn,
  onNext,
  profile,
}) {
  const [validationError, setValidationError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')
    if (!profile.email.trim() && !profile.phone.trim()) {
      setValidationError('Enter an email address or phone number to create your account.')
      return
    }
    onNext()
  }

  return (
    <main className="account-creation-screen">
      <section aria-labelledby="account-title" className="account-creation-panel">
        <button aria-label="Back to welcome screen" className="account-brand" onClick={onBack} type="button">
          <span className="account-brand-mark">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32">
              <path d="m3 11 13-7 13 7-13 7-13-7Z" />
              <path d="M8 14v7c4 4 12 4 16 0v-7m5-3v9" />
            </svg>
          </span>
          <span className="account-brand-name">Coupresh<span>Fund</span></span>
        </button>

        <header className="account-creation-heading">
          <h1 id="account-title">Create your account</h1>
          <p>Join thousands of students building a better future.</p>
        </header>

        <form className="account-creation-form" onSubmit={handleSubmit}>
          <label className="account-field" htmlFor="fullName">
            <FieldIcon name="user" />
            <span className="visually-hidden">Full Name</span>
            <input
              autoComplete="name"
              id="fullName"
              name="fullName"
              onChange={onChange}
              placeholder="Full Name"
              required
              value={profile.fullName}
            />
          </label>

          <label className="account-field" htmlFor="email">
            <FieldIcon name="email" />
            <span className="visually-hidden">Email Address</span>
            <input
              autoComplete="email"
              id="email"
              name="email"
              onChange={onChange}
              placeholder="Email Address"
              type="email"
              value={profile.email}
            />
          </label>

          <label className="account-field" htmlFor="phone">
            <FieldIcon name="phone" />
            <span className="visually-hidden">Phone Number</span>
            <input
              autoComplete="tel"
              id="phone"
              name="phone"
              onChange={onChange}
              placeholder="Phone Number"
              type="tel"
              value={profile.phone}
            />
          </label>

          <label className="account-field" htmlFor="signupPassword">
            <FieldIcon name="lock" />
            <span className="visually-hidden">Password</span>
            <input
              autoComplete="new-password"
              id="signupPassword"
              minLength="8"
              name="password"
              onChange={onChange}
              placeholder="Password"
              required
              type="password"
              value={profile.password}
            />
          </label>

          {(validationError || error) && (
            <p className="account-form-error" role="alert">{validationError || error}</p>
          )}

          <button className="account-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="account-login-prompt">
          Already have an account?{' '}
          <button onClick={onSignIn} type="button">Log in</button>
        </p>
      </section>
    </main>
  )
}
