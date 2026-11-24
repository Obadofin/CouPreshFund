import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CampusDetailsPage from './pages/CampusDetailsPage.jsx'
import DashboardExperience from './pages/DashboardExperience.jsx'
import EmailVerificationPage from './pages/EmailVerificationPage.jsx'
import GoalSetupPage from './pages/GoalSetupPage.jsx'
import GuardianInvitePage from './pages/GuardianInvitePage.jsx'
import GrowthUnlockPage from './pages/GrowthUnlockPage.jsx'
import InviteGuardianPage from './pages/InviteGuardianPage.jsx'
import PasswordRecoveryPage from './pages/PasswordRecoveryPage.jsx'
import ProfilePreviewPage from './pages/ProfilePreviewPage.jsx'
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
  requestStudentPasswordReset,
  resendStudentVerification,
  registerStudent,
  resetStudentPassword,
  verifyStudentEmail,
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
const PENDING_VERIFICATION_STORAGE_KEY = 'coupreshfund.pendingVerificationEmail'
const PENDING_VERIFICATION_PURPOSE_STORAGE_KEY = 'coupreshfund.pendingVerificationPurpose'

function AppRoutes() {
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(() => window.location.pathname === '/')
  const [profile, setProfile] = useState(initialProfile)
  const [signupError, setSignupError] = useState('')
  const [verificationNotice, setVerificationNotice] = useState('')
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(
    () => sessionStorage.getItem(PENDING_VERIFICATION_STORAGE_KEY) || '',
  )
  const [pendingVerificationPurpose, setPendingVerificationPurpose] = useState(
    () => sessionStorage.getItem(PENDING_VERIFICATION_PURPOSE_STORAGE_KEY) || 'registration',
  )
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
        if (error.status === 401 || error.status === 403) {
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
    sessionStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY)
    sessionStorage.removeItem(PENDING_VERIFICATION_PURPOSE_STORAGE_KEY)
    setPendingVerificationEmail('')
    setPendingVerificationPurpose('registration')
    setProfile(initialProfile)
    navigate('/')
  }

  async function handleRegistration() {
    setSignupError('')
    setIsRegistering(true)

    try {
      const result = await registerStudent(profile)
      setProfile((currentProfile) => ({
        ...currentProfile,
        fullName: result.student.fullName,
        email: result.student.email || currentProfile.email,
        phone: result.student.phone || currentProfile.phone,
      }))
      setPendingVerificationEmail(result.student.email)
      sessionStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, result.student.email)
      setPendingVerificationPurpose('registration')
      sessionStorage.setItem(PENDING_VERIFICATION_PURPOSE_STORAGE_KEY, 'registration')
      setVerificationNotice(result.emailSent === false ? result.message : '')
      navigate('/signup/verify-email')
    } catch (error) {
      setSignupError(error.message || 'Account creation failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleEmailVerification(code) {
    setSignupError('')
    setIsRegistering(true)
    try {
      const student = await verifyStudentEmail({ email: pendingVerificationEmail, code })
      setProfile((currentProfile) => ({
        ...currentProfile,
        fullName: student.fullName,
        email: student.email || currentProfile.email,
        phone: student.phone || currentProfile.phone,
        password: '',
      }))
      setPendingVerificationEmail('')
      sessionStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY)
      sessionStorage.removeItem(PENDING_VERIFICATION_PURPOSE_STORAGE_KEY)
      setVerificationNotice('')
      if (pendingVerificationPurpose === 'existing-account') {
        const currentStudent = await getCurrentStudent()
        setProfile({
          ...initialProfile,
          fullName: currentStudent.fullName || student.fullName,
          email: currentStudent.email || student.email || '',
          phone: currentStudent.phone || student.phone || '',
          ...(currentStudent.onboarding || {}),
        })
        setPendingVerificationPurpose('registration')
        navigate('/home')
      } else {
        setPendingVerificationPurpose('registration')
        navigate('/signup/campus')
      }
    } catch (error) {
      setSignupError(error.message || 'Email verification failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleSignIn(credentials) {
    const student = await loginStudent(credentials)
    if (student.verificationRequired) {
      setProfile({
        ...initialProfile,
        fullName: student.student.fullName,
        email: student.student.email || '',
        phone: student.student.phone || '',
      })
      setPendingVerificationEmail(student.student.email)
      setPendingVerificationPurpose('existing-account')
      sessionStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, student.student.email)
      sessionStorage.setItem(PENDING_VERIFICATION_PURPOSE_STORAGE_KEY, 'existing-account')
      setVerificationNotice('Verify your email to unlock your account and continue.')
      setSignupError('')
      navigate('/home')
      return
    }

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

  async function handleResendPendingVerification() {
    setSignupError('')
    const result = await resendStudentVerification(pendingVerificationEmail)
    setVerificationNotice(result.message)
    return result
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

  const verificationRequired = (
    pendingVerificationPurpose === 'existing-account' && Boolean(pendingVerificationEmail)
  )
  const dashboard = verificationRequired
    ? (
      <DashboardExperience
        isVerifying={isRegistering}
        onLogout={startOver}
        onResendVerification={handleResendPendingVerification}
        onSaveGoal={handleSaveGoal}
        onVerify={handleEmailVerification}
        profile={profile}
        verificationEmail={pendingVerificationEmail}
        verificationError={signupError}
        verificationNotice={verificationNotice}
        verificationRequired
      />
    )
    : profile.fullName
      ? <DashboardExperience onLogout={startOver} onSaveGoal={handleSaveGoal} profile={profile} />
      : <Navigate to="/login" replace />

  return (
    <Routes>
      <Route path="/home" element={dashboard} />
      <Route
        path="/guardian/invite"
        element={verificationRequired ? dashboard : <GuardianInvitePage />}
      />
      <Route path="/money/*" element={dashboard} />
      <Route path="/growth/*" element={dashboard} />
      <Route path="/future/*" element={dashboard} />
      <Route path="/profile" element={dashboard} />
      <Route path="/roadmap" element={<Navigate to="/future" replace />} />
      <Route
        path="/goals/invite"
        element={verificationRequired
          ? dashboard
          : profile.fullName ? <InviteGuardianPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/goals"
        element={verificationRequired
          ? dashboard
          : profile.fullName
            ? <GrowthUnlockPage onInvite={() => navigate('/goals/invite')} />
            : <Navigate to="/login" replace />}
      />
      <Route path="/learn" element={dashboard} />
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
            onForgotPassword={() => navigate('/forgot-password')}
            onSubmit={handleSignIn}
          />
        )}
      />
      <Route
        path="/forgot-password"
        element={(
          <PasswordRecoveryPage
            onBackToLogin={() => navigate('/login')}
            onRequestCode={requestStudentPasswordReset}
            onResetPassword={resetStudentPassword}
          />
        )}
      />
      <Route
        path="/signup"
        element={verificationRequired ? dashboard : <Navigate to="/signup/details" replace />}
      />
      <Route
        path="/signup/details"
        element={verificationRequired ? dashboard : (
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
        path="/signup/verify-email"
        element={verificationRequired ? dashboard : pendingVerificationEmail ? (
          <EmailVerificationPage
            email={pendingVerificationEmail}
            error={signupError}
            notice={verificationNotice}
            isSubmitting={isRegistering}
            onResend={() => resendStudentVerification(pendingVerificationEmail)}
            onVerify={handleEmailVerification}
          />
        ) : hasAuthToken()
          ? <Navigate
              to={pendingVerificationPurpose === 'existing-account' ? '/home' : '/signup/campus'}
              replace
            />
          : <Navigate to="/signup/details" replace />}
      />
      <Route
        path="/signup/campus"
        element={verificationRequired
          ? dashboard
          : hasAuthToken() ? (
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
        element={verificationRequired
          ? dashboard
          : hasAuthToken() && profile.institution ? (
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
        element={verificationRequired
          ? dashboard
          : hasAuthToken() && profile.goalAmount ? (
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
        element={verificationRequired
          ? dashboard
          : hasAuthToken() && profile.fullName && profile.contribution && profile.cadence ? (
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