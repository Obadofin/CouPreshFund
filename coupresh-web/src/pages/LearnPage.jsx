import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'

const categories = ['All', 'Budgeting', 'Savings']

const lessons = [
  {
    id: 'budgeting-on-30k',
    title: 'Budgeting on N30k',
    detail: '4 min  ~  Starter',
    category: 'Budgeting',
    unlocked: true,
    preview: 'Start with essentials, set a weekly limit, and give every naira a clear job.',
  },
  {
    id: '50-30-20-rule',
    title: 'The 50/30/20 rule',
    detail: '5 min  ~  Builder',
    category: 'Budgeting',
    unlocked: true,
    preview: 'A simple starting point for dividing income between needs, wants, and savings.',
  },
  {
    id: 'treasury-bills',
    title: 'What is a T-bill?',
    detail: 'Unlocks at N250,000',
    category: 'Savings',
    unlocked: false,
    preview: 'This lesson unlocks when you reach N250,000 in your graduation goal.',
  },
]

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [completedCount, setCompletedCount] = useState(4)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const visibleLessons = lessons.filter((lesson) => (
    activeCategory === 'All' || lesson.category === activeCategory
  ))

  function completeLesson() {
    setCompletedCount((count) => Math.min(12, count + 1))
    setSelectedLesson(null)
  }

  return (
    <DashboardShell backTo="/home">
      <section className="learn-content" aria-labelledby="learn-title">
        <header className="learn-heading">
          <h1 id="learn-title">Learn</h1>
          <span className="learn-points">340 pts</span>
        </header>

        <section className="learn-progress-card" aria-label="Lesson progress">
          <p>{completedCount} of 12 lessons done</p>
          <div
            className="learn-progress"
            role="progressbar"
            aria-label="Lessons completed"
            aria-valuemin="0"
            aria-valuemax="12"
            aria-valuenow={completedCount}
          >
            <span style={{ width: `${(completedCount / 12) * 100}%` }} />
          </div>
        </section>

        <div className="learn-filters" role="group" aria-label="Filter lessons by category">
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className={activeCategory === category ? 'is-selected' : ''}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="lesson-list">
          {visibleLessons.map((lesson) => (
            <button
              aria-label={`${lesson.title}${lesson.unlocked ? '' : ', locked'}`}
              className="lesson-card"
              key={lesson.id}
              onClick={() => setSelectedLesson(lesson)}
              type="button"
            >
              <span className="lesson-title">{lesson.title}</span>
              <span className="lesson-detail">{lesson.detail}</span>
            </button>
          ))}
        </div>

        {selectedLesson && (
          <div className="lesson-dialog-backdrop" onClick={() => setSelectedLesson(null)}>
            <section
              aria-labelledby="lesson-dialog-title"
              aria-modal="true"
              className="lesson-dialog"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <button
                aria-label="Close lesson preview"
                className="lesson-dialog-close"
                onClick={() => setSelectedLesson(null)}
                type="button"
              >
                ×
              </button>
              <p className="lesson-dialog-category">{selectedLesson.category}</p>
              <h2 id="lesson-dialog-title">{selectedLesson.title}</h2>
              <p>{selectedLesson.preview}</p>
              {selectedLesson.unlocked ? (
                <button className="lesson-complete-button" onClick={completeLesson} type="button">
                  Mark lesson complete
                </button>
              ) : (
                <p className="lesson-locked-note">{selectedLesson.detail}</p>
              )}
              <p className="lesson-demo-note">Preview content only. Progress is not saved.</p>
            </section>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}