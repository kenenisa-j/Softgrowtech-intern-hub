// AcceptInvite.jsx — Nextern Design System v2
import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  GraduationCap, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  CheckCircle2, AlertTriangle, Loader2, Moon, Sun, Briefcase, User
} from 'lucide-react'
import { Alert } from '../components/ui'

const AcceptInvite = () => {
  const { token: inviteToken } = useParams()
  const { setAuthData } = useContext(AuthContext)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [invite, setInvite]       = useState(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [inviteError, setInviteError] = useState('')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  useEffect(() => {
    axios.get(`/invites/validate/${inviteToken}`)
      .then(r => setInvite(r.data?.invite || r.data))
      .catch(() => setInviteError('This invite link is invalid or has expired.'))
      .finally(() => setLoadingInvite(false))
  }, [inviteToken])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setIsSubmitting(true)
    try {
      const { data } = await axios.post(`/invites/accept/${inviteToken}`, { password })
      if (data.token && data.user) {
        setAuthData(data.token, data.user)
      }
      setSuccess(true)
      setTimeout(() => {
        const role = (data.user?.role || '').toUpperCase()
        navigate(role === 'MENTOR' ? '/mentor/dashboard' : '/intern/dashboard')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ height: 60, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Nextern</span>
        </Link>
        <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        {/* Loading */}
        {loadingInvite && (
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>Validating your invite…</p>
          </div>
        )}

        {/* Invalid invite */}
        {!loadingInvite && inviteError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 20, padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid var(--color-danger-border)' }}>
              <AlertTriangle size={36} color="var(--color-danger)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Invite link invalid</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              {inviteError}
            </p>
            <Link to="/login" className="nx-btn nx-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={13} /> Go to Sign In
            </Link>
          </motion.div>
        )}

        {/* Success */}
        {!loadingInvite && success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 20, padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid var(--color-success-border)' }}>
              <CheckCircle2 size={36} color="var(--color-success)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Account activated!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Your account has been set up successfully. Redirecting you to your dashboard…
            </p>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={20} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          </motion.div>
        )}

        {/* Accept invite form */}
        {!loadingInvite && !inviteError && !success && invite && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 20, boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 480, overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563EB)', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 999, marginBottom: 14, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Briefcase size={11} color="white" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'white' }}>Internship Invitation</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6, letterSpacing: '-0.3px' }}>
                  You're invited! 🎉
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                  Set up your password to activate your Nextern account.
                </p>
              </div>
            </div>

            {/* Invite details */}
            <div style={{ margin: '20px 28px 0', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: invite.programTitle ? 10 : 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{invite.name || invite.email}</div>
                  {invite.email && invite.name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{invite.email}</div>}
                </div>
              </div>
              {invite.programTitle && (
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Program: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{invite.programTitle}</span>
                </div>
              )}
              {invite.organizationName && (
                <div style={{ paddingTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Organization: </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{invite.organizationName}</span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '20px 28px 28px' }}>
              {error && (
                <div style={{ marginBottom: 16 }}>
                  <Alert variant="danger">{error}</Alert>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="nx-form-group">
                  <label className="nx-label nx-label-required">Create Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" className="nx-input"
                      style={{ paddingLeft: 36, paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <span className="nx-helper">At least 8 characters. Pick something strong.</span>
                </div>

                <div className="nx-form-group">
                  <label className="nx-label nx-label-required">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'} required value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your password" className="nx-input"
                      style={{ paddingLeft: 36 }}
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <span className="nx-helper" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={11} /> Passwords do not match
                    </span>
                  )}
                  {confirm && password === confirm && confirm.length >= 8 && (
                    <span className="nx-helper" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={11} /> Passwords match
                    </span>
                  )}
                </div>

                <button
                  type="submit" disabled={isSubmitting || password.length < 8 || password !== confirm}
                  className="nx-btn nx-btn-primary nx-btn-lg"
                  style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}
                >
                  {isSubmitting ? (
                    <span className="nx-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                  ) : (
                    <><span>Activate Account</span><ArrowRight size={15} /></>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default AcceptInvite
