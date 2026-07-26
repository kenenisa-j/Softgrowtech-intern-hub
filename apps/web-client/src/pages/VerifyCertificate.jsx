// VerifyCertificate.jsx — Nextern Design System v2
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  GraduationCap, Award, CheckCircle2, XCircle,
  Calendar, Building2, User, ArrowLeft, Moon, Sun, Loader2, Shield
} from 'lucide-react'

const VerifyCertificate = () => {
  const { id } = useParams()
  const { theme, toggleTheme } = useTheme()
  const [cert, setCert]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios.get(`/reports/verify/${id}`)
      .then(r => setCert(r.data?.certificate || r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      {/* Navbar */}
      <header style={{ height: 60, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Nextern</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/" className="nx-btn nx-btn-ghost nx-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Home
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        {/* Page label */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', borderRadius: 999, marginBottom: 16 }}>
            <Shield size={13} color="var(--color-primary)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>Certificate Verification Portal</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: 8 }}>Verify Certificate</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Confirm the authenticity of a Nextern internship completion certificate.
          </p>
        </div>

        {/* State: Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 12 }}>Verifying certificate…</p>
          </div>
        )}

        {/* State: Not found */}
        {!loading && notFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--color-danger-border, #fecaca)', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid var(--color-danger-border)' }}>
              <XCircle size={36} color="var(--color-danger)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Certificate not found</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              No certificate matches the provided ID. This certificate may be invalid, expired, or the ID may be incorrect.
            </p>
            <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 24, wordBreak: 'break-all' }}>
              ID: {id}
            </div>
            <Link to="/" className="nx-btn nx-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={13} /> Back to Nextern
            </Link>
          </motion.div>
        )}

        {/* State: Valid certificate */}
        {!loading && cert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Valid banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)', borderRadius: 12, marginBottom: 24 }}>
              <CheckCircle2 size={20} color="var(--color-success)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>Certificate verified ✓</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This is an authentic Nextern-issued certificate.</div>
              </div>
            </div>

            {/* Certificate card */}
            <div style={{
              background: 'var(--bg-card)', border: '2px solid var(--color-primary-border)',
              borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-xl)'
            }}>
              {/* Top gradient header */}
              <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563EB, #4F46E5)', padding: '32px 32px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(255,255,255,0.3)' }}>
                    <Award size={32} color="white" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Certificate of Completion</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>Nextern Internship Program</div>
                </div>
              </div>

              {/* Certificate body */}
              <div style={{ padding: '32px', position: 'relative', marginTop: -16 }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '24px', border: '1px solid var(--border-default)', marginBottom: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>This certifies that</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>{cert.internName || cert.holder || '—'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>has successfully completed the internship program</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginTop: 8 }}>{cert.programTitle || cert.program?.title || '—'}</div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: Building2, label: 'Organization', val: cert.organizationName || cert.organization?.name || '—' },
                    { icon: Calendar, label: 'Issued On', val: cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { icon: User, label: 'Mentor', val: cert.mentorName || cert.mentor?.name || '—' },
                    { icon: Award, label: 'Certificate ID', val: id?.slice(0, 8) + '…', mono: true },
                  ].map(r => (
                    <div key={r.label} style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-default)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <r.icon size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: r.mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                {/* Verification footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--color-success-light)', borderRadius: 10, border: '1px solid var(--color-success-border)', marginBottom: 20 }}>
                  <Shield size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    This certificate was digitally issued by <strong>Nextern</strong> and is cryptographically verifiable. The holder's achievement is confirmed authentic.
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => window.print()} className="nx-btn nx-btn-primary">
                    <Award size={14} /> Download / Print
                  </button>
                  <Link to="/" className="nx-btn nx-btn-secondary">
                    <ArrowLeft size={14} /> Return to Nextern
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default VerifyCertificate
