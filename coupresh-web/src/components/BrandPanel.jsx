import { Link } from 'react-router-dom'

export default function BrandPanel() {
  return (
    <aside className="brand-panel">
      <div className="brand-content">
        <Link className="brand-lockup" to="/" aria-label="CouPreshFund home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-name">CouPreshFund</span>
        </Link>

        <div className="brand-message">
          <p className="brand-eyebrow">STUDENT MONEY, WITH A PLAN</p>
          <h1>Graduate with a plan, not just a degree.</h1>
          <p className="brand-description">
            Give your next chapter a strong start by building a saving habit
            while you are still in school.
          </p>
        </div>

        <div className="goal-preview" aria-label="Example savings goal preview">
          <div className="preview-topline">
            <span>YOUR GRADUATION GOAL</span>
            <span className="preview-status">IN PROGRESS</span>
          </div>
          <p className="preview-amount">N125,000</p>
          <div className="preview-progress" aria-hidden="true">
            <span />
          </div>
          <div className="preview-bottomline">
            <span>Small steps add up</span>
            <span>Example</span>
          </div>
        </div>

        <p className="brand-footnote">Built for the life after campus.</p>
      </div>
    </aside>
  )
}