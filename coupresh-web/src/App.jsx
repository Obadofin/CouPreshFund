import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CampusDetailsPage from './pages/CampusDetailsPage.jsx'
import DashboardExperience from './pages/DashboardExperience.jsx'
import GoalSetupPage from './pages/GoalSetupPage.jsx'
import GrowthUnlockPage from './pages/GrowthUnlockPage.jsx'
import InviteGuardianPage from './pages/InviteGuardianPage.jsx'
import ProfilePreviewPage from './pages/ProfilePreviewPage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'
import SavingsPlanPage from './pages/SavingsPlanPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import StudentDetailsPage from './pages/StudentDetailsPage.jsx'
import SplashScreen from './pages/SplashScreen.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import {
  clearAuthToken,
  getCurrentStudent,
  hasAuthToken,
  loginStudent,
  registerStudent,
  saveStudentGoal,
  saveStudentOnboarding,
} from './utils/authApi.js'
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
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false)

  useEffect(() => {
    if (!showSplash) return undefined

    const timer = window.setTimeout(() => setShowSplash(false), 2400)
    return () => window.clearTimeout(timer)
  }, [showSplash])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (!hasAuthToken()) {
        setIsRestoringSession(false)
        return
      }

      try {
        const student = await getCurrentStudent()
        if (active) {
          setProfile({
            ...initialProfile,
            fullName: student.fullName,
            email: student.email || '',
            phone: student.phone || '',
            ...(student.onboarding || {}),
          })
        }
      } catch (error) {
        if (!active) return
        if (error.status === 401) {
          clearAuthToken()
        } else {
          setSignupError(error.message || 'Could not restore your account. Please try again.')
        }
      } finally {
        if (active) setIsRestoringSession(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

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
    const currentStudent = await getCurrentStudent()
    setProfile({
      ...initialProfile,
      fullName: currentStudent.fullName || student.fullName,
      email: currentStudent.email || '',
      phone: currentStudent.phone || '',
      ...(currentStudent.onboarding || {}),
    })
    navigate('/home')
  }

  async function handleCompleteOnboarding() {
    setSignupError('')
    setIsSavingOnboarding(true)

    try {
      const onboarding = await saveStudentOnboarding(profile)
      setProfile((currentProfile) => ({ ...currentProfile, ...onboarding }))
      navigate('/home')
    } catch (error) {
      setSignupError(error.message || 'Could not save your setup. Please try again.')
    } finally {
      setIsSavingOnboarding(false)
    }
  }

  async function handleSaveGoal(goal) {
    const onboarding = await saveStudentGoal({
      ...profile,
      ...goal,
    })
    setProfile((currentProfile) => ({ ...currentProfile, ...onboarding }))
    return onboarding
  }

  if (isRestoringSession) {
    return <main className="session-loading" aria-live="polite">Restoring your account…</main>
  }

  if (signupError && hasAuthToken() && !profile.fullName) {
    return (
      <main className="session-loading" role="alert">
        <p>{signupError}</p>
        <button onClick={() => window.location.reload()} type="button">Try again</button>
        <button onClick={() => { clearAuthToken(); window.location.assign('/login') }} type="button">
          Sign in again
        </button>
      </main>
    )
  }

  const dashboard = profile.fullName
    ? <DashboardExperience onLogout={startOver} onSaveGoal={handleSaveGoal} profile={profile} />
    : <Navigate to="/login" replace />

  return (
    <Routes>
      <Route path="/home" element={dashboard} />
      <Route path="/money/*" element={dashboard} />
      <Route path="/growth/*" element={dashboard} />
      <Route path="/future/*" element={dashboard} />
      <Route path="/profile" element={dashboard} />
      <Route path="/roadmap" element={<Navigate to="/future" replace />} />
      <Route
        path="/goals/invite"
        element={profile.fullName ? <InviteGuardianPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/goals"
        element={profile.fullName
          ? <GrowthUnlockPage onInvite={() => navigate('/goals/invite')} />
          : <Navigate to="/login" replace />}
      />
      <Route path="/learn" element={dashboard} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
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
          <ProfilePreviewPage
            error={signupError}
            isSubmitting={isSavingOnboarding}
            onContinue={handleCompleteOnboarding}
            profile={profile}
          />
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