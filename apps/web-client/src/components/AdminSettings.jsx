import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Globe, Mail, ShieldCheck, AlertCircle } from 'lucide-react'

const AdminSettings = () => {
  const { authAxios } = useContext(AuthContext)
  const [onboardingMode, setOnboardingMode] = useState('PUBLIC')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const res = await authAxios.get('/tenant/settings')
        setOnboardingMode(res.data.onboardingMode || 'PUBLIC')
      } catch (err) {
        console.error('Failed to load settings', err)
        setError('Failed to fetch current workspace settings.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [authAxios])

  const handleModeChange = async (mode) => {
    if (saving || mode === onboardingMode) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await authAxios.patch('/tenant/settings', { onboardingMode: mode })
      setOnboardingMode(res.data.onboardingMode)
      setSuccess('Workspace onboarding mode updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to update onboarding settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" size={24} />
          Onboarding & Access Control
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Configure how interns join your workspace. Changes apply immediately to all registration endpoints.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pattern A: Public Board */}
        <button
          onClick={() => handleModeChange('PUBLIC')}
          disabled={saving}
          className={`flex flex-col text-left p-5 rounded-2xl border transition-all relative ${
            onboardingMode === 'PUBLIC'
              ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/5'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
          } ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${
              onboardingMode === 'PUBLIC' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Globe size={18} />
            </div>
            <span className="font-bold text-sm text-slate-200">Public Job Board</span>
          </div>
          <span className="text-slate-400 text-xs leading-relaxed">
            Allow open signups. Unauthenticated applicants can apply directly, but their accounts are held as <strong className="text-amber-400/90">PENDING</strong> awaiting review.
          </span>
          {onboardingMode === 'PUBLIC' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          )}
        </button>

        {/* Pattern B: Invite Only */}
        <button
          onClick={() => handleModeChange('PRIVATE')}
          disabled={saving}
          className={`flex flex-col text-left p-5 rounded-2xl border transition-all relative ${
            onboardingMode === 'PRIVATE'
              ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/5'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
          } ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${
              onboardingMode === 'PRIVATE' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Mail size={18} />
            </div>
            <span className="font-bold text-sm text-slate-200">Invite-Only Portal</span>
          </div>
          <span className="text-slate-400 text-xs leading-relaxed">
            Require secure invitation links. Admins generate cryptographically signed tokens. Registered users are immediately <strong className="text-emerald-400">ACCEPTED</strong>.
          </span>
          {onboardingMode === 'PRIVATE' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-500 justify-center">
        <span>● Active System Mode: <strong>{onboardingMode === 'PUBLIC' ? 'OPEN APPLICATIONS' : 'INVITATION LOCK'}</strong></span>
      </div>
    </div>
  )
}

export default AdminSettings
