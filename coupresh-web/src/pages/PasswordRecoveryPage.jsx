import { useState } from 'react'
import BrandIdentity from '../components/BrandIdentity.jsx'

export default function PasswordRecoveryPage({
  onBackToLogin,
  onRequestCode,
  onResetPassword,
}) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeRequested, setCodeRequested] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  async function handleRequestCode() {
    setFeedback('')
    setIsSubmitting(true)
    try {
      const result = await onRequestCode(email)
      setCodeRequested(true)
      setFeedback(result.message)
    } catch (error) {
      setFeedback(error.message || 'Could not request a reset code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!codeRequested) {
      await handleRequestCode()
      return
    }

    setFeedback('')
    if (newPassword !== confirmPassword) {
      setFeedback('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onResetPassword({ email, code, newPassword })
      setIsComplete(true)
      setFeedback(result.message)
    } catch (error) {
      setFeedback(error.message || 'Could not reset your password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="signin-screen">
      <section className="signin-panel" aria-labelledby="recovery-title">
        <BrandIdentity onClick={onBackToLogin} />

        <header className="signin-heading">
          <h1 id="recovery-title">
            {isComplete ? 'Password Updated' : 'Forgot Password?'}
          </h1>
          <p>
            {isComplete
              ? 'Your account is secure with your new password.'
              : 'We’ll email you a code to verify your account.'}
          </p>
        </header>

        {isComplete ? (
          <button
            className="signin-submit"
            onClick={onBackToLogin}
            type="button"
          >
            Back to Sign In
          </button>
        ) : (
          <form className="signin-form recovery-form" onSubmit={handleSubmit}>
            <label className="signin-field recovery-field" htmlFor="recoveryEmail">
              <span className="visually-hidden">Email address</span>
              <input
                autoComplete="email"
                disabled={codeRequested}
                id="recoveryEmail"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email Address"
                required
                type="email"
                value={email}
              />
            </label>

            {codeRequested && (
              <>
                <label className="signin-field recovery-field" htmlFor="recoveryCode">
                  <span className="visually-hidden">Six-digit reset code</span>
                  <input
                    autoComplete="one-time-code"
                    id="recoveryCode"
                    inputMode="numeric"
                    maxLength={6}
                    name="code"
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    pattern="\d{6}"
                    placeholder="6-digit code"
                    required
                    value={code}
                  />
                </label>
                <label className="signin-field recovery-field" htmlFor="newPassword">
                  <span className="visually-hidden">New password</span>
                  <input
                    autoComplete="new-password"
                    id="newPassword"
                    minLength={8}
                    name="newPassword"
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New Password"
                    required
                    type="password"
                    value={newPassword}
                  />
                </label>
                <label className="signin-field recovery-field" htmlFor="confirmPassword">
                  <span className="visually-hidden">Confirm new password</span>
                  <input
                    autoComplete="new-password"
                    id="confirmPassword"
                    minLength={8}
                    name="confirmPassword"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm New Password"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>
              </>
            )}

            <button className="signin-submit" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? 'Please wait…'
                : codeRequested ? 'Reset Password' : 'Send Reset Code'}
            </button>
            {codeRequested && (
              <button
                className="signin-forgot recovery-resend"
                disabled={isSubmitting}
                onClick={handleRequestCode}
                type="button"
              >
                Resend code
              </button>
            )}
          </form>
        )}

        {feedback && (
          <p
            className={isComplete ? 'recovery-notice recovery-success' : 'recovery-notice'}
            role={isComplete ? 'status' : 'alert'}
          >
            {feedback}
          </p>
        )}

        {!isComplete && (
          <button className="signin-forgot" onClick={onBackToLogin} type="button">
            Back to Sign In
          </button>
        )}
      </section>
    </main>
  )
}
