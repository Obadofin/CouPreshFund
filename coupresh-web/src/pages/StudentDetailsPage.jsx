import OnboardingLayout from '../components/OnboardingLayout.jsx'

export default function StudentDetailsPage({ onBack, onChange, onNext, profile }) {
  return (
    <OnboardingLayout
      description="Start with the basics for your student profile."
      onBack={onBack}
      onNext={onNext}
      step={0}
      title="Let’s get to know you."
    >
      <div className="field-stack">
        <div className="field-group">
          <label htmlFor="fullName">Full name</label>
          <input
            autoComplete="name"
            id="fullName"
            name="fullName"
            onChange={onChange}
            placeholder="e.g. Amara Okafor"
            required
            value={profile.fullName}
          />
        </div>
        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            onChange={onChange}
            placeholder="you@example.com"
            required
            type="email"
            value={profile.email}
          />
        </div>
      </div>
    </OnboardingLayout>
  )
}