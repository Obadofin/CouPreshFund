function GraduationMark() {
  return (
    <span className="welcome-mark" aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <path d="M15 39 50 25l35 14-35 15L15 39Z" />
        <path d="M27 47v18c0 8 10 14 23 14s23-6 23-14V47" />
        <path d="M85 40v21" />
      </svg>
    </span>
  )
}

export default function WelcomePage({ onStart, onSignIn }) {
  return (
    <main className="welcome-screen">
      <div className="welcome-content">
        <header className="welcome-brand">
          <GraduationMark />
          <p>CouPreshFund Grad</p>
        </header>

        <section className="welcome-message" aria-labelledby="welcome-title">
          <h1 id="welcome-title">
            Save.Learn.<br />
            Grow.<br />
            Graduate.
          </h1>
          <p>
            <span>Join students building capital</span>
            <span>before convocation.</span>
          </p>
        </section>

        <div className="welcome-actions">
          <button className="welcome-primary" onClick={onStart} type="button">
            Get started, it's free
          </button>
          <button className="welcome-secondary" onClick={onSignIn} type="button">
            I already have an account
          </button>
        </div>
      </div>
    </main>
  )
}