import DashboardShell from '../components/DashboardShell.jsx'

const milestones = [
  { name: 'Starter', amount: 'N10,000', detail: 'Unlocked 12 Mar', unlocked: true },
  { name: 'Builder', amount: 'N50,000', detail: 'Unlocked 30 May', unlocked: true },
  { name: 'Grower', amount: 'N100,000', detail: 'Growth Unlock preview', unlocked: true, current: true },
  { name: 'Accelerator', amount: 'N250,000', detail: 'N125,000 to go - 3 lessons', unlocked: false },
]

function MilestoneMark({ unlocked }) {
  return (
    <span className={`roadmap-mark${unlocked ? ' is-unlocked' : ' is-locked'}`} aria-hidden="true">
      {unlocked && (
        <svg viewBox="0 0 40 40" focusable="false">
          <circle cx="20" cy="20" r="16" />
          <path d="m11 20 6 6 12-13" />
        </svg>
      )}
    </span>
  )
}

export default function RoadmapPage() {
  return (
    <DashboardShell backTo="/home">
      <section className="roadmap-content" aria-labelledby="roadmap-title">
        <header className="roadmap-heading">
          <h1 id="roadmap-title">Your roadmap</h1>
          <p>You’re a Grower ~ 50% to Accelerator</p>
        </header>

        <div
          className="roadmap-progress"
          role="progressbar"
          aria-label="Progress to Accelerator tier"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="50"
        >
          <span />
        </div>

        <ol className="roadmap-milestones">
          {milestones.map((milestone) => (
            <li
              className={`roadmap-milestone${milestone.current ? ' is-current' : ''}`}
              key={milestone.name}
            >
              <MilestoneMark unlocked={milestone.unlocked} />
              <div className="roadmap-milestone-copy">
                <p className="roadmap-milestone-title">
                  <strong>{milestone.name}</strong> ~ {milestone.amount}
                </p>
                {milestone.current ? (
                  <span className="growth-preview-badge">{milestone.detail}</span>
                ) : (
                  <p className={`roadmap-milestone-detail${milestone.unlocked ? ' is-unlocked' : ''}`}>
                    {milestone.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </DashboardShell>
  )
}