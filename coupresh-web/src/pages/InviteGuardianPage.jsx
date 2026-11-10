import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createGuardianInvitation,
  getGuardianInvitations,
  revokeGuardianInvitation,
} from '../utils/authApi.js'

function formatExpiry(date) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export default function InviteGuardianPage() {
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState(null)
  const [newCode, setNewCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let active = true
    getGuardianInvitations()
      .then((invitations) => {
        if (active) {
          setInvitation(invitations.find((item) => item.status === 'pending') || null)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load invitations.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function createCode() {
    setError('')
    setNotice('')
    setIsCreating(true)
    try {
      const created = await createGuardianInvitation()
      setInvitation(created)
      setNewCode(created.code)
      setNotice('New code created. Any previous pending code has been revoked.')
    } catch (requestError) {
      setError(requestError.message || 'Could not create an invitation.')
    } finally {
      setIsCreating(false)
    }
  }

  async function revokeCode() {
    if (!invitation) return
    setError('')
    try {
      await revokeGuardianInvitation(invitation.id)
      setInvitation(null)
      setNewCode('')
      setNotice('Invitation revoked.')
    } catch (requestError) {
      setError(requestError.message || 'Could not revoke the invitation.')
    }
  }

  async function copyCode() {
    if (!navigator.clipboard?.writeText) {
      setNotice('Clipboard access is unavailable in this browser.')
      return
    }
    try {
      await navigator.clipboard.writeText(newCode)
      setNotice('Invite code copied.')
    } catch {
      setNotice('Could not copy the invite code. Please try again.')
    }
  }

  const shareMessage = `Join me on CouPreshFund Grad. Use invite code ${newCode} to connect with my savings goal. It expires on ${invitation ? formatExpiry(invitation.expiresAt) : ''}.`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`

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
            Create a one-time code to share with someone you trust. Codes expire after seven days.
          </p>

          {error && <p role="alert">{error}</p>}
          {isLoading ? <p aria-live="polite">Loading invitations…</p> : invitation && (
            <>
              {newCode ? (
                <div className="invite-code" aria-label={`Invite code ${newCode}`}>
                  {newCode.split('').map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}
                </div>
              ) : (
                <p className="invite-expiry">An active code exists, but it is shown only once when created.</p>
              )}
              <p className="invite-expiry">Expires {formatExpiry(invitation.expiresAt)}</p>
              {newCode && (
                <div className="invite-actions">
                  <button className="invite-copy" onClick={copyCode} type="button">Copy</button>
                  <a className="invite-whatsapp" href={whatsappUrl} rel="noreferrer" target="_blank">WhatsApp</a>
                </div>
              )}
              <button className="text-button" onClick={revokeCode} type="button">Revoke active code</button>
            </>
          )}

          {!isLoading && (
            <button className="invite-copy" disabled={isCreating} onClick={createCode} type="button">
              {isCreating ? 'Creating…' : invitation ? 'Create a new code' : 'Generate invite code'}
            </button>
          )}
          <p className="invite-notice" aria-live="polite" role="status">{notice}</p>
          <p className="invite-description">
            Invitation codes are securely stored and can be revoked. Guardian account linking and access to student data are not enabled yet.
          </p>
        </section>
      </div>
    </main>
  )
}
