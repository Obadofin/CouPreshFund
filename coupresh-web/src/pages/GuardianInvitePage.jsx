import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  acceptGuardianInvitation,
  loginGuardian,
  registerGuardian,
  resendGuardianVerification,
  verifyGuardianEmail,
} from '../utils/authApi.js'

export default function GuardianInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLinked, setIsLinked] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)

    try {
      if (mode === 'register') {
        const result = await registerGuardian({
          fullName: String(formData.get('fullName')).trim(),
          email: String(formData.get('email')).trim(),
          password: String(formData.get('password')),
          inviteCode: inviteCode.trim(),
        })
        setEmail(result.email)
        setMode('verify')
        setMessage(result.emailSent
          ? 'We sent a verification code to your email.'
          : 'Your account is created. Resend a verification code to continue.')
      } else if (mode === 'verify') {
        const result = await verifyGuardianEmail({
          email,
          code: String(formData.get('verificationCode')).trim(),
        })
        setIsLinked(result.linked)
        setMessage(result.message)
        if (result.linked) navigate('/guardian/dashboard')
      } else {
        const guardianEmail = String(formData.get('email')).trim()
        try {
          await loginGuardian({
            email: guardianEmail,
            password: String(formData.get('password')),
          })
        } catch (loginError) {
          if (loginError.status !== 403) throw loginError
          setEmail(guardianEmail)
          setMode('verify')
          const result = await resendGuardianVerification(guardianEmail)
          setMessage(result.message)
          return
        }
        const result = await acceptGuardianInvitation(inviteCode.trim())
        setIsLinked(result.linked)
        setMessage(result.message)
        if (result.linked) navigate('/guardian/dashboard')
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not complete the guardian invitation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resendCode() {
    setError('')
    try {
      const result = await resendGuardianVerification(email)
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.message || 'Could not resend the verification code.')
    }
  }

  return (
    <main className="invite-screen">
      <div className="invite-page">
        <header className="invite-header">
          <Link className="invite-back" to="/" aria-label="Back to CouPreshFund">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </Link>
          <h1>Guardian invitation</h1>
        </header>

        <section className="invite-panel guardian-invite-panel" aria-labelledby="guardian-invite-title">
          <h2 id="guardian-invite-title">
            {isLinked ? 'Invitation accepted' : 'Connect with a student'}
          </h2>
          {isLinked ? (
            <>
              <p className="invite-description" role="status">{message}</p>
              <p className="guardian-access-note">
                Your account is linked. Student dashbaord access is granted.
              </p>
              <Link className="invite-copy guardian-home-link" to="/guardian/dashboard">Return to CouPreshFund</Link>
            </>
          ) : (
            <>
              <p className="invite-description">
                Use the six-digit code shared by the student. It is valid for seven days and can only be used once.
              </p>
              <label className="guardian-invite-field" htmlFor="guardianInviteCode">
                Invite code
                <input
                  autoComplete="one-time-code"
                  id="guardianInviteCode"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setInviteCode(event.target.value.replace(/\D/g, ''))}
                  pattern="[0-9]{6}"
                  required
                  value={inviteCode}
                />
              </label>

              {mode !== 'verify' && (
                <div className="guardian-mode-toggle" role="group" aria-label="Guardian account option">
                  <button
                    aria-pressed={mode === 'login'}
                    className={mode === 'login' ? 'is-selected' : ''}
                    onClick={() => setMode('login')}
                    type="button"
                  >
                    I have an account
                  </button>
                  <button
                    aria-pressed={mode === 'register'}
                    className={mode === 'register' ? 'is-selected' : ''}
                    onClick={() => setMode('register')}
                    type="button"
                  >
                    Create account
                  </button>
                </div>
              )}

              <form className="guardian-invite-form" onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <label className="guardian-invite-field" htmlFor="guardianFullName">
                    Full name
                    <input autoComplete="name" id="guardianFullName" name="fullName" minLength={2} required />
                  </label>
                )}
                {mode !== 'verify' && (
                  <label className="guardian-invite-field" htmlFor="guardianEmail">
                    Email address
                    <input
                      autoComplete="email"
                      id="guardianEmail"
                      name="email"
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      type="email"
                      value={email}
                    />
                  </label>
                )}
                {mode === 'verify' && (
                  <>
                    <p className="guardian-verify-copy">Enter the verification code sent to {email}.</p>
                    <label className="guardian-invite-field" htmlFor="guardianVerificationCode">
                      Six-digit email code
                      <input
                        autoComplete="one-time-code"
                        autoFocus
                        id="guardianVerificationCode"
                        inputMode="numeric"
                        maxLength={6}
                        name="verificationCode"
                        pattern="[0-9]{6}"
                        required
                      />
                    </label>
                  </>
                )}
                {mode !== 'verify' && (
                  <label className="guardian-invite-field" htmlFor="guardianPassword">
                    Password
                    <input
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      id="guardianPassword"
                      minLength={mode === 'register' ? 8 : undefined}
                      name="password"
                      required
                      type="password"
                    />
                    {mode === 'register' && (
                      <small className="guardian-field-hint">Use at least 8 characters, including a letter and a number.</small>
                    )}
                  </label>
                )}

                {error && <p className="guardian-form-error" role="alert">{error}</p>}
                {message && !isLinked && <p className="invite-notice" role="status">{message}</p>}
                <button className="invite-copy guardian-submit" disabled={isSubmitting} type="submit">
                  {isSubmitting
                    ? 'Please wait…'
                    : mode === 'verify'
                      ? 'Verify email and link account'
                      : mode === 'register'
                        ? 'Create account and continue'
                        : 'Sign in and link account'}
                </button>
              </form>

              {mode === 'verify' && (
                <>
                  <button className="guardian-resend" onClick={resendCode} type="button">
                    Resend verification code
                  </button>
                  <button className="guardian-resend" onClick={() => setMode('login')} type="button">
                    Already have a guardian account? Sign in
                  </button>
                </>
              )}
              <p className="guardian-access-note">
                Linking confirms your relationship with the student.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
