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
          setInvitation(
            invitations.find((item) => item.status === 'pending')
              || invitations.find((item) => item.status === 'accepted')
              || null,
          )
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

  async function copyInviteLink() {
    if (!navigator.clipboard?.writeText) {
      setNotice('Clipboard access is unavailable in this browser.')
      return
    }
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setNotice('Guardian invitation link copied.')
    } catch {
      setNotice('Could not copy the invitation link. Please use WhatsApp to share it.')
    }
  }

  const inviteUrl = `${window.location.origin}/guardian/invite?code=${encodeURIComponent(newCode)}`
  const shareMessage = `Join me on CouPreshFund. Use this link to create a guardian account or sign in to an existing one and link to my profile: ${inviteUrl} Invite code: ${newCode}. It expires on ${invitation ? formatExpiry(invitation.expiresAt) : ''}.`
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
          <ol className="guardian-invite-instructions">
            <li>Share the code or WhatsApp link with your chosen guardian.</li>
            <li>They open the link, then create and verify a guardian account or sign in to an existing guardian account.</li>
            <li>They enter the code to link their account to yours. The code can only be used once.</li>
          </ol>

          {error && <p role="alert">{error}</p>}
          {isLoading ? <p aria-live="polite">Loading invitations…</p> : invitation && (
            <>
              {newCode ? (
                <div className="invite-code" aria-label={`Invite code ${newCode}`}>
                  {newCode.split('').map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}
                </div>
              ) : invitation.status === 'accepted' ? (
                <p className="invite-expiry">
                  Invitation accepted{invitation.guardianName ? ` by ${invitation.guardianName}` : ''}.
                </p>
              ) : (
                <p className="invite-expiry">An active code exists, but it is shown only once when created.</p>
              )}
              {invitation.status === 'pending' && (
                <p className="invite-expiry">Expires {formatExpiry(invitation.expiresAt)}</p>
              )}
              {newCode && (
                <div className="invite-actions guardian-share-actions">
                  <button className="invite-copy" onClick={copyCode} type="button">Copy code</button>
                  <button className="invite-copy" onClick={copyInviteLink} type="button">Copy link</button>
                  <a className="invite-whatsapp" href={whatsappUrl} rel="noreferrer" target="_blank">WhatsApp</a>
                </div>
              )}
              {invitation.status === 'pending' && (
                <button className="text-button" onClick={revokeCode} type="button">Revoke active code</button>
              )}
            </>
          )}

          {!isLoading && (
            <button className="invite-copy" disabled={isCreating} onClick={createCode} type="button">
              {isCreating ? 'Creating…' : invitation?.status === 'pending' ? 'Create a new code' : 'Generate invite code'}
            </button>
          )}
          <p className="invite-notice" aria-live="polite" role="status">{notice}</p>
          <p className="invite-description">
            The code is stored securely and can be revoked before it is used. Linking confirms the relationship only; guardian access to student dashboard data is not available yet.
          </p>
        </section>
      </div>
    </main>
  )
}
