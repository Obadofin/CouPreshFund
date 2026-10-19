import OnboardingLayout from '../components/OnboardingLayout.jsx'

export default function CampusDetailsPage({ graduationYears, onBack, onChange, onNext, profile }) {
  return (
    <OnboardingLayout
      description="Add the details that shape your graduation timeline."
      onBack={onBack}
      onNext={onNext}
      step={1}
      title="Tell us about school."
    >
      <div className="field-stack">
        <div className="field-group">
          <label htmlFor="institution">Institution</label>
          <input
            autoComplete="organization"
            id="institution"
            name="institution"
            onChange={onChange}
            placeholder="e.g. University of Lagos"
            required
            value={profile.institution}
          />
        </div>
        <div className="field-group">
          <label htmlFor="course">Course of study</label>
          <input
            id="course"
            name="course"
            onChange={onChange}
            placeholder="e.g. Computer Science"
            required
            value={profile.course}
          />
        </div>
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="level">Current level</label>
            <select id="level" name="level" onChange={onChange} required value={profile.level}>
              <option value="">Choose level</option>
              <option>100 level</option>
              <option>200 level</option>
              <option>300 level</option>
              <option>400 level</option>
              <option>500 level</option>
              <option>600 level</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="graduationYear">Graduation year</label>
            <select
              id="graduationYear"
              name="graduationYear"
              onChange={onChange}
              required
              value={profile.graduationYear}
            >
              <option value="">Choose year</option>
              {graduationYears.map((year) => <option key={year}>{year}</option>)}
            </select>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}