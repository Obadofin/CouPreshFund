import { useState } from 'react'
import './StudentDetailsPage.css'

export default function EmailVerificationPage({
  email,
  error,
  notice,
  isSubmitting,
  onResend,
  onVerify,
}) {
  const [code, setCode] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [isResending, setIsResending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    await onVerify(code.trim())
  }

  async function handleResend() {
    setResendMessage('')
    setIsResending(true)
    try {
      const result = await onResend()
      setResendMessage(result.message)
    } catch (resendError) {
      setResendMessage(resendError.message || 'Could not resend the code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <main className="account-creation-screen">
      <section aria-labelledby="verification-title" className="account-creation-panel">
        <header className="account-creation-heading">
          <h1 id="verification-title">Verify your email</h1>
          <p>Enter the six-digit code we sent to {email}. The code expires in 10 minutes.</p>
        </header>

        {notice && <p aria-live="polite" className="account-form-hint">{notice}</p>}

        <form className="account-creation-form" onSubmit={handleSubmit}>
          <label className="account-field" htmlFor="verificationCode">
            <span className="visually-hidden">Six-digit email verification code</span>
            <input
              autoComplete="one-time-code"
              autoFocus
              id="verificationCode"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              pattern="[0-9]{6}"
              placeholder="6-digit code"
              required
              value={code}
            />
          </label>

          {error && <p className="account-form-error" role="alert">{error}</p>}

          <button className="account-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        {resendMessage && <p aria-live="polite" className="account-form-hint">{resendMessage}</p>}
        <p className="account-login-prompt">
          Didn’t receive the email?{' '}
          <button disabled={isResending} onClick={handleResend} type="button">
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
      </section>
    </main>
  )
}
