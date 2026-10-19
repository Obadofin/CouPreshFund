import { useState } from 'react'
import { Link } from 'react-router-dom'

const inviteCode = '48291'
const expiryText = 'Expires in 6 days 23hrs'

export default function InviteGuardianPage() {
  const [notice, setNotice] = useState('')
  const shareMessage = `Join me on CouPreshFund Grad. Use invite code ${inviteCode} to connect with my savings goal. It expires in 6 days 23 hours.`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`

  async function copyCode() {
    if (!navigator.clipboard?.writeText) {
      setNotice('Clipboard access is unavailable in this browser.')
      return
    }

    try {
      await navigator.clipboard.writeText(inviteCode)
      setNotice('Invite code copied.')
    } catch {
      setNotice('Could not copy the invite code. Please try again.')
    }
  }

  return (
    <main className="invite-screen">
      <div className="invite-page">
        <header className="invite-header">
          <Link className="invite-back" to="/goals" aria-label="Back to Goals">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </Link>
          <h1>Goals</h1>
        </header>

        <section className="invite-panel" aria-labelledby="invite-title">
          <h2 id="invite-title">Invite a parent or guardian</h2>
          <p className="invite-description">
            Share this code so they can see your progress and support your goal.
          </p>

          <div className="invite-code" aria-label={`Invite code ${inviteCode}`}>
            {inviteCode.split('').map((digit, index) => (
              <span key={`${digit}-${index}`}>{digit}</span>
            ))}
          </div>

          <p className="invite-expiry">{expiryText}</p>

          <div className="invite-actions">
            <button className="invite-copy" onClick={copyCode} type="button">
              Copy
            </button>
            <a
              className="invite-whatsapp"
              href={whatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </div>
          <p className="invite-notice" aria-live="polite" role="status">{notice}</p>
          <p className="invite-demo-note">Demo code only. It is not linked to an account.</p>
        </section>
      </div>
    </main>
  )
}