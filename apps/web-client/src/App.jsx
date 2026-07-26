import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentRegister from './pages/StudentRegister'
import InternDashboard from './pages/InternDashboard'
import MentorDashboard from './pages/MentorDashboard'
import CompanyDashboard from './pages/CompanyDashboard'
import SuperadminDashboard from './pages/SuperadminDashboard'
import PublicPrograms from './pages/PublicPrograms'
import OrgProfile from './pages/OrgProfile'
import AcceptInvite from './pages/AcceptInvite'
import VerifyCertificate from './pages/VerifyCertificate'
import StudentDashboard from './pages/StudentDashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProgramDetails from './pages/ProgramDetails'

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/internships" element={<PublicPrograms />} />
          <Route path="/programs" element={<PublicPrograms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/org/:id" element={<OrgProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/program/:id" element={<ProgramDetails />} />

          {/* Phase 2 — Invite onboarding */}
          <Route path="/invite/:token" element={<AcceptInvite />} />

          {/* Phase 3 — Certificate verification */}
          <Route path="/verify/:id" element={<VerifyCertificate />} />

          {/* Protected Routes */}
          <Route
            path="/intern/dashboard"
            element={
              <ProtectedRoute allowedRoles={["intern", "student"]}>
                <InternDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intern"
            element={<Navigate to="/intern/dashboard" replace />}
          />

          {/* Student-specific dashboard */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={<Navigate to="/student/dashboard" replace />}
          />

          <Route
            path="/mentor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["mentor"]}>
                <MentorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor"
            element={<Navigate to="/mentor/dashboard" replace />}
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["org_admin", "admin"]}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["superadmin"]}>
                <SuperadminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
