import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import {
  GraduationCap, MapPin, Calendar, Clock, Building2,
  BadgeCheck, ArrowRight, Bookmark, BookmarkCheck, Share2,
  DollarSign, Briefcase, Users, FileText, CheckCircle, Loader2,
  Sparkles, ExternalLink, ChevronRight, X
} from 'lucide-react'

export default function ProgramDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, authAxios } = useContext(AuthContext)

  const [program, setProgram] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isSaved, setIsSaved] = useState(false)
  const [savingBookmark, setSavingBookmark] = useState(false)

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [hasProfileResume, setHasProfileResume] = useState(false)
  const [useProfileResume, setUseProfileResume] = useState(true)

  const [applyForm, setApplyForm] = useState({
    coverLetter: '',
    linkedinLink: '',
    portfolioLink: '',
    cvFile: null,
    cvFileName: '',
    cvFileData: ''
  })

  const [shared, setShared] = useState(false)

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/programs/public/${id}`)
        setProgram(res.data.program)
        setSimilar(res.data.similar || [])

        if (token && user?.role === 'STUDENT') {
          const savedRes = await authAxios.get('/students/saved')
          const isBookmarked = (savedRes.data?.saved || []).some(s => s.program_id === id)
          setIsSaved(isBookmarked)

          const profileRes = await authAxios.get('/students/profile')
          const profile = profileRes.data?.student || profileRes.data?.profile || {}
          setHasProfileResume(!!profile.resume_url)
          setApplyForm(prev => ({
            ...prev,
            linkedinLink: profile.linkedin_url || '',
            portfolioLink: profile.portfolio_url || ''
          }))
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Internship program details not found.')
      } finally {
        setLoading(false)
      }
    }
    if (id) loadDetails()
  }, [id, token, user, authAxios])

  const toggleSave = async () => {
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    if (user?.role !== 'STUDENT') return
    try {
      setSavingBookmark(true)
      if (isSaved) {
        await authAxios.delete(`/students/saved/${id}`)
        setIsSaved(false)
      } else {
        await authAxios.post(`/students/saved/${id}`)
        setIsSaved(true)
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    } finally {
      setSavingBookmark(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setApplyForm(prev => ({
        ...prev,
        cvFile: file,
        cvFileName: file.name,
        cvFileData: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    setApplying(true)
    try {
      const payload = {
        programId: id,
        name: user?.name || '',
        email: user?.email || '',
        coverLetter: applyForm.coverLetter,
        linkedinLink: applyForm.linkedinLink,
        portfolioLink: applyForm.portfolioLink
      }

      if (!useProfileResume || !hasProfileResume) {
        if (!applyForm.cvFileData) {
          alert('Please upload a resume.')
          setApplying(false)
          return
        }
        payload.cvFileName = applyForm.cvFileName
        payload.cvFileData = applyForm.cvFileData
      }

      await authAxios.post('/programs/apply', payload)
      setApplySuccess(true)
      setTimeout(() => {
        setShowApplyModal(false)
        setApplySuccess(false)
      }, 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application.')
    } finally {
      setApplying(false)
    }
  }

  // ── Loading / Error States ─────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} style={{ color: '#a855f7', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (error || !program) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#71717a' }}>
      <Briefcase size={40} style={{ opacity: 0.3 }} />
      <p style={{ fontSize: 14 }}>{error || 'Internship program not found.'}</p>
      <Link to="/internships" style={{ fontSize: 12, color: '#c084fc', textDecoration: 'none' }}>← Back to Internships</Link>
    </div>
  )

  const formattedDeadline = program.deadline ? new Date(program.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'
  const formattedStartDate = program.start_date ? new Date(program.start_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'
  const isClosed = program.status !== 'OPEN' || (program.deadline && new Date(program.deadline) < new Date())

  // ── Color Tokens ───────────────────────────────────────────
  const C = {
    bg: '#09090b',
    surface: '#18181b',
    border: '#27272a',
    borderSub: '#3f3f46',
    text: '#fafafa',
    muted: '#a1a1aa',
    dim: '#71717a',
    primary: '#a855f7',
    primaryBg: 'rgba(168,85,247,0.1)',
    primaryBorder: 'rgba(168,85,247,0.25)',
    green: '#4ade80',
    greenBg: 'rgba(74,222,128,0.1)',
    greenBorder: 'rgba(74,222,128,0.25)',
    red: '#f87171',
    redBg: 'rgba(248,113,113,0.1)',
    redBorder: 'rgba(248,113,113,0.25)',
  }

  const Section = ({ icon: Icon, title, children }) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Icon size={18} style={{ color: C.primary }} /> {title}
      </h2>
      {children}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif', paddingBottom: 64 }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40, height: 56,
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)',
        padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={14} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nextern</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/internships" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>Browse</Link>
          {token ? (
            <Link to={user?.role === 'STUDENT' ? '/student/dashboard' : '/admin/dashboard'}
              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, textDecoration: 'none' }}>
              Dashboard
            </Link>
          ) : (
            <Link to="/login"
              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div style={{ background: `linear-gradient(180deg, rgba(24,24,27,0.7) 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, paddingTop: 40, paddingBottom: 32 }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {program.tenant?.logo_url
                  ? <img src={program.tenant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Building2 size={28} style={{ color: C.dim }} />
                }
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>{program.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 13, color: C.muted }}>
                  <Link to={`/org/${program.tenant?.id}`} style={{ color: C.muted, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {program.tenant?.name || 'Organization'}
                    {program.tenant?.is_verified && <BadgeCheck size={14} style={{ color: C.green }} />}
                  </Link>
                  <span style={{ color: C.border }}>•</span>
                  <span>{program.tenant?.industry || 'Industry'}</span>
                  <span style={{ color: C.border }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {program.location || 'Remote'}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${C.primaryBorder}`, background: C.primaryBg, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{program.category}</span>
              <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{program.type}</span>
              <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${program.is_paid ? C.greenBorder : C.border}`, background: program.is_paid ? C.greenBg : C.surface, color: program.is_paid ? C.green : '#d4d4d8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {program.is_paid ? 'Paid' : 'Unpaid'}
              </span>
              {isClosed && (
                <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Closed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>

        {/* Left Column */}
        <div>
          {/* About */}
          <Section icon={Briefcase} title="About the Internship">
            <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{program.description || 'No description provided.'}</p>
          </Section>

          {program.responsibilities && (
            <Section icon={Sparkles} title="Key Responsibilities">
              <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{program.responsibilities}</p>
            </Section>
          )}

          {program.skills?.length > 0 && (
            <Section icon={GraduationCap} title="Required Skills">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {program.skills.map(skill => (
                  <span key={skill} style={{ padding: '4px 12px', background: C.surface, border: `1px solid ${C.border}`, color: '#d4d4d8', fontSize: 12, borderRadius: 8 }}>{skill}</span>
                ))}
              </div>
            </Section>
          )}

          {program.preferred_quals && (
            <Section icon={FileText} title="Requirements & Preferred Qualifications">
              <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{program.preferred_quals}</p>
            </Section>
          )}

          {program.benefits && (
            <Section icon={DollarSign} title="Stipend & Benefits">
              <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{program.benefits}</p>
            </Section>
          )}

          {program.tenant?.description && (
            <Section icon={Building2} title={`About ${program.tenant.name}`}>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {program.tenant.description}
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <Link to={`/org/${program.tenant.id}`} style={{ fontSize: 12, fontWeight: 700, color: C.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View Company Profile <ArrowRight size={12} />
                </Link>
                {program.tenant.website && (
                  <a href={program.tenant.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: C.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Visit Website <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, position: 'sticky', top: 72 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Opportunity Overview</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                { Icon: Clock, label: 'Duration', val: program.duration || 'Flexible', color: C.primary },
                { Icon: Calendar, label: 'Start Date', val: formattedStartDate, color: C.primary },
                { Icon: Users, label: 'Available Positions', val: `${program.positions || 1} open role(s)`, color: C.primary },
                { Icon: Calendar, label: 'Application Deadline', val: formattedDeadline, color: C.red },
              ].map(({ Icon, label, val, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: label === 'Application Deadline' ? C.red : C.text, marginTop: 2 }}>{val}</div>
                  </div>
                </div>
              ))}

              {program.is_paid && program.stipend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DollarSign size={15} style={{ color: C.green }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#4ade8066', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stipend Amount</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginTop: 2 }}>{parseFloat(program.stipend).toLocaleString()} ETB / Month</div>
                  </div>
                </div>
              )}
            </div>

            <hr style={{ borderColor: C.border, marginBottom: 16 }} />

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isClosed ? (
                <button disabled style={{ width: '100%', padding: '12px', background: C.surface, border: `1px solid ${C.border}`, color: C.dim, fontSize: 13, fontWeight: 700, borderRadius: 12, cursor: 'not-allowed' }}>
                  Applications Closed
                </button>
              ) : !token ? (
                <button
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 900, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Sign In to Apply <ArrowRight size={14} />
                </button>
              ) : user?.role === 'STUDENT' ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 900, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Apply to Program <ArrowRight size={14} />
                </button>
              ) : (
                <button disabled style={{ width: '100%', padding: '12px', background: C.surface, color: C.dim, fontSize: 13, fontWeight: 700, borderRadius: 12, border: `1px solid ${C.border}`, cursor: 'not-allowed' }}>
                  Available for Students Only
                </button>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={toggleSave}
                  disabled={savingBookmark || user?.role !== 'STUDENT'}
                  style={{ padding: '8px', border: `1px solid ${isSaved ? C.primaryBorder : C.border}`, background: isSaved ? C.primaryBg : C.surface, color: isSaved ? C.primary : '#d4d4d8', borderRadius: 12, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                  {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleShare}
                  style={{ padding: '8px', border: `1px solid ${C.border}`, background: C.surface, color: '#d4d4d8', borderRadius: 12, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', position: 'relative' }}>
                  <Share2 size={14} />
                  Share
                  {shared && (
                    <span style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', background: C.surface, color: C.text, fontSize: 10, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar Programs ── */}
      {similar.length > 0 && (
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 24px 32px', borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 24 }}>Similar Internship Programs</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {similar.map(item => (
              <Link key={item.id} to={`/program/${item.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.borderSub}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {item.tenant?.logo_url
                          ? <img src={item.tenant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Building2 size={20} style={{ color: C.dim }} />
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tenant?.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      <span style={{ padding: '2px 8px', fontSize: 10, background: '#27272a', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, textTransform: 'uppercase', fontWeight: 700 }}>{item.type}</span>
                      <span style={{ padding: '2px 8px', fontSize: 10, background: '#27272a', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, textTransform: 'uppercase', fontWeight: 700 }}>{item.is_paid ? 'Paid' : 'Unpaid'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View Opportunity <ChevronRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Apply Modal ── */}
      {showApplyModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setShowApplyModal(false)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative' }}>

            {applySuccess ? (
              <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green }}>
                  <CheckCircle size={32} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Application Submitted!</h3>
                <p style={{ fontSize: 13, color: C.muted, maxWidth: 340, lineHeight: 1.6 }}>
                  Your application has been submitted to <strong>{program.tenant?.name}</strong>. The team will review it shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Apply to {program.title}</h3>
                    <p style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>at {program.tenant?.name}</p>
                  </div>
                  <button type="button" onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                  {/* Resume section */}
                  {hasProfileResume ? (
                    <div style={{ background: '#27272a', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" checked={useProfileResume} onChange={e => setUseProfileResume(e.target.checked)} style={{ width: 14, height: 14, accentColor: C.primary }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Use resume from my profile</span>
                      </label>
                      {!useProfileResume && (
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Upload New Resume (PDF)</label>
                          <input type="file" accept=".pdf" onChange={handleFileChange} style={{ fontSize: 12, color: C.muted, width: '100%' }} />
                          {applyForm.cvFileName && <div style={{ fontSize: 12, color: C.green, marginTop: 4, fontWeight: 600 }}>{applyForm.cvFileName}</div>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Upload Resume (PDF) *</label>
                      <input type="file" accept=".pdf" required onChange={handleFileChange} style={{ fontSize: 12, color: C.muted, width: '100%' }} />
                      {applyForm.cvFileName && <div style={{ fontSize: 12, color: C.green, marginTop: 4, fontWeight: 600 }}>{applyForm.cvFileName}</div>}
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Cover Letter (Optional)</label>
                    <textarea rows={4} value={applyForm.coverLetter} onChange={e => setApplyForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                      placeholder="Introduce yourself and explain why you're a great fit..."
                      style={{ width: '100%', background: '#27272a', border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: '10px 14px', fontSize: 12, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Portfolio / GitHub Link</label>
                    <input type="url" value={applyForm.portfolioLink} onChange={e => setApplyForm(prev => ({ ...prev, portfolioLink: e.target.value }))}
                      placeholder="https://github.com/..."
                      style={{ width: '100%', background: '#27272a', border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: '10px 14px', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>LinkedIn URL</label>
                    <input type="url" value={applyForm.linkedinLink} onChange={e => setApplyForm(prev => ({ ...prev, linkedinLink: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                      style={{ width: '100%', background: '#27272a', border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: '10px 14px', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, background: C.surface, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setShowApplyModal(false)}
                    style={{ padding: '8px 16px', border: `1px solid ${C.border}`, background: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.muted, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={applying}
                    style={{ padding: '8px 16px', background: applying ? '#3f3f46' : '#9333ea', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 900, color: '#fff', cursor: applying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {applying ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
