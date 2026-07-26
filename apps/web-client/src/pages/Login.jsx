// Login.jsx — Nextern Design System
import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, GraduationCap, Moon, Sun } from 'lucide-react'
import { Alert } from '../components/ui'

const Login = () => {
  const navigate = useNavigate()
  const { setAuthData } = useContext(AuthContext)
  const { theme, toggleTheme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [isRejected, setIsRejected] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setIsPending(false); setIsRejected(false)
    setIsSubmitting(true)
    try {
      const { data } = await axios.post('/auth/login', { email, password })
      setAuthData(data.token, data.user)
      const role = (data.user.role || '').toUpperCase()
      const routes = {
        SUPERADMIN: '/superadmin/dashboard',
        ORG_ADMIN:  '/admin/dashboard',
        MENTOR:     '/mentor/dashboard',
        INTERN:     '/intern/dashboard',
        STUDENT:    '/student/dashboard',
      }
      navigate(routes[role] || '/login')
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message || ''
      if (status === 403) {
        if (msg.includes('pending') || msg.includes('approval')) setIsPending(true)
        else if (msg.includes('rejected')) setIsRejected(true)
        else setError(msg || 'Access denied.')
      } else {
        setError(msg || 'Invalid email or password.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Left Panel — branding */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563EB 50%, #4F46E5 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 48, position: 'relative', overflow: 'hidden'
      }} className="hide-on-mobile">
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <GraduationCap size={36} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 12 }}>
            Nextern
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 300, lineHeight: 1.6 }}>
            The modern internship management platform for organizations and talent.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 32 }}>
            {['Multi-tenant SaaS', 'Smart matching', 'Real-time tracking', 'AI evaluations'].map(f => (
              <span key={f} style={{
                padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.15)'
              }}>{f}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — form */}
      <div style={{
        width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 40px', background: 'var(--bg-card)',
        position: 'relative'
      }}>
        {/* Top row */}
        <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}
            className="nx-btn nx-btn-ghost nx-btn-sm">
            <ArrowLeft size={13} /> Back to home
          </Link>
          <button onClick={toggleTheme} className="nx-btn nx-btn-ghost nx-btn-icon nx-btn-sm" title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}
        >
          {/* Mobile logo */}
          <div className="show-on-mobile" style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
            }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Nextern</div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
              Sign in to your Nextern workspace
            </p>
          </div>

          {/* Alerts */}
          {isPending && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant="warning" title="Workspace pending approval">
                Your organization is awaiting review by a Nextern administrator. You'll receive an email once approved.
              </Alert>
            </div>
          )}
          {isRejected && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant="danger" title="Registration rejected">
                This workspace registration was denied. Please contact support for more information.
              </Alert>
            </div>
          )}
          {error && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div className="nx-form-group">
              <label className="nx-label nx-label-required">Email address</label>
              <div className="nx-input-icon-wrapper">
                <span className="nx-input-icon"><Mail size={14} /></span>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="nx-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="nx-form-group">
              <label className="nx-label nx-label-required">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                  <Lock size={14} />
                </span>
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nx-input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button" onClick={() => setShowPw(s => !s)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', padding: 2
                  }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{
                fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500
              }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="nx-btn nx-btn-primary nx-btn-lg"
              style={{ width: '100%', marginTop: 4 }}
            >
              {isSubmitting ? (
                <span className="nx-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              ) : (
                <><span>Sign in</span><ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Need an organization account?{' '}
              <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Register workspace
              </Link>
            </span>
          </div>

          <div style={{
            marginTop: 32, padding: '14px 16px', background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)'
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Interns & Mentors:</strong>{' '}
              You don't need to register. Use the credentials sent to your email by your organization admin.
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: block !important; }
        }
        .show-on-mobile { display: none; }
      `}</style>
    </div>
  )
}

export default Login
