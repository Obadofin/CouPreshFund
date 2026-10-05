function BrandContent() {
  return (
    <>
      <span className="signin-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" focusable="false">
          <path d="M34 10C26 21 16 31 16 42a17 17 0 0 0 34 0c0-11-8-22-16-32Z" />
          <path className="signin-leaf-detail" d="M34 23c-2 9-8 15-8 24 0 5 3 8 8 9" />
        </svg>
      </span>
      <span className="signin-brand-copy">
        <span className="signin-wordmark"><span>CouPresh</span><span>Fund</span></span>
        <span className="signin-tagline">SAVE | LEARN | GROW | GRADUATE</span>
      </span>
    </>
  )
}

export default function BrandIdentity({ onClick }) {
  if (onClick) {
    return (
      <button
        aria-label="Back to welcome screen"
        className="signin-brand"
        onClick={onClick}
        type="button"
      >
        <BrandContent />
      </button>
    )
  }

  return (
    <div className="signin-brand signin-brand-static" aria-label="CouPreshFund">
      <BrandContent />
    </div>
  )
}