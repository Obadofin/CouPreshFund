import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import formatNaira from '../utils/formatNaira.js'
import './DashboardExperience.css'

const navigation = [
  { label: 'Home', path: '/home', icon: 'home' },
  { label: 'My Money', path: '/money', icon: 'wallet' },
  { label: 'My Growth', path: '/growth', icon: 'growth' },
  { label: 'My Future', path: '/future', icon: 'future' },
  { label: 'Profile', path: '/profile', icon: 'profile' },
]

const opportunities = [
  { icon: 'award', title: 'Scholarship for Nigerian Students', detail: 'Fully Funded • Apply Now', type: 'Scholarships' },
  { icon: 'people', title: 'Mentorship Program', detail: 'Industry Experts • Virtual', type: 'Mentorship' },
  { icon: 'briefcase', title: 'Entrepreneurship Grant', detail: 'Up to ₦1,000,000 • Apply Now', type: 'Internships' },
  { icon: 'cap', title: 'Graduate Trainee Program', detail: 'Banking & Fintech • Lagos', type: 'Internships' },
  { icon: 'sparkle', title: 'Women in Tech Fellowship', detail: '6 months • Remote', type: 'Scholarships' },
]

const pathways = [
  { icon: 'code', title: 'Digital Skills', detail: 'Design • Coding • Marketing', progress: '2/5', tone: 'purple' },
  { icon: 'bulb', title: 'Entrepreneurship', detail: 'Business • Sales • Innovation', progress: '1/5', tone: 'green' },
  { icon: 'coins', title: 'Financial Intelligence', detail: 'Money • Investing • Planning', progress: '3/5', tone: 'orange' },
  { icon: 'file', title: 'Career Readiness', detail: 'CV • Interviews • Communication', progress: '0/5', tone: 'blue' },
  { icon: 'target', title: 'Personal Development', detail: 'Discipline • Goal Setting • Habits', progress: '2/5', tone: 'pink' },
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

function HomeScreen({ profile, navigate, showNotice }) {
  const firstName = profile.fullName?.trim().split(/\s+/)[0] || 'Chidi'
  const goal = Number(profile.goalAmount) || 500000
  const saved = 180000
  const percent = Math.round((saved / goal) * 100)
  const graduationYear = Number(profile.graduationYear) || 2028
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
          <p>Expected: Jun {graduationYear} <span>•</span> {monthsToGraduation} months left</p>
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
          <p className="fund-milestone">Next milestone: ₦200,000</p>
          <div className="fund-bottom"><span>Monthly saving plan: ₦17,778</span><button className="small-primary" onClick={() => navigate('/money')} type="button">View Plan</button></div>
        </Card>
        <SectionTitle>Recent Activity</SectionTitle>
        <Card className="activity-card">
          <ListRow icon="check" title="Savings deposit" detail="Apr 26, 2025" action={<strong className="positive">+₦10,000</strong>} />
          <ListRow icon="check" title="Savings deposit" detail="Apr 19, 2025" action={<strong className="positive">+₦5,000</strong>} />
        </Card>
      </div>
    </>
  )
}

