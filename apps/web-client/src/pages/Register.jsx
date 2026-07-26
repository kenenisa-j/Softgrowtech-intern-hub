import { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Building2, Mail, Lock, User, Globe, ArrowRight, ArrowLeft,
  GraduationCap, CheckCircle2, AlertTriangle, Eye, EyeOff, Moon, Sun, Info
} from 'lucide-react'
import { Alert } from '../components/ui'

const STEPS = ['Organization', 'Admin Account', 'Review']

const Register = () => {
  const { theme, toggleTheme } = useTheme()
  const [step, setStep] = useState(0)
  const [orgName, setOrgName] = useState('')
  const [orgSubdomain, setOrgSubdomain] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubdomain = (v) => setOrgSubdomain(v.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      const subdomain = orgSubdomain.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
      const orgRes = await axios.post('/organizations', { name: orgName, subdomain })
      const tenantId = orgRes.data.organization.id
      await axios.post('/auth/register', { name, email, password, role: 'ORG_ADMIN', domain: 'Management', tenantId })
      setIsSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
      setStep(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const pwStrength = () => {
    if (password.length === 0) return { score: 0, label: '', color: '' }
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    const map = [
      { label: 'Too short', color: '#DC2626' },
      { label: 'Weak', color: '#F59E0B' },
      { label: 'Fair', color: '#F59E0B' },
      { label: 'Good', color: '#16A34A' },
      { label: 'Strong', color: '#16A34A' },
    ]
    return { score: s, ...map[s] }
  }
  const strength = pwStrength()

  // Success page
  if (isSuccess) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
          padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid var(--color-success-border)' }}>
          <CheckCircle2 size={32} color="var(--color-success)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Workspace created!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{orgName}</strong> has been registered. Your account is pending approval by a Nextern administrator.
        </p>

        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'left', marginBottom: 24 }}>
          {[
            { label: 'Subdomain', val: `${orgSubdomain}.nextern.io` },
            { label: 'Admin email', val: email },
            { label: 'Plan', val: 'Free (up to 5 interns)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.val}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 24, display: 'flex', gap: 10, textAlign: 'left' }}>
          <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Access is restricted until a Nextern superadmin approves your organization. You'll receive an email confirmation.
          </p>
        </div>

        <Link to="/login" className="nx-btn nx-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Go to Sign In
        </Link>
      </motion.div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 24, fontFamily: 'var(--font-sans)'
    }}>
      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)', zIndex: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Nextern</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggleTheme} className="nx-btn nx-btn-ghost nx-btn-icon nx-btn-sm">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link to="/login" className="nx-btn nx-btn-secondary nx-btn-sm">Sign in</Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)',
          width: '100%', maxWidth: 560, marginTop: 56, overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '32px 40px 24px', borderBottom: '1px solid var(--border-default)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Register your organization
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            Set up a Nextern workspace for your company in 3 simple steps.
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 24 }}>
            {STEPS.map((s, i) => (
              <Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: 13,
                    background: i < step ? 'var(--color-primary)' : i === step ? 'var(--color-primary)' : 'var(--bg-subtle)',
                    color: i <= step ? 'white' : 'var(--text-muted)',
                    border: i === step ? '2px solid var(--color-primary)' : '2px solid transparent',
                    boxShadow: i === step ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {i < step ? <CheckCircle2 size={15} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 11, color: i <= step ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < step ? 'var(--color-primary)' : 'var(--border-default)', marginBottom: 22, transition: 'background 0.3s', marginLeft: -2, marginRight: -2 }} />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Form body */}
        <div style={{ padding: '28px 40px' }}>
          {error && <div style={{ marginBottom: 20 }}><Alert variant="danger">{error}</Alert></div>}

          {/* Step 0 — Organization */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="nx-form-group">
                <label className="nx-label nx-label-required">Organization / Company name</label>
                <div className="nx-input-icon-wrapper">
                  <span className="nx-input-icon"><Building2 size={14} /></span>
                  <input type="text" required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Corporation" className="nx-input" />
                </div>
              </div>

              <div className="nx-form-group">
                <label className="nx-label nx-label-required">Workspace subdomain</label>
                <div className="nx-input-icon-wrapper">
                  <span className="nx-input-icon"><Globe size={14} /></span>
                  <input type="text" required value={orgSubdomain} onChange={e => handleSubdomain(e.target.value)} placeholder="acme" className="nx-input" />
                </div>
                {orgSubdomain && (
                  <span className="nx-helper" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={11} /> Your workspace URL: <strong>{orgSubdomain}.nextern.io</strong>
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!orgName.trim() || !orgSubdomain.trim()}
                onClick={() => setStep(1)}
                className="nx-btn nx-btn-primary"
                style={{ width: '100%', marginTop: 8 }}
              >
                Continue <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {/* Step 1 — Admin account */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="nx-form-group">
                <label className="nx-label nx-label-required">Your full name</label>
                <div className="nx-input-icon-wrapper">
                  <span className="nx-input-icon"><User size={14} /></span>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Admin" className="nx-input" />
                </div>
              </div>

              <div className="nx-form-group">
                <label className="nx-label nx-label-required">Work email</label>
                <div className="nx-input-icon-wrapper">
                  <span className="nx-input-icon"><Mail size={14} /></span>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@acme.com" className="nx-input" />
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
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i < strength.score ? strength.color : 'var(--border-default)', transition: 'background 0.2s' }} />
                    ))}
                    <span style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginLeft: 4, whiteSpace: 'nowrap' }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setStep(0)} className="nx-btn nx-btn-secondary" style={{ flex: 1 }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  disabled={!name.trim() || !email.trim() || password.length < 8}
                  onClick={() => setStep(2)}
                  className="nx-btn nx-btn-primary"
                  style={{ flex: 2 }}
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {[
                  { label: 'Organization', val: orgName },
                  { label: 'Subdomain', val: `${orgSubdomain}.nextern.io` },
                  { label: 'Admin name', val: name },
                  { label: 'Email', val: email },
                  { label: 'Plan', val: 'Free' },
                ].map((r, i) => (
                  <div key={r.label} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '11px 16px', fontSize: 13,
                    borderBottom: i < 4 ? '1px solid var(--border-default)' : 'none'
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{r.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <Alert variant="info">
                Your workspace will be set to <strong>Pending Approval</strong>. A Nextern admin will review and activate it, usually within 24 hours.
              </Alert>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setStep(1)} className="nx-btn nx-btn-secondary" style={{ flex: 1 }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button" onClick={handleSubmit} disabled={isSubmitting}
                  className="nx-btn nx-btn-primary"
                  style={{ flex: 2 }}
                >
                  {isSubmitting
                    ? <span className="nx-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                    : <><span>Create workspace</span><ArrowRight size={14} /></>}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 40px', borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Already have a workspace? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </span>
        </div>
      </motion.div>
    </div>
  )
}

export default Register
