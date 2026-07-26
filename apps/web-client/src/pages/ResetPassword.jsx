import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('No reset token found. Please request a new password reset link.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await axios.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
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

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <CheckCircle size={32} color="#10B981" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Password reset!</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              Your password has been updated successfully. Redirecting you to the sign-in page…
            </p>
            <Link to="/login" style={{
              display: 'inline-block', padding: '10px 24px', background: 'var(--color-primary)',
              color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>
              Sign In Now
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.3px' }}>
              Set new password
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
              Your new password must be at least 8 characters long.
            </p>

            {!token && (
              <div style={{
                display: 'flex', gap: 10, padding: '12px 14px',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 8, color: '#b45309', fontSize: 13, marginBottom: 20, alignItems: 'flex-start'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Invalid or missing reset token. Please <Link to="/forgot-password" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>request a new link</Link>.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16
                }}>
                  {error}
                </div>
              )}

              {/* New password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="new-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    style={{
                      width: '100%', padding: '10px 36px 10px 36px',
                      border: '1px solid var(--border-default)', borderRadius: 8,
                      background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: 'var(--font-sans)',
                      boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Confirm new password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="confirm-password"
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px',
                      border: `1px solid ${confirmPassword && confirmPassword !== password ? '#ef4444' : 'var(--border-default)'}`,
                      borderRadius: 8, background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: 'var(--font-sans)',
                      boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => { if (!confirmPassword || confirmPassword === password) e.target.style.borderColor = 'var(--border-default)' }}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              <button
                id="reset-submit"
                type="submit"
                disabled={loading || !token || !password || !confirmPassword}
                style={{
                  width: '100%', padding: '11px', borderRadius: 8, border: 'none',
                  background: loading || !token || !password || !confirmPassword ? 'var(--bg-subtle)' : 'var(--color-primary)',
                  color: loading || !token || !password || !confirmPassword ? 'var(--text-muted)' : 'white',
                  fontSize: 14, fontWeight: 600,
                  cursor: loading || !token || !password || !confirmPassword ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s'
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
                  : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