function MoneyScreen({ navigate, showNotice }) {
  const [tab, setTab] = useState('Graduation Fund')
  const saved = 180000
  const goal = 500000
  return (
    <>
      <Header title="My Money" trailing={<button aria-label="Notifications" className="plain-action" onClick={() => showNotice('You’re all caught up.')} type="button"><Icon name="bell" /></button>} />
      <div className="experience-body money-body">
        <Segmented label="Money sections" options={['Graduation Fund', 'Budgets', 'Goals']} selected={tab} onSelect={(value) => value === 'Budgets' ? navigate('/money/budget') : setTab(value)} />
        {tab === 'Goals' ? (
          <Card className="money-fund-card">
            <div className="card-title-row"><h2>Graduation Goal</h2><span className="subtle">Active</span></div>
            <p className="fund-amount">{formatNaira(saved)} <small>/ {formatNaira(goal)}</small></p>
            <div className="fund-progress-line"><ProgressBar label="Graduation goal progress" value={36} /><strong>36%</strong></div>
            <p className="fund-milestone">Your savings target for graduation.</p>
            <button className="primary-button full-button" onClick={() => navigate('/money/budget')} type="button">View Savings Plan</button>
          </Card>
        ) : <Card className="money-fund-card">
          <div className="card-title-row"><h2><span className="mini-icon"><Icon name="cap" size={17} /></span> Graduation Fund</h2><span className="subtle">Active</span></div>
          <p className="fund-amount">{formatNaira(saved)} <small>/ {formatNaira(goal)}</small></p>
          <div className="fund-progress-line"><ProgressBar label="Graduation fund progress" value={36} /><strong>36%</strong></div>
          <p className="fund-milestone">Next milestone: ₦200,000</p>
          <p className="fund-milestone">Monthly plan: ₦17,778</p>
          <button className="primary-button full-button" onClick={() => navigate('/money/budget')}>View Savings Plan</button>
        </Card>}
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
              <ListRow icon="wallet" title="Savings deposit" detail="Apr 26, 2025" action={<strong className="positive">+₦10,000</strong>} />
              <ListRow icon="wallet" title="Savings deposit" detail="Apr 19, 2025" action={<strong className="positive">+₦5,000</strong>} />
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
  const [budget, setBudget] = useState('80000')
  const [amount, setAmount] = useState(budget)
  const budgetNumber = Number(budget) || 0
  const spentPercent = Math.min(100, Math.round((budgetNumber / 500000) * 100))
  const spending = [['Essentials', 50, '₦40,000', 'dark'], ['Learning', 20, '₦16,000', 'purple'], ['Transport', 15, '₦12,000', 'green'], ['Other', 15, '₦12,000', 'yellow']]
  function saveBudget() {
    if (!Number(amount) || Number(amount) < 1) {
      showNotice('Enter a budget greater than zero.')
      return
    }
    setBudget(amount)
    setEditing(false)
    showNotice('Budget updated.')
  }
  return (
    <>
      <Header title="Budget Planner" backTo="/money" />
      <div className="experience-body money-body budget-body">
        <Segmented label="Budget period" options={['Monthly', 'Weekly', 'Yearly']} selected={period} onSelect={setPeriod} />
        <Card className="budget-card">
          <div className="card-title-row"><h2><span className="mini-icon"><Icon name="wallet" size={17} /></span>Your {period} Budget</h2><button className="soft-action" onClick={() => { setAmount(budget); setEditing(!editing) }} type="button">{editing ? 'Cancel' : 'Set Budget'}</button></div>
          {editing ? <div className="budget-editor"><label htmlFor="budget-amount">Budget amount (₦)</label><input id="budget-amount" min="1" onChange={(event) => setAmount(event.target.value)} type="number" value={amount} /><button className="primary-button" onClick={saveBudget} type="button">Save Budget</button></div> : <p className="fund-amount">{formatNaira(budgetNumber)} <small>/ ₦500,000</small></p>}
          <div className="fund-progress-line"><ProgressBar label="Budget amount progress" value={spentPercent} /><strong>{spentPercent}%</strong></div>
          <p className="fund-milestone">Next milestone: ₦200,000</p><p className="fund-milestone">{period} plan: ₦17,778</p>
        </Card>
        <Card className="breakdown-card">
          <h2>Spending Breakdown</h2>
          <div className="spending-layout">
            <div aria-label="Spending breakdown chart" className="spending-donut"><span>₦80k</span></div>
            <ul>{spending.map(([name, percent, value, color]) => <li key={name}><span className={`legend-dot ${color}`} />{name}<small>{percent}%</small><strong>{value}</strong></li>)}</ul>
          </div>
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
  const [selected, setSelected] = useState('')
  const lessons = [
    ['growth', 'Saving vs Investing', '5 min'],
    ['coins', 'Understanding Interest', '6 min'],
    ['wallet', 'Budgeting Basics', '7 min'],
    ['target', 'The 50/30/20 Rule', '8 min'],
  ]
  return (
    <>
      <Header title="Learning Hub" trailing={<button aria-label="More learning options" className="plain-action" onClick={() => showNotice('You’re viewing the Learning Hub.')} type="button">⋮</button>} />
      <div className="experience-body learning-body">
        <Segmented label="Learning sections" options={['Lessons', 'Challenges', 'Library']} selected={tab} onSelect={setTab} />
        <section className="learn-banner"><strong>Learn today. Build<br />tomorrow.</strong><span><Icon name="book" size={37} /></span></section>
        {tab === 'Lessons' ? (
          <>
            <section className="learning-section">
              <SectionTitle>Continue Learning</SectionTitle>
              <Card className="continue-card">
                <ListRow icon="book" title="How to manage ₦20,000 for an entire week" detail="5 min left • Financial Literacy" />
                <div className="fund-progress-line"><ProgressBar label="Lesson progress" value={60} /><strong>60%</strong></div>
              </Card>
            </section>
            <section className="learning-section">
              <SectionTitle>Popular Lessons</SectionTitle>
              <Card className="compact-list">
                {lessons.map(([icon, title, duration]) => <ListRow key={title} icon={icon} title={title} detail={duration} tone={icon === 'wallet' ? 'orange' : 'green'} onClick={() => setSelected(title)} />)}
              </Card>
            </section>
          </>
        ) : (
          <Card className="compact-list learning-empty">
            <h2>{tab}</h2>
            <p>{tab === 'Challenges' ? 'Build habits with practical, guided challenges.' : 'Your saved lessons will appear here.'}</p>
            {tab === 'Challenges' && <button className="primary-button" onClick={() => navigate('/growth/skills')}>Explore Skills &amp; Entrepreneurship</button>}
          </Card>
        )}
        {selected && <div className="experience-modal-backdrop" onClick={() => setSelected('')}><section aria-label={`${selected} lesson details`} aria-modal="true" className="experience-modal" onClick={(event) => event.stopPropagation()} role="dialog"><button className="modal-close" onClick={() => setSelected('')} type="button">×</button><p className="eyebrow">Financial Literacy</p><h2>{selected}</h2><p>Learn practical steps you can use to make confident financial decisions.</p><button className="primary-button" onClick={() => { setSelected(''); showNotice('Lesson marked complete.') }} type="button">Mark lesson complete</button></section></div>}
      </div>
    </>
  )
}

function SkillsScreen({ navigate }) {
  const [tab, setTab] = useState('Pathways')
  return (
    <>
      <Header title="Skills & Entrepreneurship" />
      <div className="experience-body skills-body">
        <Segmented label="Skills sections" options={['Pathways', 'My Projects']} selected={tab} onSelect={setTab} />
        {tab === 'Pathways' ? pathways.map((pathway) => <Card className="pathway-card" key={pathway.title}><ListRow {...pathway} action={<strong className="pathway-metric">{pathway.progress}</strong>} onClick={() => navigate('/growth/challenge')} /></Card>) : (
          <Card className="learning-empty"><h2>My Projects</h2><p>Start a practical challenge to build your portfolio.</p><button className="primary-button" onClick={() => navigate('/growth/challenge')}>Explore Challenges</button></Card>
        )}
      </div>
    </>
  )
}

function ChallengeScreen({ showNotice }) {
  const [checked, setChecked] = useState([true, false, false, false, false])
  const [started, setStarted] = useState(false)
  const steps = ['Identify a problem', 'Interview 5 customers', 'Develop a solution', 'Create a business plan', 'Present for feedback']
  return (
    <>
      <Header title="Challenge Details" backTo="/growth" />
      <div className="experience-body challenge-body">
        <section className="challenge-banner"><span>Featured</span><h2>Build Your First<br />Business Idea</h2><i><Icon name="bulb" size={36} /></i></section>
        <p className="challenge-intro">Identify a problem, interview potential customers, and create a simple solution.</p>
        <Card className="challenge-steps">
          {steps.map((step, index) => <button aria-pressed={checked[index]} className="challenge-step" key={step} onClick={() => setChecked((current) => current.map((value, i) => i === index ? !value : value))} type="button"><span>{index + 1}.</span><strong>{step}</strong><i className={checked[index] ? 'checked' : ''}>{checked[index] && <Icon name="check" size={15} />}</i></button>)}
        </Card>
        <div className="challenge-actions"><span className="xp-chip"><Icon name="award" size={17} />100 XP</span><button className="primary-button" onClick={() => { setStarted(true); showNotice('Challenge started.') }} type="button">{started ? 'Challenge Started' : 'Start Challenge'}</button></div>
      </div>
    </>
  )
}

function GrowthScreen({ navigate }) {
  const stats = [['book', 'Financial Lessons', '8/12', 54], ['briefcase', 'Skills Projects', '2/5', 34], ['target', 'Weekly Goals', '4/5', 75], ['flame', 'Learning Streak', '7 days', 60]]
  return (
    <>
      <Header title="My Growth Progress" />
      <div className="experience-body growth-body">
        <section className="xp-overview"><div className="xp-ring"><span><strong>650</strong><small>XP</small></span></div><h2>Level 3 – Builder</h2><p>Next level: 850 XP</p></section>
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
  const filters = ['All', 'Internships', 'Scholarships', 'Mentorship']
  const filtered = opportunities.filter((item) => filter === 'All' || item.type === filter)
  return (
    <>
      <Header title="Opportunities" backTo="/future" />
      <div className="experience-body opportunities-body">
        <div aria-label="Filter opportunities" className="opportunity-filters" role="group">{filters.map((item) => <button aria-pressed={filter === item} className={filter === item ? 'is-selected' : ''} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
        {(filter === 'All' || filter === 'Internships') && <Card className="featured-opportunity"><span>FEATURED</span><h2>Tech Internship Program</h2><p>Lagos • Remote</p><strong>₦50,000 – ₦100,000 / month</strong><button className="primary-button" onClick={() => setNotice('Application details coming soon.')}>Apply Now</button></Card>}
        <SectionTitle>{filter === 'All' ? 'Other Opportunities' : filter}</SectionTitle>
        <Card className="compact-list">{filtered.map((item) => <ListRow key={item.title} icon={item.icon} title={item.title} detail={item.detail} tone={item.icon === 'award' ? 'purple' : item.icon === 'briefcase' ? 'green' : 'blue'} onClick={() => setNotice(`${item.title}: details coming soon.`)} />)}</Card>
        <StatusNotice>{notice}</StatusNotice>
      </div>
    </>
  )
}

function PointsScreen() {
  const [tab, setTab] = useState('Points')
  const history = [['book', 'Financial Literacy Lesson', 'Apr 28', '+100', 'purple'], ['flame', '7 Day Learning Streak', 'Apr 27', '+50', 'orange'], ['briefcase', 'Skills Project Completed', 'Apr 25', '+100', 'green'], ['target', 'Daily Goal Completed', 'Apr 24', '+25', 'pink']]
  const tiers = [['Starter', '0 – 199 XP'], ['Builder', '200 – 850 XP'], ['Grower', '851 – 1,500 XP'], ['Accelerator', '1,501+ XP']]
  return (
    <>
      <Header title="Points & Tiers" backTo="/future" />
      <div className="experience-body points-body">
        <section className="tier-banner"><div className="tier-banner-icon"><Icon name="award" size={27} /></div><div><h2>Level 3 – Builder</h2><p>650 XP</p></div><ProgressBar label="Progress to next tier" value={74} /><small>Next level: 850 XP</small></section>
        <Segmented label="Points and tiers" options={['Points', 'Tiers']} selected={tab} onSelect={setTab} />
        {tab === 'Points' ? (
          <>
            <Card className="points-history"><h2>Recent Points</h2>{history.map(([icon, title, date, points, tone]) => <ListRow key={title} icon={icon} title={title} detail={date} action={<strong className="positive">{points}</strong>} tone={tone} />)}</Card>
            <Card className="points-history tier-list">
              <h2>Your Tiers</h2>
              {tiers.map(([name, range], index) => <ListRow key={name} icon={index === 0 ? 'check' : 'award'} title={name} detail={range} action={name === 'Builder' ? <span className="current-chip">Current</span> : null} tone={index === 1 ? 'purple' : 'green'} />)}
            </Card>
          </>
        ) : <Card className="points-history"><h2>Your Tiers</h2>{tiers.map(([name, range], index) => <ListRow key={name} icon={index === 0 ? 'check' : 'award'} title={name} detail={range} action={name === 'Builder' ? <span className="current-chip">Current</span> : null} tone={index === 1 ? 'purple' : 'green'} />)}</Card>}
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

export default function DashboardExperience({ profile, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const path = location.pathname
  let screen
  if (path === '/home') screen = <HomeScreen profile={profile} navigate={navigate} showNotice={setNotice} />
  else if (path === '/money') screen = <MoneyScreen navigate={navigate} showNotice={setNotice} />
  else if (path === '/money/budget') screen = <BudgetScreen navigate={navigate} showNotice={setNotice} />
  else if (path === '/learn') screen = <LearningScreen navigate={navigate} showNotice={setNotice} />
  else if (path === '/growth') screen = <SkillsScreen navigate={navigate} />
  else if (path === '/growth/challenge') screen = <ChallengeScreen showNotice={setNotice} />
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
