import { useEffect, useState } from 'react'
import { api, clearAdminToken, getCurrentAdmin, hasAdminToken, loginAdmin } from './api.js'

const allSections = [
  ['overview', 'Overview'],
  ['users', 'Users'],
  ['content', 'Learning content'],
  ['milestones', 'Milestones'],
  ['campaigns', 'Notifications'],
  ['guardians', 'Guardian rewards'],
  ['audit-log', 'Audit log'],
]

const contentFormInitial = {
  id: '',
  title: '',
  category: 'Financial Literacy',
  durationMinutes: 5,
  icon: 'book',
  summary: '',
  content: '',
  isPublished: false,
}

function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      await onLogin({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      })
    } catch (requestError) {
      setError(requestError.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">COUPRESHFUND · ADMIN</p>
        <h1>Platform administration</h1>
        <p className="muted">Sign in with an administrator account.</p>
        <label>Email address<input autoComplete="username" name="email" required type="email" /></label>
        <label>Password<input autoComplete="current-password" name="password" required type="password" /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}

function AdminApp() {
  const [admin, setAdmin] = useState(null)
  const [restoring, setRestoring] = useState(hasAdminToken())
  const [section, setSection] = useState('overview')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    if (!hasAdminToken()) return undefined
    getCurrentAdmin()
      .then((current) => {
        if (!active) return
        setAdmin(current)
        if (current.role === 'content_manager') setSection('content')
      })
      .catch(() => { if (active) clearAdminToken() })
      .finally(() => { if (active) setRestoring(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!admin) return undefined
    let active = true
    const paths = {
      overview: '/admin/overview',
      users: '/admin/users',
      content: '/admin/content',
      milestones: '/admin/milestones',
      campaigns: '/admin/campaigns',
      guardians: '/admin/guardians',
      'audit-log': '/admin/audit-log',
    }
    api(paths[section])
      .then((result) => { if (active) setData(result) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load this section.') })
    return () => { active = false }
  }, [admin, refresh, section])

  async function handleLogin(credentials) {
    const current = await loginAdmin(credentials)
    setAdmin(current)
    setSection(current.role === 'content_manager' ? 'content' : 'overview')
  }

  async function action(path, options = {}, successMessage = 'Changes saved.') {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api(path, options)
      setNotice(successMessage)
      setRefresh((value) => value + 1)
      return true
    } catch (requestError) {
      setError(requestError.message || 'The action could not be completed.')
      return false
    } finally {
      setBusy(false)
    }
  }

  if (restoring) return <main className="loading">Restoring admin session…</main>
  if (!admin) return <Login onLogin={handleLogin} />

  const sections = admin.role === 'content_manager'
    ? allSections.filter(([key]) => ['content', 'milestones'].includes(key))
    : allSections

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <a className="brand" href="#overview"><span>CP</span><strong>CouPreshFund<small>ADMIN CONSOLE</small></strong></a>
        <nav aria-label="Admin sections">
          {sections.map(([key, label]) => (
            <button
              aria-current={section === key ? 'page' : undefined}
              className={section === key ? 'selected' : ''}
              key={key}
              onClick={() => {
                setError('')
                setNotice('')
                setSection(key)
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <strong>{admin.fullName}</strong>
          <span>{admin.role.replace('_', ' ')}</span>
          <button onClick={() => { clearAdminToken(); setAdmin(null) }} type="button">Sign out</button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">ADMINISTRATION</p><h1>{allSections.find(([key]) => key === section)?.[1]}</h1></div>
          <button className="secondary" onClick={() => setRefresh((value) => value + 1)} type="button">Refresh data</button>
        </header>
        {error && <p className="banner error" role="alert">{error}</p>}
        {notice && <p className="banner success" role="status">{notice}</p>}
        {busy && <p className="busy-indicator" role="status">Saving…</p>}
        <Section
          action={action}
          data={data}
          error={error}
          refresh={() => setRefresh((value) => value + 1)}
          section={section}
        />
      </main>
    </div>
  )
}

function Section({ section, data, action, refresh }) {
  if (!data) return <p className="loading">Loading…</p>
  if (section === 'overview') {
    const values = data.overview || {}
    return (
      <div className="metric-grid">
        <Metric label="Students" value={values.students} />
        <Metric label="Guardians" value={values.guardians} />
        <Metric label="Total savings" value={`₦${Number(values.totalSavings || 0).toLocaleString()}`} />
        <Metric label="Dashboard notifications" value={values.notifications} />
      </div>
    )
  }
  if (section === 'users') return <Users users={data.users || []} action={action} />
  if (section === 'content') return <Content content={data.content || []} action={action} />
  if (section === 'milestones') return <Milestones milestones={data.milestones || []} action={action} />
  if (section === 'campaigns') return <Campaigns campaigns={data.campaigns || []} action={action} />
  if (section === 'guardians') return <Guardians guardians={data.guardians || []} action={action} refresh={refresh} />
  return <Audit entries={data.entries || []} />
}

function Metric({ label, value }) {
  return <article className="metric-card"><span>{label}</span><strong>{value ?? '—'}</strong></article>
}

function Users({ users, action }) {
  return (
    <section className="panel">
      <h2>Student accounts</h2>
      {!users.length ? <p className="muted">No students found.</p> : (
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th /></tr></thead>
          <tbody>{users.map((user) => (
            <tr key={user.id}>
              <td>{user.fullName}</td><td>{user.email}</td><td><span className={`status ${user.accountStatus}`}>{user.accountStatus}</span></td>
              <td><button className="small-button" onClick={() => action(`/admin/users/${user.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: user.accountStatus === 'active' ? 'suspended' : 'active' }),
              }, 'Student account status updated.')} type="button">
                {user.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}
              </button></td>
            </tr>
          ))}</tbody></table></div>
      )}
    </section>
  )
}

function Content({ content, action }) {
  const [form, setForm] = useState(contentFormInitial)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    const payload = {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      content: form.content.split('\n').map((part) => part.trim()).filter(Boolean),
    }
    if (!payload.content.length) {
      setError('Add at least one lesson paragraph.')
      return
    }
    if (await action('/admin/content', { method: 'POST', body: JSON.stringify(payload) }, 'Lesson created.')) {
      setForm(contentFormInitial)
    }
  }

  return (
    <div className="stack">
      <section className="panel"><h2>Add learning content</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Lesson ID<input onChange={(event) => setForm({ ...form, id: event.target.value })} pattern="[a-z0-9][a-z0-9-]{1,99}" required value={form.id} /></label>
          <label>Title<input onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title} /></label>
          <label>Category<input onChange={(event) => setForm({ ...form, category: event.target.value })} required value={form.category} /></label>
          <label>Duration (minutes)<input min="1" max="240" onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} required type="number" value={form.durationMinutes} /></label>
          <label className="wide">Summary<input onChange={(event) => setForm({ ...form, summary: event.target.value })} required value={form.summary} /></label>
          <label className="wide">Lesson paragraphs, one per line<textarea onChange={(event) => setForm({ ...form, content: event.target.value })} required rows="5" value={form.content} /></label>
          <label className="check-label"><input checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} type="checkbox" /> Publish immediately</label>
          {error && <p className="error wide" role="alert">{error}</p>}
          <button className="primary" type="submit">Create lesson</button>
        </form>
      </section>
      <section className="panel"><h2>Lessons ({content.length})</h2>
        <div className="item-list">{content.map((lesson) => (
          <article className="item-row" key={lesson.id}>
            <div><strong>{lesson.title}</strong><p>{lesson.category} · {lesson.durationMinutes} min · {lesson.isPublished ? 'Published' : 'Draft'}</p></div>
            <button className="small-button" onClick={() => action(`/admin/content/${lesson.id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...lesson, isPublished: !lesson.isPublished }),
            }, lesson.isPublished ? 'Lesson unpublished.' : 'Lesson published.')} type="button">
              {lesson.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </article>
        ))}</div>
      </section>
    </div>
  )
}

function Milestones({ milestones, action }) {
  const [form, setForm] = useState({ title: '', description: '', metric: 'active_students', targetValue: '' })
  async function submit(event) {
    event.preventDefault()
    if (await action('/admin/milestones', {
      method: 'POST',
      body: JSON.stringify({ ...form, targetValue: Number(form.targetValue), isActive: true }),
    }, 'Milestone created.')) {
      setForm({ title: '', description: '', metric: 'active_students', targetValue: '' })
    }
  }
  return (
    <div className="stack">
      <section className="panel"><h2>Create a milestone</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Title<input onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title} /></label>
          <label>Metric<select onChange={(event) => setForm({ ...form, metric: event.target.value })} value={form.metric}>
            <option value="active_students">Active students</option><option value="total_savings">Total savings</option><option value="lessons_completed">Lessons completed</option>
          </select></label>
          <label>Target<input min="1" onChange={(event) => setForm({ ...form, targetValue: event.target.value })} required type="number" value={form.targetValue} /></label>
          <label className="wide">Description<input onChange={(event) => setForm({ ...form, description: event.target.value })} required value={form.description} /></label>
          <button className="primary" type="submit">Add milestone</button>
        </form>
      </section>
      <section className="panel"><h2>Platform milestones</h2>
        <div className="item-list">{milestones.map((item) => (
          <article className="item-row" key={item.id}>
            <div><strong>{item.title}</strong><p>{item.description} · {item.metric.replaceAll('_', ' ')}: {item.targetValue}</p></div>
            <button className="small-button" onClick={() => action(`/admin/milestones/${item.id}`, {
              method: 'PUT',
              body: JSON.stringify({ ...item, isActive: !item.isActive }),
            }, 'Milestone updated.')} type="button">{item.isActive ? 'Deactivate' : 'Activate'}</button>
          </article>
        ))}</div>
      </section>
    </div>
  )
}

function Campaigns({ campaigns, action }) {
  const [studentIds, setStudentIds] = useState({})
  const [removeStudentIds, setRemoveStudentIds] = useState({})
  return (
    <section className="panel"><h2>Notification campaigns</h2>
      {!campaigns.length && <p className="muted">No campaigns are configured yet.</p>}
      <div className="item-list">{campaigns.map((campaign) => (
        <article className="campaign-row" key={campaign.id}>
          <div><strong>{campaign.name}</strong><p>{campaign.isEnabled ? 'Scheduled sends enabled' : 'Paused'} · email + dashboard</p></div>
          <div className="actions">
            <button className="small-button" onClick={() => action(`/admin/campaigns/${campaign.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ isEnabled: !campaign.isEnabled }),
            }, campaign.isEnabled ? 'Campaign paused.' : 'Campaign resumed.')} type="button">
              {campaign.isEnabled ? 'Pause' : 'Resume'}
            </button>
            <button className="small-button" onClick={() => action(`/admin/campaigns/${campaign.id}/run`, {
              method: 'POST',
            }, 'Campaign run completed.')} type="button">Run now</button>
          </div>
          <form className="suppress-form" onSubmit={(event) => {
            event.preventDefault()
            const studentId = studentIds[campaign.id]
            if (!studentId) return
            action(`/admin/campaigns/${campaign.id}/suppressions`, {
              method: 'POST',
              body: JSON.stringify({ studentId }),
            }, 'Student suppressed from this campaign.')
          }}>
            <label>Suppress student ID<input onChange={(event) => setStudentIds({ ...studentIds, [campaign.id]: event.target.value })} value={studentIds[campaign.id] || ''} /></label>
            <button className="small-button" type="submit">Suppress</button>
          </form>
          <form className="suppress-form" onSubmit={(event) => {
            event.preventDefault()
            const studentId = removeStudentIds[campaign.id]
            if (!studentId) return
            action(`/admin/campaigns/${campaign.id}/suppressions/${encodeURIComponent(studentId)}`, {
              method: 'DELETE',
            }, 'Student suppression removed.')
          }}>
            <label>Restore suppressed student ID<input onChange={(event) => setRemoveStudentIds({ ...removeStudentIds, [campaign.id]: event.target.value })} value={removeStudentIds[campaign.id] || ''} /></label>
            <button className="small-button" type="submit">Restore</button>
          </form>
        </article>
      ))}</div>
    </section>
  )
}

function Guardians({ guardians, action }) {
  const [selectedId, setSelectedId] = useState('')
  const [points, setPoints] = useState('10')
  const [reason, setReason] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (!selectedId) return
    await action(`/admin/guardians/${selectedId}/rewards`, {
      method: 'POST',
      body: JSON.stringify({ points: Number(points), reason }),
    }, 'Guardian reward awarded.')
    setReason('')
  }
  return (
    <div className="stack">
      <section className="panel"><h2>Award guardian points</h2>
        <form className="form-grid" onSubmit={submit}>
          <label>Guardian<select onChange={(event) => setSelectedId(event.target.value)} required value={selectedId}>
            <option value="">Select a guardian</option>{guardians.map((guardian) => <option key={guardian.id} value={guardian.id}>{guardian.fullName} · {guardian.email}</option>)}
          </select></label>
          <label>Points<input min="1" onChange={(event) => setPoints(event.target.value)} required type="number" value={points} /></label>
          <label className="wide">Reason<input onChange={(event) => setReason(event.target.value)} required value={reason} /></label>
          <button className="primary" type="submit">Award points</button>
        </form>
      </section>
      <section className="panel"><h2>Guardians ({guardians.length})</h2>
        <div className="item-list">{guardians.map((guardian) => (
          <article className="item-row" key={guardian.id}><div><strong>{guardian.fullName}</strong><p>{guardian.email}</p></div></article>
        ))}</div>
      </section>
    </div>
  )
}

function Audit({ entries }) {
  return <section className="panel"><h2>Recent administrative actions</h2>
    <div className="item-list">{entries.map((entry) => (
      <article className="item-row" key={entry.id}><div><strong>{entry.action}</strong><p>{entry.resourceType} · {entry.resourceId || '—'} · {new Date(entry.createdAt).toLocaleString()}</p></div></article>
    ))}</div>
  </section>
}

export default AdminApp
