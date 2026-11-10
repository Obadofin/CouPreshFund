import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  addStudentContribution,
  addStudentExpense,
  getLearningLesson,
  getLearningLessons,
  getStudentLessonProgress,
  getStudentExpenses,
  getStudentBudgets,
  getStudentDashboard,
  getStudentPoints,
  getStudentPointTransactions,
  getSkillChallenges,
  getSkillChallenge,
  getStudentSkillProjects,
  saveStudentSkillProject,
  getOpportunities,
  getOpportunity,
  getSavedOpportunities,
  saveOpportunity,
  removeSavedOpportunity,
  saveStudentLessonProgress,
  saveStudentBudget,
} from '../utils/authApi.js'
import formatNaira from '../utils/formatNaira.js'
import './DashboardExperience.css'

const navigation = [
  { label: 'Home', path: '/home', icon: 'home' },
  { label: 'My Money', path: '/money', icon: 'wallet' },
  { label: 'My Growth', path: '/growth', icon: 'growth' },
  { label: 'My Future', path: '/future', icon: 'future' },
  { label: 'Profile', path: '/profile', icon: 'profile' },
]

function Icon({ name, size = 22 }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9Z" /></>,
    wallet: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H5a2 2 0 0 1-2-2V5.5Z" /><path d="M3 7h17M15 12h5v4h-5a2 2 0 0 1 0-4Z" /></>,
    growth: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    future: <><path d="m12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z" /><path d="m19 15 1.2 3.3L23 19.5l-2.8 1.2L19 24l-1.2-3.3-2.8-1.2 2.8-1.2L19 15Z" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    back: <path d="m15 4-8 8 8 8" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    cap: <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3 3 9 3 12 0v-5M22 9v6" /></>,
    award: <><circle cx="12" cy="8" r="6" /><path d="m8 13-1 9 5-3 5 3-1-9" /></>,
    people: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8m2 3a5 5 0 0 1 3 4v2" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></>,
    sparkle: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    code: <><path d="m8 5-6 7 6 7M16 5l6 7-6 7M14 3l-4 18" /></>,
    bulb: <><path d="M9 18h6m-5 4h4m-5-7a7 7 0 1 1 6 0c-.8.5-1 1.2-1 3h-4c0-1.8-.2-2.5-1-3Z" /></>,
    coins: <><circle cx="8" cy="8" r="5" /><path d="M8 5v6m-2-4h3m8 1a5 5 0 0 1 0 10m-3 2a5 5 0 0 0 0-10m4 4v6m-2-4h3" /></>,
    file: <><path d="M5 3h9l5 5v13H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v6h6" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    book: <><path d="M5 3h14v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M7 7h10M7 11h10" /></>,
    flame: <><path d="M13 2c1 5-4 6-3 10 1-2 3-3 4-4 1 4 5 6 5 10a7 7 0 0 1-14 0c0-4 2-7 5-10 1-2 2-4 3-6Z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.2 1-1.9 1.3-1.9 3.1M12 17.5v.1" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  }
  return (
    <svg aria-hidden="true" focusable="false" height={size} viewBox="0 0 24 24" width={size} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      {paths[name] || paths.sparkle}
    </svg>
  )
}

function Header({ title, backTo, trailing }) {
  const navigate = useNavigate()
  return (
    <header className={`experience-header${title ? ' has-title' : ''}`}>
      {backTo && (
        <button aria-label="Go back" className="experience-back" onClick={() => navigate(backTo)} type="button">
          <Icon name="back" />
        </button>
      )}
      {title ? <h1>{title}</h1> : <span />}
      {trailing || <span className="header-spacer" />}
    </header>
  )
}

