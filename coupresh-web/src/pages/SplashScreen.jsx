function GraduationMark() {
  return (
    <span className="splash-mark" aria-hidden="true">
      <svg viewBox="0 0 64 48" focusable="false">
        <path d="m3 15 29-12 29 12-29 13L3 15Z" />
        <path d="M13 20v13c0 7 9 12 19 12s19-5 19-12V20" />
        <path d="M61 16v18" />
      </svg>
    </span>
  )
}

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="Coupresh Fund">
      <section className="splash-center" aria-label="Welcome to Coupresh Fund">
        <GraduationMark />
        <h1 className="splash-wordmark">
          Coupresh<span>Fund</span>
        </h1>
        <p className="splash-tagline">Build Today. Launch Tomorrow.</p>
      </section>

      <footer className="splash-footer">
        <p>
          SAVE. LEARN. GROW. GRADUATE. <span>LAUNCH.</span>
        </p>
        <div className="splash-progress" role="status" aria-label="Loading Coupresh Fund">
          <span className="splash-progress-fill" aria-hidden="true" />
        </div>
      </footer>
    </main>
  )
}
