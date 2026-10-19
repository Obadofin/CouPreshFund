import { NavLink } from 'react-router-dom'

const navigationItems = [
  {
    label: 'Home',
    path: '/home',
    icon: <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9Z" />,
  },
  {
    label: 'Roadmap',
    path: '/roadmap',
    icon: <><path d="M5 5h.01M19 9h.01M8 19h.01" /><path d="m6 6 11 3-8 9" /><circle cx="5" cy="5" r="2" /><circle cx="19" cy="9" r="2" /><circle cx="8" cy="19" r="2" /></>,
  },
  {
    label: 'Goals',
    path: '/goals',
    icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m13 11 6-6" /></>,
  },
  {
    label: 'Learn',
    path: '/learn',
    icon: <><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22V5.5Z" /><path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22V5.5Z" /></>,
  },
]

export default function DashboardNav() {
  return (
    <nav className="dashboard-nav" aria-label="Main navigation">
      {navigationItems.map((item) => (
        <NavLink
          className={({ isActive }) => `dashboard-nav-item${isActive ? ' is-active' : ''}`}
          key={item.path}
          to={item.path}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {item.icon}
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}