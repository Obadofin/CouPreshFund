import OnboardingLayout from '../components/OnboardingLayout.jsx'

const goalSteps = ['Graduation goal', 'Savings plan']

export default function GoalSetupPage({ onBack, onChange, onNext, profile }) {
  return (
    <OnboardingLayout
      description="Set a graduation target and choose what you want to save for."
      onBack={onBack}
      onNext={onNext}
      step={0}
      stepLabels={goalSteps}
      statusText="Step 1 of 2"
      title="What are you saving for?"
    >
      <div className="field-stack">
        <div className="field-group">
          <label htmlFor="goalAmount">Graduation goal</label>
          <div className="money-input">
            <span aria-hidden="true">N</span>
            <input
              id="goalAmount"
              min="1000"
              name="goalAmount"
              onChange={onChange}
              placeholder="500,000"
              required
              step="1000"
              type="number"
              value={profile.goalAmount}
            />
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="purpose">What are you saving toward?</label>
          <select id="purpose" name="purpose" onChange={onChange} required value={profile.purpose}>
            <option value="">Choose a goal</option>
            <option>Starting a business</option>
            <option>Further studies</option>
            <option>Moving after graduation</option>
            <option>Building an emergency fund</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    </OnboardingLayout>
  )
}