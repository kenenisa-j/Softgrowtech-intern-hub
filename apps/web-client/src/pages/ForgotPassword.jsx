import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { GraduationCap, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await axios.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-card)', borderRadius: 20,
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-xl)', padding: '40px 36px'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} color="white" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Nextern</span>
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <CheckCircle size={32} color="#10B981" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Check your email</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
              We sent a password reset link to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              The link expires in 1 hour.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, padding: 0 }}
              >
                try again
              </button>.
            </p>
            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', fontWeight: 500
            }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.3px' }}>
              Forgot password?
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@organization.com"
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px',
                      border: '1px solid var(--border-default)', borderRadius: 8,
                      background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: 'var(--font-sans)',
                      boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                  background: loading || !email.trim() ? 'var(--bg-subtle)' : 'var(--color-primary)',
                  color: loading || !email.trim() ? 'var(--text-muted)' : 'white',
                  fontSize: 14, fontWeight: 600,
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s', marginBottom: 20
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                  : 'Send Reset Link'}
              </button>
            </form>

            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', fontWeight: 500
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
