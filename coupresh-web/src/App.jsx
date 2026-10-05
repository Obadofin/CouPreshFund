import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CampusDetailsPage from './pages/CampusDetailsPage.jsx'
import GoalSetupPage from './pages/GoalSetupPage.jsx'
import GrowthUnlockPage from './pages/GrowthUnlockPage.jsx'
import HomePage from './pages/HomePage.jsx'
import InviteGuardianPage from './pages/InviteGuardianPage.jsx'
import LearnPage from './pages/LearnPage.jsx'
import ProfilePreviewPage from './pages/ProfilePreviewPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RoadmapPage from './pages/RoadmapPage.jsx'
import SavingsPlanPage from './pages/SavingsPlanPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import StudentDetailsPage from './pages/StudentDetailsPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'
import './App.css'

const initialProfile = {
  fullName: '',
  email: '',
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
  const [profile, setProfile] = useState(initialProfile)

  function updateProfile(event) {
    const { name, value } = event.target
    setProfile((currentProfile) => ({ ...currentProfile, [name]: value }))
  }

  function startOver() {
    setProfile(initialProfile)
    navigate('/')
  }

  return (
    <Routes>
      <Route path="/home" element={<HomePage profile={profile} />} />
      <Route path="/profile" element={<ProfilePage onLogout={startOver} profile={profile} />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/goals/invite" element={<InviteGuardianPage />} />
      <Route path="/goals" element={<GrowthUnlockPage onInvite={() => navigate('/goals/invite')} />} />
      <Route path="/learn" element={<LearnPage />} />
      <Route
        path="/"
        element={(
          <WelcomePage
            onSignIn={() => navigate('/login')}
            onStart={() => navigate('/signup/details')}
          />
        )}
      />
      <Route
        path="/login"
        element={(
          <SignInPage
            onBack={() => navigate('/')}
            onCreateAccount={() => navigate('/signup/details')}
          />
        )}
      />
      <Route path="/signup" element={<Navigate to="/signup/details" replace />} />
      <Route
        path="/signup/details"
        element={(
          <StudentDetailsPage
            onBack={() => navigate('/')}
            onChange={updateProfile}
            onNext={() => navigate('/signup/campus')}
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