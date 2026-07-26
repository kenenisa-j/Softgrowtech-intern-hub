// StudentRegister.jsx — Nextern Design System v2
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  GraduationCap, Mail, Lock, User, ArrowRight, ArrowLeft,
  Eye, EyeOff, Moon, Sun, CheckCircle2, BookOpen
} from 'lucide-react'
import { Alert } from '../components/ui'

const StudentRegister = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const pwStrength = () => {
    if (!password.length) return { score: 0, label: '', color: '' }
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    const map = [
      { label: 'Too short', color: 'var(--color-danger)' },
      { label: 'Weak', color: 'var(--color-warning)' },
      { label: 'Fair', color: 'var(--color-warning)' },
      { label: 'Good', color: 'var(--color-success)' },
      { label: 'Strong', color: 'var(--color-success)' },
    ]
    return { score: s, ...map[s] }
  }
  const strength = pwStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await axios.post('/students/register', { name, email, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 20, padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={32} color="var(--color-success)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Account created!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
          Welcome to <strong style={{ color: 'var(--text-primary)' }}>Nextern</strong>! Your student account is ready. Sign in to start browsing and applying for internships.
        </p>
        <button onClick={() => navigate('/login')} className="nx-btn nx-btn-primary nx-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          Sign In Now <ArrowRight size={15} />
        </button>
        <div style={{ marginTop: 16 }}>
          <Link to="/internships" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            Browse internships first →
          </Link>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* Left brand panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #16a34a 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 48, position: 'relative', overflow: 'hidden'
      }} className="hide-on-mobile">
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
        >
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <BookOpen size={36} color="white" />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 12 }}>Start your career</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 300, lineHeight: 1.6, marginBottom: 32 }}>
            Create a free student account and discover hundreds of internship opportunities.
          </p>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', maxWidth: 280 }}>
            {[
              'Browse internships across every industry',
              'One-click application with your profile',
              'Track application status in real time',
              'Get evaluated and earn certificates',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={13} color="white" />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', background: 'var(--bg-card)', position: 'relative' }}>
        {/* Top nav */}
        <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="nx-btn nx-btn-ghost nx-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13 }}>
            <ArrowLeft size={13} /> Back to home
          </Link>
          <button onClick={toggleTheme} className="nx-btn nx-btn-ghost nx-btn-icon nx-btn-sm">
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
          <div className="show-on-mobile" style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Nextern</div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Create student account</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
              Find and apply for internships across any industry — free forever.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 20 }}>
              <Alert variant="danger">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="nx-form-group">
              <label className="nx-label nx-label-required">Full Name</label>
              <div className="nx-input-icon-wrapper">
                <span className="nx-input-icon"><User size={14} /></span>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="nx-input" autoComplete="name" />
              </div>
            </div>

            <div className="nx-form-group">
              <label className="nx-label nx-label-required">Email address</label>
              <div className="nx-input-icon-wrapper">
                <span className="nx-input-icon"><Mail size={14} /></span>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@university.edu" className="nx-input" autoComplete="email" />
              </div>
            </div>

            <div className="nx-form-group">
              <label className="nx-label nx-label-required">Password</label>
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
              {/* Strength bars */}
              {password.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < strength.score ? strength.color : 'var(--border-default)', transition: 'background 0.2s' }} />
                  ))}
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginLeft: 4, whiteSpace: 'nowrap' }}>{strength.label}</span>
                </div>
              )}
            </div>

            <button
              type="submit" disabled={isSubmitting || password.length < 8}
              className="nx-btn nx-btn-lg"
              style={{ width: '100%', marginTop: 6, background: 'var(--color-success)', border: 'none', color: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
            >
              {isSubmitting ? (
                <span className="nx-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
              ) : (
                <><span>Create Free Account</span><ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </span>
          </div>

          <div style={{ marginTop: 24, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Invited as an intern?</strong>{' '}
              You don't need to register. Use the invite link sent to your email by your organization.
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

export default StudentRegister
