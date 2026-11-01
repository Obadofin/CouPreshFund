import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CampusDetailsPage from './pages/CampusDetailsPage.jsx'
import DashboardExperience from './pages/DashboardExperience.jsx'
import GoalSetupPage from './pages/GoalSetupPage.jsx'
import GrowthUnlockPage from './pages/GrowthUnlockPage.jsx'
import InviteGuardianPage from './pages/InviteGuardianPage.jsx'
import ProfilePreviewPage from './pages/ProfilePreviewPage.jsx'
import SavingsPlanPage from './pages/SavingsPlanPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import StudentDetailsPage from './pages/StudentDetailsPage.jsx'
import SplashScreen from './pages/SplashScreen.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import { clearAuthToken, loginStudent, registerStudent } from './utils/authApi.js'
import './App.css'

const initialProfile = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  institution: '',
  course: '',
  level: '',
  graduationYear: '',
  goalAmount: '',
  purpose: '',
  contribution: '5000',
  cadence: 'weekly',
}

const graduationYears = Array.from(
  { length: 7 },
  (_, index) => new Date().getFullYear() + index + 1,
)

function AppRoutes() {
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(() => window.location.pathname === '/')
  const [profile, setProfile] = useState(initialProfile)
  const [signupError, setSignupError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (!showSplash) return undefined

    const timer = window.setTimeout(() => setShowSplash(false), 2400)
    return () => window.clearTimeout(timer)
  }, [showSplash])

  function updateProfile(event) {
    const { name, value } = event.target
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }))
  }

  function startOver() {
    clearAuthToken()
    setProfile(initialProfile)
    navigate('/')
  }

  async function handleRegistration() {
    setSignupError('')
    setIsRegistering(true)

    let registered = false
    try {
      await registerStudent(profile)
      registered = true
      const student = await loginStudent({
        emailOrPhone: profile.email || profile.phone,
        password: profile.password,
      })
      setProfile((currentProfile) => ({
        ...currentProfile,
        fullName: student.fullName,
        email: student.email || currentProfile.email,
        phone: student.phone || currentProfile.phone,
        password: '',
      }))
      navigate('/signup/campus')
    } catch (error) {
      setSignupError(registered
        ? `Your account was created, but automatic sign-in failed. Please sign in from the login page. ${error.message}`
        : error.message || 'Account creation failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleSignIn(credentials) {
    const student = await loginStudent(credentials)
    setProfile({
      ...initialProfile,
      fullName: student.fullName,
      email: student.email || '',
      phone: student.phone || '',
    })
    navigate('/home')
  }

  return (
    <Routes>
      <Route path="/home" element={<DashboardExperience onLogout={startOver} profile={profile} />} />
      <Route path="/money/*" element={<DashboardExperience onLogout={startOver} profile={profile} />} />
      <Route path="/growth/*" element={<DashboardExperience onLogout={startOver} profile={profile} />} />
      <Route path="/future/*" element={<DashboardExperience onLogout={startOver} profile={profile} />} />
      <Route path="/profile" element={<DashboardExperience onLogout={startOver} profile={profile} />} />
      <Route path="/roadmap" element={<Navigate to="/future" replace />} />
      <Route path="/goals/invite" element={<InviteGuardianPage />} />
      <Route path="/goals" element={<GrowthUnlockPage onInvite={() => navigate('/goals/invite')} />} />
      <Route path="/learn" element={<DashboardExperience onLogout={startOver} profile={profile} />} />
      <Route
        path="/"
        element={(
          showSplash
            ? <SplashScreen />
            : (
              <WelcomePage
                onSignIn={() => navigate('/login')}
                onStart={() => navigate('/signup/details')}
              />
            )
        )}
      />
      <Route
        path="/login"
        element={(
          <SignInPage
            onBack={() => navigate('/')}
            onCreateAccount={() => navigate('/signup/details')}
            onSubmit={handleSignIn}
          />
        )}
      />
      <Route path="/signup" element={<Navigate to="/signup/details" replace />} />
      <Route
        path="/signup/details"
        element={(
          <StudentDetailsPage
            error={signupError}
            isSubmitting={isRegistering}
            onBack={() => navigate('/')}
            onChange={updateProfile}
            onSignIn={() => navigate('/login')}
            onNext={handleRegistration}
            profile={profile}
          />
        )}
      />
      <Route
        path="/signup/campus"
        element={profile.fullName ? (
          <CampusDetailsPage
            graduationYears={graduationYears}
            onBack={() => navigate('/signup/details')}
            onChange={updateProfile}
            onNext={() => navigate('/signup/goal')}
            profile={profile}
          />
        ) : <Navigate to="/signup/details" replace />}
      />
      <Route
        path="/signup/goal"
        element={profile.institution ? (
          <GoalSetupPage
            onBack={() => navigate('/signup/campus')}
            onChange={updateProfile}
            onNext={() => navigate('/signup/savings-plan')}
            profile={profile}
          />
        ) : <Navigate to="/signup/details" replace />}
      />
      <Route
        path="/signup/savings-plan"
        element={profile.goalAmount ? (
          <SavingsPlanPage
            onAmountChange={(value) => setProfile((currentProfile) => ({
              ...currentProfile,
              contribution: value,
            }))}
            onBack={() => navigate('/signup/goal')}
            onChange={updateProfile}
            onNext={() => navigate('/signup/complete')}
            profile={profile}
          />
        ) : <Navigate to="/signup/goal" replace />}
      />
      <Route
        path="/signup/complete"
        element={profile.fullName && profile.contribution && profile.cadence ? (
          <ProfilePreviewPage onContinue={() => navigate('/home')} profile={profile} />
        ) : <Navigate to="/signup/details" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App