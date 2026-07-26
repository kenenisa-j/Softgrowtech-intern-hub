import { useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { LogOut, RefreshCw, Clock, CheckCircle2 } from 'lucide-react'

const InternHoldingArea = () => {
  const { user, logout, authAxios } = useContext(AuthContext)
  const [checking, setChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isApproved, setIsApproved] = useState(false)

  const checkApplicationStatus = async () => {
    if (checking) return
    setChecking(true)
    setStatusMessage('')
    try {
      // Fetch latest status
      const res = await authAxios.get('/auth/status')
      const latestStatus = res.data.status

      if (latestStatus === 'ACCEPTED') {
        setIsApproved(true)
        setStatusMessage('Congratulations! Your application has been approved. Redirecting to workspace...')
        
        // Update user state in localStorage and refresh
        const storedUser = localStorage.getItem('ims_user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          parsed.status = 'ACCEPTED'
          localStorage.setItem('ims_user', JSON.stringify(parsed))
        }
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (latestStatus === 'REJECTED') {
        setStatusMessage('Your application was not approved for this workspace.')
      } else {
        setStatusMessage('Your application is still pending review. Please try again later.')
        setTimeout(() => setStatusMessage(''), 4000)
      }
    } catch (err) {
      console.error('Error checking status', err)
      setStatusMessage('Unable to reach server. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 antialiased">
      {/* Header */}
      <header className="flex justify-between items-center max-w-5xl w-full mx-auto py-4 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm tracking-wider">
            IMS
          </div>
          <span className="font-extrabold text-sm text-slate-200 uppercase tracking-widest">Nextern</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 hover:text-slate-100 text-slate-400 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut size={14} />
          <span>Exit Workspace</span>
        </button>
      </header>

      {/* Main holding Area Card */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="glass-panel max-w-xl w-full p-8 rounded-3xl text-center space-y-8 relative overflow-hidden">
          {/* Subtle top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/40 to-amber-500/0"></div>

          {/* Stepper Header Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse">
            <Clock size={32} />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Review in Progress
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Your profile is currently under review by the mentors at <strong className="text-slate-200">{user?.tenant_name || 'Organization'}</strong>. You will unlock full workspace access once accepted.
            </p>
          </div>

          {/* Timeline Stepper */}
          <div className="max-w-xs mx-auto space-y-5 py-2">
            <div className="flex items-center gap-4 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Account Created</h4>
                <p className="text-[10px] text-slate-500">Public application registered</p>
              </div>
            </div>

            <div className="relative">
              {/* Stepper Connector line */}
              <div className="absolute left-4 -top-5 -bottom-5 w-[1.5px] bg-slate-800"></div>
              <div className="flex items-center gap-4 text-left relative z-10">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm animate-pulse border border-amber-500/30">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Administrative Screening</h4>
                  <p className="text-[10px] text-slate-500">Mentors evaluating credentials</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500">Access Granted</h4>
                <p className="text-[10px] text-slate-600">Full workspace unlocked</p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 space-y-4">
            {statusMessage && (
              <p className={`text-xs font-semibold animate-bounce ${
                isApproved ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {statusMessage}
              </p>
            )}
            
            <button
              onClick={checkApplicationStatus}
              disabled={checking || isApproved}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              <span>Check Review Status</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-slate-600">
        © 2026 Nextern. Secured Dual-Onboarding Gateway.
      </footer>
    </div>
  )
}

export default InternHoldingArea
