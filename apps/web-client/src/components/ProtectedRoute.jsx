import { useContext } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ShieldAlert } from 'lucide-react'

import InternHoldingArea from './InternHoldingArea'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'intern' && user.status === 'PENDING') {
    return <InternHoldingArea />
  }

  const userRole = (user.role || '').toLowerCase();
  const allowedRolesLower = (allowedRoles || []).map(r => r.toLowerCase());

  if (allowedRoles && !allowedRolesLower.includes(userRole)) {
    const getDashboardPath = (role) => {
      const r = (role || '').toUpperCase();
      if (r === 'SUPERADMIN') return '/superadmin/dashboard';
      if (r === 'ORG_ADMIN') return '/admin/dashboard';
      if (r === 'MENTOR') return '/mentor/dashboard';
      if (r === 'INTERN') return '/intern/dashboard';
      if (r === 'STUDENT') return '/student/dashboard';
      return '/login';
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You do not have permission to access this page. This workspace is restricted to {allowedRoles.join(', ')} users.
          </p>
          <div className="flex gap-4">
            <Link
              to={getDashboardPath(user.role)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
