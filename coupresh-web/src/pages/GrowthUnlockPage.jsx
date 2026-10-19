import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import formatNaira from '../utils/formatNaira.js'

const termOptions = [
  { label: '6m', months: 6 },
  { label: '1y', months: 12 },
  { label: '2y', months: 24 },
]

const annualRate = 0.08

function calculateProjection(monthlyAdd, months) {
  const monthlyRate = annualRate / 12
  const totalAdded = monthlyAdd * months
  const projectedValue = monthlyRate === 0
    ? totalAdded
    : monthlyAdd * (((1 + monthlyRate) ** months - 1) / monthlyRate)

  return {
    totalAdded,
    projectedValue: Math.round(projectedValue),
    projectedGrowth: Math.round(projectedValue - totalAdded),
  }
}

export default function GrowthUnlockPage({ onInvite }) {
  const [monthlyAdd, setMonthlyAdd] = useState(5000)
  const [termMonths, setTermMonths] = useState(24)
  const projection = calculateProjection(monthlyAdd, termMonths)
  const sliderProgress = ((monthlyAdd - 1000) / (25000 - 1000)) * 100

  return (
    <DashboardShell backTo="/home">
      <section className="growth-content" aria-labelledby="growth-title">
        <h1 id="growth-title">Growth Unlock</h1>

        <p className="growth-intro">
          Unlock at Grower. See how your savings could grow. This is a simulation.
        </p>

        <div className="growth-amount-heading">
          <label htmlFor="monthlyAdd">Monthly add</label>
          <output htmlFor="monthlyAdd">{formatNaira(monthlyAdd)}</output>
        </div>
        <input
          aria-label="Monthly contribution amount"
          className="growth-slider"
          id="monthlyAdd"
          max="25000"
          min="1000"
          onChange={(event) => setMonthlyAdd(Number(event.target.value))}
          step="1000"
          style={{ '--slider-progress': `${sliderProgress}%` }}
          type="range"
          value={monthlyAdd}
        />

        <div className="growth-controls" role="group" aria-label="Simulation term">
          {termOptions.map((option) => (
            <button
              aria-pressed={termMonths === option.months}
              className={termMonths === option.months ? 'is-selected' : ''}
              key={option.months}
              onClick={() => setTermMonths(option.months)}
              type="button"
            >
              {option.label}
            </button>
          ))}
          <span className="growth-rate">8%</span>
        </div>

        <section className="growth-result" aria-live="polite">
          <h2>Illustrative value at {termMonths === 6 ? '6 months' : `${termMonths / 12} ${termMonths === 12 ? 'year' : 'years'}`}</h2>
          <p className="growth-total">{formatNaira(projection.projectedValue)}</p>
          <p className="growth-breakdown">
            You add {formatNaira(projection.totalAdded)} ~ growth {formatNaira(projection.projectedGrowth)}
          </p>
        </section>

        <p className="growth-disclaimer">
          Illustrations only. Not advice. No money is moved or invested in this preview.
        </p>
        <button className="growth-invite-button" onClick={onInvite} type="button">
          Invite a parent or guardian
        </button>
      </section>
    </DashboardShell>
  )
}