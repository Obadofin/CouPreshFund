import { useRef } from 'react'
import BrandIdentity from '../components/BrandIdentity.jsx'
import formatNaira from '../utils/formatNaira.js'

const cadenceOptions = [
  { value: 'weekly', label: 'Weekly', weeks: 1 },
  { value: 'monthly', label: 'Monthly', weeks: 52 / 12 },
  { value: 'yearly', label: 'Yearly', weeks: 52 },
]

const amountPresets = [2000, 5000, 7500]
const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000
const appLoadedAt = Date.now()

function graduationDateFor(year) {
  return year ? new Date(Number(year), 5, 1) : null
}

function formatGraduationDate(date) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function SavingsPlanPage({ onAmountChange, onBack, onChange, onNext, profile }) {
  const amountInput = useRef(null)
  const amount = Number(profile.contribution)
  const goal = Number(profile.goalAmount)
  const selectedCadence = cadenceOptions.find((option) => option.value === profile.cadence)
  const graduationDate = graduationDateFor(profile.graduationYear)
  const weeksToGraduation = graduationDate
    ? Math.max(0, Math.ceil((graduationDate.getTime() - appLoadedAt) / millisecondsPerWeek))
    : 0
  const weeksToGoal = amount > 0 && goal > 0 && selectedCadence
    ? Math.ceil((goal / amount) * selectedCadence.weeks)
    : 0
  const customAmountSelected = !amountPresets.includes(amount)

  function handleSubmit(event) {
    event.preventDefault()
    onNext()
  }

  function getAdvice() {
    if (!weeksToGoal || !graduationDate) {
      return 'Choose a contribution amount to see how this plan fits your graduation goal.'
    }

    if (weeksToGoal <= weeksToGraduation) {
      const weeksAhead = weeksToGraduation - weeksToGoal
      return `At this pace, you could reach your goal about ${weeksAhead} ${weeksAhead === 1 ? 'week' : 'weeks'} before graduation.`
    }

    const weeksShort = weeksToGoal - weeksToGraduation
    return `At this pace, you may need about ${weeksShort} more ${weeksShort === 1 ? 'week' : 'weeks'} after graduation. Try increasing your amount or saving more often.`
  }

  return (
    <main className="savings-screen">
      <div className="savings-page">
        <header className="savings-header">
          <BrandIdentity />
          <button className="savings-back" onClick={onBack} type="button" aria-label="Back to goal setup">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </button>
        </header>

        <section className="savings-sheet" aria-labelledby="savings-title">
          <div className="savings-step-label">Step 2 of 2</div>
          <div className="savings-progress" role="progressbar" aria-label="Setup progress" aria-valuemin="1" aria-valuemax="2" aria-valuenow="2">
            <span />
          </div>

          <h1 id="savings-title">Set your savings plan</h1>

          <form className="savings-form" onSubmit={handleSubmit}>
            <fieldset className="savings-cadence">
              <legend>How often will you save?</legend>
              <div className="savings-cadence-options">
                {cadenceOptions.map((option) => (
                  <label className="savings-cadence-option" key={option.value}>
                    <input
                      checked={profile.cadence === option.value}
                      name="cadence"
                      onChange={onChange}
                      required
                      type="radio"
                      value={option.value}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="savings-amount-group">
              <label className="savings-amount-label" htmlFor="contributionAmount">
                Contribution amount
              </label>
              <div className="savings-amount-field">
                <span aria-hidden="true">N</span>
                <input
                  ref={amountInput}
                  id="contributionAmount"
                  min="100"
                  name="contribution"
                  onChange={onChange}
                  required
                  step="100"
                  type="number"
                  value={profile.contribution}
                />
              </div>
              <div className="savings-amount-presets" aria-label="Choose an amount or enter a custom amount">
                {amountPresets.map((preset) => (
                  <button
                    aria-pressed={amount === preset}
                    className={amount === preset ? 'is-selected' : ''}
                    key={preset}
                    onClick={() => onAmountChange(String(preset))}
                    type="button"
                  >
                    {preset === 7500 ? 'N7.5k' : `N${preset / 1000}k`}
                  </button>
                ))}
                <button
                  aria-pressed={customAmountSelected}
                  className={customAmountSelected ? 'is-selected' : ''}
                  onClick={() => {
                    onAmountChange('')
                    amountInput.current?.focus()
                  }}
                  type="button"
                >
                  Custom
                </button>
              </div>
            </div>

            <section className="savings-summary" aria-live="polite">
              <h2>Your plan</h2>
              <p>
                {amount > 0 && selectedCadence
                  ? `${formatNaira(amount)} ${selectedCadence.value === 'yearly' ? 'every year' : `every ${selectedCadence.value.replace('ly', '')}`}`
                  : 'Choose an amount and frequency'}
              </p>
              <p>
                Goal {formatNaira(goal)} by {graduationDate ? formatGraduationDate(graduationDate) : 'your graduation'}
              </p>
              <p>{weeksToGoal ? `About ${weeksToGoal} weeks to reach it` : 'Your timeline will appear here'}</p>
            </section>

            <aside className="savings-advice" aria-live="polite">
              <h2>Advice</h2>
              <p>{getAdvice()}</p>
            </aside>

            <button className="savings-continue" type="submit">Continue</button>
            <p className="savings-demo-note">Mock plan only. No money will be moved or saved.</p>
          </form>
        </section>
      </div>
    </main>
  )
}