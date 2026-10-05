import { useState } from 'react'
import BrandIdentity from '../components/BrandIdentity.jsx'

export default function SignInPage({ onBack, onCreateAccount }) {
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('Demo only. No sign-in request was sent and no details were saved.')
  }

  return (
    <main className="signin-screen">
      <section className="signin-panel" aria-labelledby="signin-title">
        <BrandIdentity onClick={onBack} />

        <header className="signin-heading">
          <h1 id="signin-title">Welcome Back</h1>
          <p>Sign in to continue your journey</p>
        </header>

        <form className="signin-form" onSubmit={handleSubmit}>
          <label className="signin-field" htmlFor="signinEmail">
            <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <circle cx="16" cy="10" r="6" />
              <path d="M5 28v-3a11 11 0 0 1 22 0v3H5Z" />
            </svg>
            <span className="visually-hidden">Email or phone number</span>
            <input
              autoComplete="username"
              id="signinEmail"
              name="emailOrPhone"
              placeholder="Email or Phone Number"
              required
              type="text"
            />
          </label>
          <label className="signin-field" htmlFor="signinPassword">
            <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <path d="M16 3 28 8v8c0 7-5 12-12 14C9 28 4 23 4 16V8l12-5Z" />
              <circle cx="16" cy="16" r="5" />
              <path d="M14.5 16h.01m3 0h.01" />
            </svg>
            <span className="visually-hidden">Password</span>
            <input
              autoComplete="current-password"
              id="signinPassword"
              minLength="8"
              name="password"
              placeholder="Password"
              required
              type={showPassword ? 'text' : 'password'}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                <path d="M3 16s5-9 13-9 13 9 13 9-5 9-13 9S3 16 3 16Z" />
                <circle cx="16" cy="16" r="4" />
              </svg>
            </button>
          </label>
          <button className="signin-submit" type="submit">Sign In</button>
        </form>

        <button
          className="signin-forgot"
          onClick={() => setMessage('Password recovery is not connected in this demo.')}
          type="button"
        >
          Forgot Password?
        </button>

        <div className="signin-divider" aria-hidden="true">
          <span />
          <span>or</span>
          <span />
        </div>

        <button className="signin-create" onClick={onCreateAccount} type="button">
          Create New Account
        </button>

        <p className="signin-feedback" aria-live="polite" role="status">{message}</p>

        <p className="signin-footer">
          Already have an account?{' '}
          <button onClick={() => setMessage('You are already on the sign-in preview.')} type="button">
            Log in
          </button>
        </p>
      </section>
    </main>
  )
}