function ProgressBar({ value, label }) {
  return (
    <div aria-label={label} aria-valuemax="100" aria-valuemin="0" aria-valuenow={value} className="experience-progress" role="progressbar">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

function Card({ children, className = '' }) {
  return <section className={`experience-card ${className}`}>{children}</section>
}

function SectionTitle({ children, action }) {
  return <div className="experience-section-title"><h2>{children}</h2>{action}</div>
}

function Segmented({ options, selected, onSelect, label }) {
  return (
    <div aria-label={label} className="experience-segmented" role="group">
      {options.map((option) => (
        <button aria-pressed={selected === option} className={selected === option ? 'is-selected' : ''} key={option} onClick={() => onSelect(option)} type="button">
          {option}
        </button>
      ))}
    </div>
  )
}

function ListRow({ icon, title, detail, action, tone = 'green', onClick }) {
  const content = (
    <>
      <span className={`experience-row-icon tone-${tone}`}><Icon name={icon} /></span>
      <span className="experience-row-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
      {action || <Icon name="chevron" size={19} />}
    </>
  )
  return onClick ? <button className="experience-list-row" onClick={onClick} type="button">{content}</button> : <div className="experience-list-row">{content}</div>
}

function StatusNotice({ children }) {
  return children ? <p aria-live="polite" className="experience-notice" role="status">{children}</p> : null
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function HomeScreen({ dashboard, profile, navigate, showNotice }) {
  const firstName = profile.fullName?.trim().split(/\s+/)[0] || 'Chidi'
  const savings = dashboard?.savings
  const goal = savings?.goalAmount ?? (Number(profile.goalAmount) || 0)
  const saved = savings?.totalSaved ?? 0
  const percent = savings?.progressPercent ?? 0
  const graduationYear = Number(profile.graduationYear) || ''
  const recentContributions = savings?.recentContributions ?? []
  const monthsToGraduation = Math.max(
    0,
    (graduationYear - new Date().getFullYear()) * 12 + 5 - new Date().getMonth()
      - (new Date().getDate() > 1 ? 1 : 0),
  )
  return (
    <>
      <Header trailing={<div className="home-actions"><button aria-label="Notifications" className="round-action" onClick={() => showNotice('You’re all caught up.')} type="button"><Icon name="bell" /></button><button aria-label="Open profile" className="home-avatar" onClick={() => navigate('/profile')} type="button">{firstName.slice(0, 2).toUpperCase()}</button></div>} />
      <div className="experience-body home-body">
        <div className="home-greeting"><h1>Good morning, {firstName}</h1><p>Your future is taking shape.</p></div>
        <section className="journey-banner">
          <strong>Your Journey to Graduation</strong>
          <p>{graduationYear ? <>Expected: Jun {graduationYear} <span>•</span> {monthsToGraduation} months left</> : 'Add your graduation details to set a timeline.'}</p>
          <span className="stage-pill">Current stage: Grow</span>
          <p className="journey-next">Next: Complete your financial readiness assessment</p>
        </section>
        <SectionTitle>Your Journey</SectionTitle>
        <section className="journey-stages" aria-label="Journey stages">
          {[['wallet', 'Save', 'On track'], ['book', 'Learn', '8/12'], ['growth', 'Grow', '2 projects'], ['cap', 'Graduate', 'In progress'], ['future', 'Launch', 'Not started']].map(([icon, title, detail], i) => (
            <button className={`journey-stage${i === 2 ? ' current' : ''}`} key={title} onClick={() => navigate(i === 0 ? '/money' : i === 1 ? '/learn' : '/growth')} type="button">
              <span><Icon name={icon} /></span><strong>{title}</strong><small>{detail}</small>
            </button>
          ))}
        </section>
        <Card className="fund-card">
          <div className="card-title-row"><h2>Graduation Fund</h2><button aria-label="View My Money" className="icon-link" onClick={() => navigate('/money')} type="button"><Icon name="chevron" /></button></div>
          <p className="fund-amount">{formatNaira(saved)} <small>/ {formatNaira(goal)}</small></p>
          <div className="fund-progress-line"><ProgressBar label="Graduation fund progress" value={percent} /><strong>{percent}%</strong></div>
          {goal > 0 && <p className="fund-milestone">Remaining: {formatNaira(savings?.remainingAmount ?? goal)}</p>}
          <div className="fund-bottom"><span>{savings?.monthlyPlanAmount ? `Monthly plan: ${formatNaira(savings.monthlyPlanAmount)}` : 'No savings plan yet'}</span><button className="small-primary" onClick={() => navigate('/money')} type="button">View Plan</button></div>
        </Card>
        <SectionTitle>Recent Activity</SectionTitle>
        <Card className="activity-card">
          {recentContributions.length
            ? recentContributions.slice(0, 2).map((contribution) => (
              <ListRow
                icon="check"
                key={contribution.id}
                title={contribution.note || 'Self-reported savings'}
                detail={new Date(contribution.createdAt).toLocaleDateString('en-NG')}
                action={<strong className="positive">+{formatNaira(contribution.amount)}</strong>}
              />
            ))
            : <p>No savings contributions recorded yet.</p>}
        </Card>
      </div>
    </>
  )
}

function MoneyScreen({ dashboard, profile, navigate, showNotice, onAddContribution, onSaveGoal }) {
  const [tab, setTab] = useState('Graduation Fund')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalForm, setGoalForm] = useState({})
  const [goalError, setGoalError] = useState('')
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const savings = dashboard?.savings
  const onboarding = dashboard?.onboarding || profile
  const saved = savings?.totalSaved ?? 0
  const goal = savings?.goalAmount ?? 0
  const percent = savings?.progressPercent ?? 0

  async function submitContribution(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onAddContribution({ amount, note })
      setAmount('')
      setNote('')
    } catch (requestError) {
      setError(requestError.message || 'Could not record your contribution.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitGoal(event) {
    event.preventDefault()
    setGoalError('')
    setIsSavingGoal(true)
    try {
      await onSaveGoal(goalForm)
      setIsEditingGoal(false)
      showNotice('Graduation goal updated.')
    } catch (requestError) {
      setGoalError(requestError.message || 'Could not save your goal.')
    } finally {
      setIsSavingGoal(false)
    }
  }

  return (
    <>
      <Header title="My Money" trailing={<button aria-label="Notifications" className="plain-action" onClick={() => showNotice('You’re all caught up.')} type="button"><Icon name="bell" /></button>} />
      <div className="experience-body money-body">
        <Segmented label="Money sections" options={['Graduation Fund', 'Budgets', 'Goals']} selected={tab} onSelect={(value) => value === 'Budgets' ? navigate('/money/budget') : setTab(value)} />
        {tab === 'Goals' ? (
          <Card className="money-fund-card">
            <div className="card-title-row"><h2>Graduation Goal</h2><span className="subtle">Active</span></div>
            <p className="fund-amount">{formatNaira(saved)} <small>/ {goal ? formatNaira(goal) : 'Goal not set'}</small></p>
            <div className="fund-progress-line"><ProgressBar label="Graduation goal progress" value={percent} /><strong>{percent}%</strong></div>
            <p className="fund-milestone">{onboarding.purpose || 'Your savings target for graduation.'}</p>
            {!isEditingGoal ? (
              <button
                className="primary-button full-button"
                onClick={() => {
                  setGoalForm({
                    institution: onboarding.institution || '',
                    course: onboarding.course || '',
                    level: onboarding.level || '',
                    graduationYear: onboarding.graduationYear || '',
                    goalAmount: onboarding.goalAmount || '',
                    purpose: onboarding.purpose || '',
                    contribution: onboarding.contribution || '',
                    cadence: onboarding.cadence || '',
                  })
                  setGoalError('')
                  setIsEditingGoal(true)
                }}
                type="button"
              >
                {goal ? 'Edit graduation goal' : 'Set graduation goal'}
              </button>
            ) : (
              <form className="budget-editor" onSubmit={submitGoal}>
                <label htmlFor="goal-institution">Institution</label>
                <input
                  autoComplete="organization"
                  id="goal-institution"
                  maxLength="200"
                  onChange={(event) => setGoalForm((current) => ({ ...current, institution: event.target.value }))}
                  required
                  value={goalForm.institution || ''}
                />
                <label htmlFor="goal-course">Course of study</label>
                <input
                  id="goal-course"
                  maxLength="150"
                  onChange={(event) => setGoalForm((current) => ({ ...current, course: event.target.value }))}
                  required
                  value={goalForm.course || ''}
                />
                <label htmlFor="goal-level">Current level</label>
                <select
                  id="goal-level"
                  onChange={(event) => setGoalForm((current) => ({ ...current, level: event.target.value }))}
                  required
                  value={goalForm.level || ''}
                >
                  <option value="">Choose level</option>
                  {['100 level', '200 level', '300 level', '400 level', '500 level', '600 level']
                    .map((level) => <option key={level}>{level}</option>)}
                </select>
                <label htmlFor="goal-graduation-year">Graduation year</label>
                <input
                  id="goal-graduation-year"
                  max={new Date().getFullYear() + 15}
                  min={new Date().getFullYear()}
                  onChange={(event) => setGoalForm((current) => ({ ...current, graduationYear: event.target.value }))}
                  required
                  type="number"
                  value={goalForm.graduationYear || ''}
                />
                <label htmlFor="goal-amount">Graduation goal amount (Naira)</label>
                <input
                  id="goal-amount"
                  min="1000"
                  onChange={(event) => setGoalForm((current) => ({ ...current, goalAmount: event.target.value }))}
                  required
                  step="1"
                  type="number"
                  value={goalForm.goalAmount || ''}
                />
                <label htmlFor="goal-purpose">What are you saving toward?</label>
                <select
                  id="goal-purpose"
                  onChange={(event) => setGoalForm((current) => ({ ...current, purpose: event.target.value }))}
                  required
                  value={goalForm.purpose || ''}
                >
                  <option value="">Choose a goal</option>
                  <option>Starting a business</option>
                  <option>Further studies</option>
                  <option>Moving after graduation</option>
                  <option>Building an emergency fund</option>
                  <option>Other</option>
                </select>
                <label htmlFor="goal-contribution">Planned contribution (Naira)</label>
                <input
                  id="goal-contribution"
                  min="100"
                  onChange={(event) => setGoalForm((current) => ({ ...current, contribution: event.target.value }))}
                  required
                  step="1"
                  type="number"
                  value={goalForm.contribution || ''}
                />
                <label htmlFor="goal-cadence">How often will you save?</label>
                <select
                  id="goal-cadence"
                  onChange={(event) => setGoalForm((current) => ({ ...current, cadence: event.target.value }))}
                  required
                  value={goalForm.cadence || ''}
                >
                  <option value="">Choose frequency</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {goalError && <p role="alert">{goalError}</p>}
                <button className="primary-button" disabled={isSavingGoal} type="submit">
                  {isSavingGoal ? 'Saving…' : 'Save goal'}
                </button>
                <button className="soft-action" onClick={() => setIsEditingGoal(false)} type="button">
                  Cancel
                </button>
              </form>
            )}
          </Card>
        ) : <Card className="money-fund-card">
          <div className="card-title-row"><h2><span className="mini-icon"><Icon name="cap" size={17} /></span> Graduation Fund</h2><span className="subtle">Active</span></div>
          <p className="fund-amount">{formatNaira(saved)} <small>/ {goal ? formatNaira(goal) : 'Goal not set'}</small></p>
          <div className="fund-progress-line"><ProgressBar label="Graduation fund progress" value={percent} /><strong>{percent}%</strong></div>
          <p className="fund-milestone">{savings?.remainingAmount === null ? 'Set a graduation goal to see your remaining amount.' : `Remaining: ${formatNaira(savings?.remainingAmount ?? 0)}`}</p>
          <p className="fund-milestone">{savings?.monthlyPlanAmount ? `Monthly plan: ${formatNaira(savings.monthlyPlanAmount)}` : 'No savings plan set.'}</p>
          <button className="primary-button full-button" onClick={() => navigate('/money/budget')} type="button">View Savings Plan</button>
        </Card>}
        {tab === 'Graduation Fund' && (
          <>
            <SectionTitle>Record a contribution</SectionTitle>
            <Card className="budget-card">
              <form className="budget-editor" onSubmit={submitContribution}>
                <label htmlFor="contribution-amount">Amount saved (Naira)</label>
                <input
                  id="contribution-amount"
                  min="100"
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  step="1"
                  type="number"
                  value={amount}
                />
                <label htmlFor="contribution-note">Note (optional)</label>
                <input
                  id="contribution-note"
                  maxLength="250"
                  onChange={(event) => setNote(event.target.value)}
                  value={note}
                />
                {error && <p role="alert">{error}</p>}
                <button className="primary-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Saving…' : 'Record savings'}
                </button>
                <small>Self-reported only; this does not move money or verify a deposit.</small>
              </form>
            </Card>
          </>
        )}
        {tab === 'Graduation Fund' && (
          <>
            <SectionTitle>Savings Milestones</SectionTitle>
            <Card className="compact-list">
              {[['₦200,000', '40%'], ['₦300,000', '60%'], ['₦400,000', '80%'], ['₦500,000', '100%']].map(([amount, pct]) => (
                <ListRow icon="check" title={amount} action={<small>{pct}</small>} key={amount} />
              ))}
            </Card>
            <SectionTitle>Recent Activity</SectionTitle>
            <Card className="compact-list">
              {savings?.recentContributions?.length
                ? savings.recentContributions.map((contribution) => (
                  <ListRow
                    icon="wallet"
                    key={contribution.id}
                    title={contribution.note || 'Self-reported savings'}
                    detail={new Date(contribution.createdAt).toLocaleDateString('en-NG')}
                    action={<strong className="positive">+{formatNaira(contribution.amount)}</strong>}
                  />
                ))
                : <p>No contributions yet. Record one above when you save.</p>}
            </Card>
          </>
        )}
      </div>
    </>
  )
}

function BudgetScreen({ navigate, showNotice }) {
  const [period, setPeriod] = useState('Monthly')
  const [editing, setEditing] = useState(false)
  const [budget, setBudget] = useState(null)
  const [amount, setAmount] = useState('')
  const [loadedPeriod, setLoadedPeriod] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('essentials')
  const [expenseDate, setExpenseDate] = useState(() => getLocalDateInputValue())
  const [expenseNote, setExpenseNote] = useState('')
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState('')
  const [expenseSummary, setExpenseSummary] = useState(null)
  const [error, setError] = useState('')
  const budgetNumber = Number(budget) || 0
  const totalSpent = expenseSummary?.totalSpent ?? 0
  const remainingBudget = Math.max(0, budgetNumber - totalSpent)
  const spentPercent = budgetNumber > 0
    ? Math.min(100, Math.round((totalSpent / budgetNumber) * 100))
    : 0
  const spendingCategories = [
    ['essentials', 'Essentials', 'dark'],
    ['learning', 'Learning', 'purple'],
    ['transport', 'Transport', 'green'],
    ['other', 'Other', 'yellow'],
  ]
  let gradientStart = 0
  const spendingGradient = totalSpent
    ? spendingCategories.map(([category, , color]) => {
      const percent = (expenseSummary?.totalsByCategory?.[category] ?? 0) / totalSpent * 100
      const start = gradientStart
      gradientStart += percent
      const colors = { dark: '#063f30', purple: '#6939dc', green: '#20c56a', yellow: '#ffbf26' }
      return `${colors[color]} ${start}% ${gradientStart}%`
    }).join(', ')
    : '#e8eee9 0% 100%'

  async function loadExpenses(selectedPeriod) {
    const result = await getStudentExpenses(selectedPeriod.toLowerCase())
    setExpenseSummary(result)
  }

  useEffect(() => {
    let active = true
    const budgetPeriod = period.toLowerCase()

    Promise.all([getStudentBudgets(), getStudentExpenses(budgetPeriod)])
      .then(([budgets, summary]) => {
        if (!active) return
        const savedBudget = budgets.find((item) => item.period === budgetPeriod)
        setBudget(savedBudget ? String(savedBudget.amount) : null)
        setAmount(savedBudget ? String(savedBudget.amount) : '')
        setExpenseSummary(summary)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load your budget.')
      })
      .finally(() => {
        if (active) setLoadedPeriod(period)
      })

    return () => {
      active = false
    }
  }, [period])

  async function submitExpense(event) {
    event.preventDefault()
    setExpenseError('')
    setIsSavingExpense(true)
    try {
      await addStudentExpense({
        amount: expenseAmount,
        category: expenseCategory,
        occurredOn: expenseDate,
        note: expenseNote,
      })
      setExpenseAmount('')
      setExpenseNote('')
      setExpenseFormOpen(false)
      showNotice('Expense recorded.')
      try {
        await loadExpenses(period)
      } catch (requestError) {
        setError(`Expense saved, but the breakdown could not refresh: ${requestError.message}`)
      }
    } catch (requestError) {
      setExpenseError(requestError.message || 'Could not record your expense.')
    } finally {
      setIsSavingExpense(false)
    }
  }

  async function saveBudget() {
    if (!Number(amount) || Number(amount) < 1 || !Number.isInteger(Number(amount))) {
      setError('Enter a whole budget amount greater than zero.')
      return
    }

    setError('')
    setIsSaving(true)
    try {
      const savedBudget = await saveStudentBudget(period.toLowerCase(), amount)
      setBudget(String(savedBudget.amount))
      setAmount(String(savedBudget.amount))
      setEditing(false)
      showNotice('Budget updated.')
    } catch (requestError) {
      setError(requestError.message || 'Could not save your budget.')
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <>
      <Header title="Budget Planner" backTo="/money" />
      <div className="experience-body money-body budget-body">
        <Segmented label="Budget period" options={['Monthly', 'Weekly', 'Yearly']} selected={period} onSelect={setPeriod} />
        <Card className="budget-card">
          <div className="card-title-row"><h2><span className="mini-icon"><Icon name="wallet" size={17} /></span>Your {period} Budget</h2><button className="soft-action" onClick={() => { setError(''); setAmount(budget ?? ''); setEditing(!editing) }} type="button">{editing ? 'Cancel' : budget ? 'Edit budget' : 'Set budget'}</button></div>
          {error && <p role="alert">{error}</p>}
          {editing ? <div className="budget-editor"><label htmlFor="budget-amount">Budget amount (₦)</label><input id="budget-amount" min="1" onChange={(event) => setAmount(event.target.value)} step="1" type="number" value={amount} /><button className="primary-button" disabled={isSaving} onClick={saveBudget} type="button">{isSaving ? 'Saving…' : 'Save Budget'}</button></div> : <p className="fund-amount">{loadedPeriod !== period ? 'Loading budget…' : budget === null ? 'No budget set' : formatNaira(budgetNumber)}</p>}
          <div className="fund-progress-line"><ProgressBar label={`${period} budget spent`} value={spentPercent} /><strong>{spentPercent}% spent</strong></div>
          <p className="fund-milestone">Spent this {period.toLowerCase()}: {formatNaira(totalSpent)}</p>
          <p className="fund-milestone">
            {budget === null
              ? 'Set a budget to see what remains.'
              : remainingBudget > 0
                ? `Remaining: ${formatNaira(remainingBudget)}`
                : remainingBudget === 0
                  ? `Budget fully spent: ${formatNaira(budgetNumber)}`
                  : `Over budget by: ${formatNaira(Math.abs(remainingBudget))}`}
          </p>
        </Card>
        <Card className="breakdown-card">
          <div className="card-title-row">
            <h2>Spending Breakdown</h2>
            <button className="soft-action" onClick={() => { setExpenseFormOpen(!expenseFormOpen); setExpenseError('') }} type="button">
              {expenseFormOpen ? 'Cancel' : 'Add expense'}
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          {expenseFormOpen && (
            <form className="budget-editor" onSubmit={submitExpense}>
              <label htmlFor="expense-amount">Amount (Naira)</label>
              <input
                id="expense-amount"
                min="1"
                onChange={(event) => setExpenseAmount(event.target.value)}
                required
                step="1"
                type="number"
                value={expenseAmount}
              />
              <label htmlFor="expense-category">Category</label>
              <select id="expense-category" onChange={(event) => setExpenseCategory(event.target.value)} value={expenseCategory}>
                <option value="essentials">Essentials</option>
                <option value="learning">Learning</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
              <label htmlFor="expense-date">Date</label>
              <input
                id="expense-date"
                onChange={(event) => setExpenseDate(event.target.value)}
                required
                type="date"
                value={expenseDate}
              />
              <label htmlFor="expense-note">Note (optional)</label>
              <input
                id="expense-note"
                maxLength="250"
                onChange={(event) => setExpenseNote(event.target.value)}
                value={expenseNote}
              />
              {expenseError && <p role="alert">{expenseError}</p>}
              <button className="primary-button" disabled={isSavingExpense} type="submit">
                {isSavingExpense ? 'Saving…' : 'Save expense'}
              </button>
            </form>
          )}
          <div className="spending-layout">
            <div
              aria-label={`Total spending ${formatNaira(totalSpent)}`}
              className="spending-donut"
              style={{ background: `conic-gradient(${spendingGradient})` }}
            >
              <span>{formatNaira(totalSpent)}</span>
            </div>
            <ul>
              {spendingCategories.map(([category, name, color]) => {
                const categoryTotal = expenseSummary?.totalsByCategory?.[category] ?? 0
                const percent = totalSpent ? Math.round((categoryTotal / totalSpent) * 100) : 0
                return (
                  <li key={category}>
                    <span className={`legend-dot ${color}`} />
                    {name}
                    <small>{percent}%</small>
                    <strong>{formatNaira(categoryTotal)}</strong>
                  </li>
                )
              })}
            </ul>
          </div>
          <h3>Recent expenses</h3>
          {expenseSummary?.expenses?.length
            ? expenseSummary.expenses.slice(0, 5).map((expense) => (
              <ListRow
                key={expense.id}
                icon="wallet"
                title={expense.note || spendingCategories.find(([category]) => category === expense.category)?.[1]}
                detail={`${expense.occurredOn} · ${spendingCategories.find(([category]) => category === expense.category)?.[1]}`}
                action={<strong>{formatNaira(expense.amount)}</strong>}
              />
            ))
            : <p>No expenses recorded for this {period.toLowerCase()} period.</p>}
        </Card>
        <SectionTitle>Popular Lessons</SectionTitle>
        <Card className="compact-list">
          <ListRow icon="book" title="Budgeting Basics" detail="7 min • Financial Literacy" tone="purple" onClick={() => navigate('/learn')} />
          <ListRow icon="growth" title="Saving vs Investing" detail="5 min • Financial Literacy" onClick={() => navigate('/learn')} />
        </Card>
        <p className="budget-tip"><Icon name="bulb" /> You’re on track! Keep your spending within budget to reach your goals faster.</p>
      </div>
    </>
  )
}

function LearningScreen({ navigate, showNotice }) {
  const [tab, setTab] = useState('Lessons')
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState({})
  const [selected, setSelected] = useState(null)
  const [lessonDetail, setLessonDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  const [error, setError] = useState('')
  const [lessonError, setLessonError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getLearningLessons(), getStudentLessonProgress()])
      .then(([lessonList, savedProgress]) => {
        if (!active) return
        setLessons(lessonList)
        setProgress(Object.fromEntries(savedProgress.map((item) => [item.lessonId, item])))
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load learning content.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function openLesson(lesson) {
    setSelected(lesson)
    setLessonDetail(null)
    setLessonError('')
    setIsLoadingLesson(true)
    try {
      const detail = await getLearningLesson(lesson.id)
      setLessonDetail(detail)
    } catch (requestError) {
      setLessonError(requestError.message || 'Could not load this lesson.')
    } finally {
      setIsLoadingLesson(false)
    }
  }

  async function updateProgress(lesson, progressPercent) {
    setIsSavingProgress(true)
    setLessonError('')
    try {
      const saved = await saveStudentLessonProgress(lesson.id, progressPercent)
      setProgress((current) => ({ ...current, [lesson.id]: saved }))
      if (progressPercent === 100) {
        setSelected(null)
        showNotice('Lesson marked complete.')
      }
    } catch (requestError) {
      setLessonError(requestError.message || 'Could not save your lesson progress.')
    } finally {
      setIsSavingProgress(false)
    }
  }

  const continueLesson = lessons.find((lesson) => {
    const savedProgress = progress[lesson.id]
    return savedProgress && !savedProgress.isCompleted
  }) || lessons.find((lesson) => !progress[lesson.id]?.isCompleted)
  const completedLessons = lessons.filter((lesson) => progress[lesson.id]?.isCompleted)

  return (
    <>
      <Header title="Learning Hub" trailing={<button aria-label="More learning options" className="plain-action" onClick={() => showNotice('You’re viewing the Learning Hub.')} type="button">⋮</button>} />
      <div className="experience-body learning-body">
        <Segmented label="Learning sections" options={['Lessons', 'Challenges', 'Library']} selected={tab} onSelect={setTab} />
        <section className="learn-banner"><strong>Learn today. Build<br />tomorrow.</strong><span><Icon name="book" size={37} /></span></section>
        {error && <p role="alert">{error}</p>}
        {tab === 'Lessons' ? (
          <>
            {isLoading ? <p aria-live="polite">Loading lessons…</p> : (
              <>
                {continueLesson && (
                  <section className="learning-section">
                    <SectionTitle>{progress[continueLesson.id] ? 'Continue Learning' : 'Start Learning'}</SectionTitle>
                    <Card className="continue-card">
                      <ListRow
                        icon={continueLesson.icon}
                        title={continueLesson.title}
                        detail={`${continueLesson.durationMinutes} min • ${continueLesson.category}`}
                        onClick={() => openLesson(continueLesson)}
                      />
                      <div className="fund-progress-line">
                        <ProgressBar label="Lesson progress" value={progress[continueLesson.id]?.progressPercent || 0} />
                        <strong>{progress[continueLesson.id]?.progressPercent || 0}%</strong>
                      </div>
                    </Card>
                  </section>
                )}
                <section className="learning-section">
                  <SectionTitle>Lessons</SectionTitle>
                  <Card className="compact-list">
                    {lessons.map((lesson) => {
                      const savedProgress = progress[lesson.id]
                      return (
                        <ListRow
                          key={lesson.id}
                          icon={lesson.icon}
                          title={lesson.title}
                          detail={savedProgress?.isCompleted
                            ? 'Completed'
                            : `${lesson.durationMinutes} min • ${savedProgress?.progressPercent || 0}% complete`}
                          tone={lesson.icon === 'wallet' ? 'orange' : 'green'}
                          action={savedProgress?.isCompleted ? <span className="current-chip">Done</span> : null}
                          onClick={() => openLesson(lesson)}
                        />
                      )
                    })}
                  </Card>
                </section>
              </>
            )}
          </>
        ) : tab === 'Challenges' ? (
          <Card className="compact-list learning-empty">
            <h2>Challenges</h2>
            <p>Build habits with practical, guided challenges.</p>
            <button className="primary-button" onClick={() => navigate('/growth')}>Explore Skills &amp; Entrepreneurship</button>
          </Card>
        ) : (
          <Card className="compact-list learning-empty">
            <h2>Completed lessons</h2>
            {completedLessons.length
              ? completedLessons.map((lesson) => (
                <ListRow
                  key={lesson.id}
                  icon={lesson.icon}
                  title={lesson.title}
                  detail={`Completed ${new Date(progress[lesson.id].completedAt).toLocaleDateString('en-NG')}`}
                  onClick={() => openLesson(lesson)}
                />
              ))
              : <p>Your completed lessons will appear here.</p>}
          </Card>
        )}
        {selected && (
          <div className="experience-modal-backdrop" onClick={() => setSelected(null)}>
            <section
              aria-label={`${selected.title} lesson details`}
              aria-modal="true"
              className="experience-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <button className="modal-close" onClick={() => setSelected(null)} type="button">×</button>
              {isLoadingLesson ? <p aria-live="polite">Loading lesson…</p> : lessonDetail && (
                <>
                  <p className="eyebrow">{lessonDetail.category} · {lessonDetail.durationMinutes} min</p>
                  <h2>{lessonDetail.title}</h2>
                  <p>{lessonDetail.summary}</p>
                  {lessonDetail.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {lessonError && <p role="alert">{lessonError}</p>}
                  {progress[selected.id]?.isCompleted ? (
                    <p role="status">You completed this lesson.</p>
                  ) : (
                    <button
                      className="primary-button"
                      disabled={isSavingProgress}
                      onClick={() => updateProgress(selected, 100)}
                      type="button"
                    >
                      {isSavingProgress ? 'Saving…' : 'Mark lesson complete'}
                    </button>
                  )}
                  {!progress[selected.id] && (
                    <button
                      className="soft-action"
                      disabled={isSavingProgress}
                      onClick={() => updateProgress(selected, 10)}
                      type="button"
                    >
                      Start lesson
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}

function SkillsScreen({ navigate }) {
  const [tab, setTab] = useState('Pathways')
  const [challenges, setChallenges] = useState([])
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getSkillChallenges(), getStudentSkillProjects()])
      .then(([challengeList, projectResult]) => {
        if (!active) return
        setChallenges(challengeList)
        setProjects(projectResult.projects)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load your skills progress.')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Header title="Skills & Entrepreneurship" />
      <div className="experience-body skills-body">
        <Segmented label="Skills sections" options={['Pathways', 'My Projects']} selected={tab} onSelect={setTab} />
        {error && <p role="alert">{error}</p>}
        {!challenges.length && !error && <p aria-live="polite">Loading skills pathways…</p>}
        {tab === 'Pathways' ? challenges.map((challenge) => {
          const progress = projects.find((item) => item.challengeId === challenge.id)
          const stepCount = challenge.stepCount
          const completedSteps = progress?.completedSteps?.length || 0
          const tone = challenge.icon === 'coins' ? 'orange' : challenge.icon === 'code' ? 'purple' : 'green'
          return (
            <Card className="pathway-card" key={challenge.id}>
              <ListRow
                icon={challenge.icon}
                title={challenge.category}
                detail={challenge.title}
                tone={tone}
                action={<strong className="pathway-metric">{completedSteps}/{stepCount}</strong>}
                onClick={() => navigate(`/growth/challenge?challengeId=${encodeURIComponent(challenge.id)}`)}
              />
            </Card>
          )
        }) : (
          <Card className="learning-empty">
            <h2>My Projects</h2>
            {projects.length
              ? projects.map((project) => {
                const challenge = challenges.find((item) => item.id === project.challengeId)
                if (!challenge) return null
                return (
                  <ListRow
                    key={project.challengeId}
                    icon={challenge.icon}
                    title={challenge.title}
                    detail={project.isCompleted ? 'Completed' : `${project.progressPercent}% complete`}
                    onClick={() => navigate(`/growth/challenge?challengeId=${encodeURIComponent(challenge.id)}`)}
                  />
                )
              })
              : <p>Start a practical challenge to build your portfolio.</p>}
            <button className="primary-button" onClick={() => setTab('Pathways')} type="button">Explore Pathways</button>
          </Card>
        )}
      </div>
    </>
  )
}

function ChallengeScreen({ challengeId, showNotice }) {
  const [challenge, setChallenge] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getSkillChallenge(challengeId), getStudentSkillProjects()])
      .then(([challengeDetails, result]) => {
        if (!active) return
        setChallenge(challengeDetails)
        const progress = result.projects.find((item) => item.challengeId === challengeId)
        setCompletedSteps(progress?.completedSteps || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load this challenge.')
      })
    return () => {
      active = false
    }
  }, [challengeId])

  async function toggleStep(step) {
    const updatedSteps = completedSteps.includes(step)
      ? completedSteps.filter((item) => item !== step)
      : [...completedSteps, step]
    setIsSaving(true)
    setError('')
    try {
      const progress = await saveStudentSkillProject(challengeId, updatedSteps)
      setCompletedSteps(progress.completedSteps)
      if (progress.isCompleted) showNotice(`Challenge completed. You earned ${challenge.rewardPoints} XP.`)
    } catch (requestError) {
      setError(requestError.message || 'Could not save your challenge progress.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Header title="Challenge Details" backTo="/growth" />
      <div className="experience-body challenge-body">
        {error && <p role="alert">{error}</p>}
        {!challenge && !error ? <p aria-live="polite">Loading challenge…</p> : challenge && (
          <>
        <section className="challenge-banner"><span>{challenge.category}</span><h2>{challenge.title}</h2><i><Icon name={challenge.icon} size={36} /></i></section>
        <p className="challenge-intro">{challenge.summary}</p>
        <Card className="challenge-steps">
          {challenge.steps.map((step, index) => {
            const checked = completedSteps.includes(step)
            return (
              <button
                aria-pressed={checked}
                className="challenge-step"
                disabled={isSaving}
                key={step}
                onClick={() => toggleStep(step)}
                type="button"
              >
                <span>{index + 1}.</span><strong>{step}</strong>
                <i className={checked ? 'checked' : ''}>{checked && <Icon name="check" size={15} />}</i>
              </button>
            )
          })}
        </Card>
        <div className="challenge-actions">
          <span className="xp-chip"><Icon name="award" size={17} />{challenge.rewardPoints} XP</span>
          <strong>{completedSteps.length}/{challenge.steps.length} steps</strong>
        </div>
          </>
        )}
      </div>
    </>
  )
}

function GrowthScreen({ navigate }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      getLearningLessons(),
      getStudentLessonProgress(),
      getSkillChallenges(),
      getStudentSkillProjects(),
      getStudentPoints(),
    ])
      .then(([lessons, lessonProgress, challenges, projects, points]) => {
        if (!active) return
        setSummary({
          points,
          lessonCount: lessons.length,
          completedLessons: lessonProgress.filter((item) => item.isCompleted).length,
          challengeCount: challenges.length,
          completedChallenges: projects.projects.filter((item) => item.isCompleted).length,
        })
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load your growth progress.')
      })
    return () => {
      active = false
    }
  }, [])

  const stats = summary ? [
    ['book', 'Financial Lessons', `${summary.completedLessons}/${summary.lessonCount}`, summary.lessonCount ? summary.completedLessons / summary.lessonCount * 100 : 0],
    ['briefcase', 'Skills Projects', `${summary.completedChallenges}/${summary.challengeCount}`, summary.challengeCount ? summary.completedChallenges / summary.challengeCount * 100 : 0],
  ] : []
  return (
    <>
      <Header title="My Growth Progress" />
      <div className="experience-body growth-body">
        {summary ? (
          <section className="xp-overview">
            <div className="xp-ring"><span><strong>{summary.points.points}</strong><small>XP</small></span></div>
            <h2>{summary.points.tier}</h2>
            <p>{summary.points.nextTier
              ? `${summary.points.pointsToNextTier} XP to ${summary.points.nextTier}`
              : 'Top tier reached'}</p>
          </section>
        ) : <p aria-live="polite">Loading your growth summary…</p>}
        {error && <p role="alert">{error}</p>}
        <SectionTitle>Your Progress</SectionTitle>
        <Card className="growth-stats">{stats.map(([icon, label, value, percent]) => <div className="growth-stat" key={label}><span className="experience-row-icon tone-green"><Icon name={icon} /></span><div><div className="growth-stat-heading"><strong>{label}</strong><small>{value}</small></div><ProgressBar label={`${label} progress`} value={percent} /></div></div>)}</Card>
        <button className="text-button centered-action" onClick={() => navigate('/future/points')} type="button">View Points &amp; Tiers</button>
      </div>
    </>
  )
}

function FutureScreen({ navigate }) {
  return (
    <>
      <Header title="My Future" />
      <div className="experience-body future-body">
        <section className="future-intro"><h2>Prepare for Your Next Chapter</h2><p>Your graduation journey is more than a degree. It’s your launchpad.</p></section>
        <Card className="readiness-card"><h3>Graduation Readiness</h3><div className="readiness-content"><div className="readiness-ring"><strong>68/100</strong></div><div><p>You’re making great progress!</p><button className="primary-button" onClick={() => navigate('/growth/progress')}>View Details</button></div></div></Card>
        <SectionTitle>Next Steps</SectionTitle>
        <ul className="next-steps">{['Complete your CV', 'Finish the business budgeting challenge', 'Review your graduation expense plan'].map((step) => <li key={step}><span><Icon name="check" size={16} /></span>{step}</li>)}</ul>
        <button className="primary-button full-button" onClick={() => navigate('/future/points')}>View My Future Plan</button>
        <SectionTitle>Upcoming Milestones</SectionTitle>
        <Card className="compact-list">
          <ListRow icon="wallet" title="Reach ₦200,000 saved" detail="Next savings milestone" onClick={() => navigate('/money')} />
          <ListRow icon="book" title="Finish Skills Pathway" detail="Digital Skills • 2/5 complete" tone="purple" onClick={() => navigate('/growth')} />
        </Card>
        <button className="secondary-button full-button" onClick={() => navigate('/future/opportunities')}>Explore Opportunities</button>
      </div>
    </>
  )
}

function OpportunitiesScreen() {
  const [filter, setFilter] = useState('All')
  const [notice, setNotice] = useState('')
  const [items, setItems] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const filters = ['All', 'Internships', 'Scholarships', 'Mentorship', 'Grants', 'Saved']

  useEffect(() => {
    let active = true
    Promise.all([getOpportunities(), getSavedOpportunities()])
      .then(([opportunityList, saved]) => {
        if (!active) return
        setItems(opportunityList)
        setSavedIds(saved)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load opportunities.')
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = items.filter((item) => (
    filter === 'All'
    || (filter === 'Saved' ? savedIds.includes(item.id) : item.type === filter)
  ))

  async function openOpportunity(item) {
    setSelected({ ...item, loading: true })
    try {
      setSelected(await getOpportunity(item.id))
    } catch (requestError) {
      setError(requestError.message || 'Could not load opportunity details.')
      setSelected(null)
    }
  }

  async function toggleSaved(opportunity) {
    try {
      if (savedIds.includes(opportunity.id)) {
        await removeSavedOpportunity(opportunity.id)
        setSavedIds((current) => current.filter((id) => id !== opportunity.id))
        setNotice('Opportunity removed from saved list.')
      } else {
        await saveOpportunity(opportunity.id)
        setSavedIds((current) => [...current, opportunity.id])
        setNotice('Opportunity saved.')
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not update saved opportunities.')
    }
  }

  return (
    <>
      <Header title="Opportunities" backTo="/future" />
      <div className="experience-body opportunities-body">
        <div aria-label="Filter opportunities" className="opportunity-filters" role="group">{filters.map((item) => <button aria-pressed={filter === item} className={filter === item ? 'is-selected' : ''} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
        {error && <p role="alert">{error}</p>}
        <SectionTitle>{filter === 'All' ? 'Other Opportunities' : filter}</SectionTitle>
        <Card className="compact-list">{filtered.map((item) => <ListRow key={item.id} icon={item.icon} title={item.title} detail={`${item.type} • ${item.location}`} tone={item.icon === 'award' ? 'purple' : item.icon === 'briefcase' ? 'green' : 'blue'} action={savedIds.includes(item.id) ? <span className="current-chip">Saved</span> : undefined} onClick={() => openOpportunity(item)} />)}{!filtered.length && <p>No opportunities in this list.</p>}</Card>
        <StatusNotice>{notice}</StatusNotice>
        {selected && (
          <div className="experience-modal-backdrop" onClick={() => setSelected(null)}>
            <section aria-label="Opportunity details" aria-modal="true" className="experience-modal" onClick={(event) => event.stopPropagation()} role="dialog">
              <button className="modal-close" onClick={() => setSelected(null)} type="button">×</button>
              {selected.loading ? <p>Loading opportunity…</p> : (
                <>
                  <p className="eyebrow">{selected.type} · {selected.location}</p>
                  <h2>{selected.title}</h2>
                  <p>{selected.detail}</p>
                  <p>{selected.description}</p>
                  <button className="primary-button" onClick={() => toggleSaved(selected)} type="button">
                    {savedIds.includes(selected.id) ? 'Remove saved opportunity' : 'Save opportunity'}
                  </button>
                  <p>Opportunity details are informational. Confirm current eligibility and deadlines with the provider.</p>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}

function PointsScreen() {
  const [tab, setTab] = useState('Points')
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getStudentPoints(), getStudentPointTransactions()])
      .then(([points, transactions]) => {
        if (!active) return
        setSummary(points)
        setHistory(transactions)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load points and tiers.')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <Header title="Points & Tiers" backTo="/future" />
      <div className="experience-body points-body">
        {error && <p role="alert">{error}</p>}
        <section className="tier-banner">
          <div className="tier-banner-icon"><Icon name="award" size={27} /></div>
          <div><h2>{summary?.tier || 'Loading tier…'}</h2><p>{summary ? `${summary.points} XP` : ''}</p></div>
          <ProgressBar label="Progress to next tier" value={summary?.progressPercent || 0} />
          <small>{summary?.nextTier ? `${summary.pointsToNextTier} XP to ${summary.nextTier}` : summary ? 'Top tier reached' : ''}</small>
        </section>
        <Segmented label="Points and tiers" options={['Points', 'Tiers']} selected={tab} onSelect={setTab} />
        {tab === 'Points' ? (
          <>
            <Card className="points-history">
              <h2>Recent Points</h2>
              {history.length ? history.map((item) => (
                <ListRow
                  key={item.id}
                  icon={item.sourceType === 'lesson' ? 'book' : 'briefcase'}
                  title={item.description}
                  detail={new Date(item.createdAt).toLocaleDateString('en-NG')}
                  action={<strong className="positive">+{item.points} XP</strong>}
                  tone={item.sourceType === 'lesson' ? 'purple' : 'green'}
                />
              )) : <p>Complete lessons and challenges to earn points.</p>}
            </Card>
          </>
        ) : <Card className="points-history"><h2>Your Tiers</h2>{summary?.tiers.map((tier) => <ListRow key={tier.name} icon="award" title={tier.name} detail={tier.maximumPoints === null ? `${tier.minimumPoints}+ XP` : `${tier.minimumPoints}–${tier.maximumPoints} XP`} action={tier.name === summary.tier ? <span className="current-chip">Current</span> : null} tone={tier.name === summary.tier ? 'purple' : 'green'} />)}</Card>}
      </div>
    </>
  )
}

function ProfileScreen({ profile, navigate, onLogout }) {
  const [expanded, setExpanded] = useState('')
  const name = profile.fullName || 'Chidi Iwagu'
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('')
  const rows = [
    ['user', 'Personal Information', `Email: ${profile.email || 'Not provided'}`, 'green'],
    ['cap', 'Graduation Plan', `Goal: ${formatNaira(profile.goalAmount || 500000)}`, 'green'],
    ['lock', 'Privacy & Data', 'Your account data is protected.', 'green'],
    ['people', 'Supporters & Family', 'Invite a parent or guardian.', 'green'],
    ['bell', 'Notifications', 'Notification preferences.', 'green'],
    ['help', 'Help & Support', 'Contact support for assistance.', 'green'],
  ]
  return (
    <>
      <Header title="Profile & Settings" backTo="/home" />
      <div className="experience-body profile-body">
        <Card className="member-card"><span className="member-avatar">{initials}</span><div><h2>{name}</h2><p>CoupreshFund Member</p><span className="level-chip">Level 3</span></div></Card>
        <Card className="settings-list">{rows.map(([icon, title, detail]) => <div key={title}><button aria-expanded={expanded === title} className="settings-row" onClick={() => setExpanded(expanded === title ? '' : title)} type="button"><Icon name={icon} /><strong>{title}</strong><Icon name="chevron" size={19} /></button>{expanded === title && <div className="settings-detail">{detail}{title === 'Supporters & Family' && <button className="text-button" onClick={() => navigate('/goals/invite')} type="button">Invite a supporter</button>}</div>}</div>)}<button className="settings-row logout-row" onClick={onLogout} type="button"><Icon name="logout" /><strong>Log Out</strong></button></Card>
      </div>
    </>
  )
}

export default function DashboardExperience({ profile, onLogout, onSaveGoal }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [dashboardVersion, setDashboardVersion] = useState(0)
  const path = location.pathname

  useEffect(() => {
    let active = true

    getStudentDashboard()
      .then((result) => {
        if (active) setDashboard(result)
      })
      .catch((error) => {
        if (active) setNotice(error.message || 'Could not load your savings summary.')
      })

    return () => {
      active = false
    }
  }, [dashboardVersion])

  async function handleAddContribution(contribution) {
    await addStudentContribution(contribution)
    setDashboardVersion((version) => version + 1)
    setNotice('Self-reported savings recorded.')
  }

  async function handleSaveGoal(goal) {
    await onSaveGoal(goal)
    setDashboardVersion((version) => version + 1)
  }

  let screen
  if (path === '/home') screen = <HomeScreen dashboard={dashboard} profile={profile} navigate={navigate} showNotice={setNotice} />
  else if (path === '/money') screen = <MoneyScreen dashboard={dashboard} profile={profile} navigate={navigate} showNotice={setNotice} onAddContribution={handleAddContribution} onSaveGoal={handleSaveGoal} />
  else if (path === '/money/budget') screen = <BudgetScreen navigate={navigate} showNotice={setNotice} />
  else if (path === '/learn') screen = <LearningScreen navigate={navigate} showNotice={setNotice} />
  else if (path === '/growth') screen = <SkillsScreen navigate={navigate} />
  else if (path === '/growth/challenge') {
    const challengeId = new URLSearchParams(location.search).get('challengeId') || 'first-business-idea'
    screen = <ChallengeScreen challengeId={challengeId} showNotice={setNotice} />
  }
  else if (path === '/growth/progress') screen = <GrowthScreen navigate={navigate} />
  else if (path === '/future') screen = <FutureScreen navigate={navigate} />
  else if (path === '/future/opportunities') screen = <OpportunitiesScreen />
  else if (path === '/future/points') screen = <PointsScreen />
  else screen = <ProfileScreen navigate={navigate} profile={profile} onLogout={onLogout} />
  const section = path.startsWith('/money') ? '/money'
    : path === '/learn' || path.startsWith('/growth') ? '/growth'
      : path.startsWith('/future') ? '/future'
        : path === '/profile' ? '/profile' : '/home'
  const sectionTitle = section === '/growth' ? 'My Growth'
    : section === '/future' ? 'My Future'
      : navigation.find((item) => item.path === section)?.label
  return (
    <main className="experience-screen">
      <div className="experience-page">
        <div className="experience-scroller" key={path}>
          {screen}
          <StatusNotice>{notice}</StatusNotice>
        </div>
        <nav aria-label="Main navigation" className="experience-nav">
          {navigation.map((item) => (
            <NavLink aria-current={section === item.path ? 'page' : undefined} className={section === item.path ? 'is-active' : ''} key={item.path} onClick={() => setNotice('')} to={item.path}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <span className="experience-sr-only">{sectionTitle}</span>
      </div>
    </main>
  )
}
