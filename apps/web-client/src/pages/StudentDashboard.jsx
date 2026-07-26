// StudentDashboard.jsx — Nextern Design System v2
import { useState, useEffect, useContext, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  Card, CardHeader, CardBody, Badge, StatusBadge, Button,
  EmptyState, SkeletonCard, Tabs, PageHeader, Alert, Avatar
} from '../components/ui'
import {
  Search, ClipboardList, User, Briefcase, MapPin, Calendar,
  Clock, ArrowRight, RefreshCw, GraduationCap, Building2, X, Bookmark
} from 'lucide-react'
import axios from 'axios'


const StudentDashboard = () => {
  const { authAxios, user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('browse')
  const [loading, setLoading]     = useState(true)

  const [programs, setPrograms]       = useState([])
  const [applications, setApplications] = useState([])
  const [profile, setProfile]         = useState({})
  const [savedPrograms, setSavedPrograms] = useState([])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter]   = useState('')

  const [applying, setApplying]       = useState(null)
  const [applyForm, setApplyForm]     = useState({ coverLetter: '', linkedinLink: '', portfolioLink: '' })
  const [applySuccess, setApplySuccess] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const fetchAll = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    try {
      const pRes = await axios.get('/programs/public').catch(() => ({ data: { programs: [] } }))
      setPrograms(pRes.data?.programs || [])

      const aRes = await authAxios.get('/students/applications').catch(() => ({ data: { applications: [] } }))
      setApplications(aRes.data?.applications || [])

      const prRes = await authAxios.get('/students/profile').catch(() => ({ data: {} }))
      setProfile(prRes.data?.student || prRes.data?.profile || {})

      const sRes = await authAxios.get('/students/saved').catch(() => ({ data: { saved: [] } }))
      setSavedPrograms(sRes.data?.saved || [])
    } finally { setLoading(false) }
  }, [authAxios])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleBookmark = async (programId) => {
    const isBookmarked = savedPrograms.some(s => s.program_id === programId)
    try {
      if (isBookmarked) {
        await authAxios.delete(`/students/saved/${programId}`)
      } else {
        await authAxios.post(`/students/saved/${programId}`)
      }
      const sRes = await authAxios.get('/students/saved').catch(() => ({ data: { saved: [] } }))
      setSavedPrograms(sRes.data?.saved || [])
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }

  const applyToProgram = async (programId) => {
    try {
      await authAxios.post('/applications', { programId, ...applyForm })
      setApplying(null)
      setApplyForm({ coverLetter: '', linkedinLink: '', portfolioLink: '' })
      setApplySuccess(programId)
      fetchAll()
      setTimeout(() => setApplySuccess(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply.')
    }
  }


  const handleProfileFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await authAxios.post('/uploads', {
          fileName: file.name,
          fileData: reader.result
        });
        setProfile(p => ({ ...p, [field]: res.data.url }));
        alert(`${field === 'resume_url' ? 'Resume' : 'Avatar'} uploaded successfully! Click "Save Profile" to apply.`);
      } catch (err) {
        alert('File upload failed. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await authAxios.put('/students/profile', profile)
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally { setSavingProfile(false) }
  }

  const appliedIds = applications.map(a => a.programId)

  const categories = [...new Set(programs.map(p => p.category).filter(Boolean))]

  const filteredPrograms = programs.filter(p => {
    const q = searchQuery.toLowerCase()
    const matchQ = !q || p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.organization?.name?.toLowerCase().includes(q)
    const matchCat = !categoryFilter || p.category === categoryFilter
    const matchType = !typeFilter || p.type === typeFilter
    return matchQ && matchCat && matchType
  })

  const TABS = [
    { key: 'browse',       label: 'Browse',       icon: Search },
    { key: 'saved',        label: 'Saved Internships', icon: Bookmark, count: savedPrograms.length },
    { key: 'applications', label: 'My Applications', icon: ClipboardList, count: applications.length },
    { key: 'profile',      label: 'Profile',       icon: User },
  ]


  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <PageHeader
        title="Find Internships"
        subtitle={`Hello, ${user?.name?.split(' ')[0] || 'there'}! Find your next opportunity.`}
        actions={<Button variant="ghost" icon={RefreshCw} onClick={fetchAll} size="sm">Refresh</Button>}
      />

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* ── BROWSE ───────────────────────────────────── */}
          {activeTab === 'browse' && (
            <div className="nx-stack-md">
              {applySuccess && (
                <Alert variant="success" title="Application submitted!" onClose={() => setApplySuccess(null)}>
                  Your application has been received. The organization will review it shortly.
                </Alert>
              )}

              {/* Filters */}
              <Card>
                <CardBody compact>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="nx-search" style={{ flex: 1, minWidth: 200 }}>
                      <Search size={13} style={{ color: 'var(--text-muted)' }} />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title, category, or organization…" />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="nx-select" style={{ width: 'auto', minWidth: 160 }}>
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="nx-select" style={{ width: 'auto', minWidth: 130 }}>
                      <option value="">All Types</option>
                      <option value="ONSITE">Onsite</option>
                      <option value="REMOTE">Remote</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                    {(searchQuery || categoryFilter || typeFilter) && (
                      <button onClick={() => { setSearchQuery(''); setCategoryFilter(''); setTypeFilter('') }}
                        className="nx-btn nx-btn-ghost nx-btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <X size={13} /> Clear
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>

              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {filteredPrograms.length} internship{filteredPrograms.length !== 1 ? 's' : ''} found
              </div>

              {filteredPrograms.length === 0 ? (
                <Card><CardBody><EmptyState icon={Briefcase} title="No internships found" description="Try adjusting your filters or search terms." /></CardBody></Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {filteredPrograms.map(p => {
                    const isApplied = appliedIds.includes(p.id)
                    const isBookmarked = savedPrograms.some(s => s.program_id === p.id)
                    const org = p.tenant || p.organization || {}
                    const logo = org.logo_url
                    const name = org.name || 'Organization'
                    const verified = org.is_verified || false

                    return (
                      <Card key={p.id} hover>
                        <CardBody>
                          {/* Org logo + info */}
                          <div style={{ display: 'flex', gap: 12, marginBottom: 12, position: 'relative' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {logo
                                ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Building2 size={20} color="var(--color-primary)" />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {name}
                                {verified && <span style={{ color: '#10B981', fontSize: 11 }}>✔</span>}
                              </div>
                            </div>
                          </div>

                          {/* Badges */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <Badge variant="blue">{p.category}</Badge>
                            <Badge variant="gray">{p.type}</Badge>
                            {p.is_paid ? <Badge variant="green">Paid</Badge> : <Badge variant="gray">Unpaid</Badge>}
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.description || 'No description provided.'}
                          </p>

                          {/* Meta row */}
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                            {[
                              { icon: MapPin, val: p.location || 'Remote' },
                              { icon: Clock, val: p.duration || '—' },
                              { icon: Calendar, val: p.deadline ? `Deadline: ${new Date(p.deadline).toLocaleDateString()}` : '' },
                            ].filter(r => r.val).map((r, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                <r.icon size={11} />
                                <span>{r.val}</span>
                              </div>
                            ))}
                          </div>

                          {/* Skills */}
                          {p.skills?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                              {p.skills.slice(0, 4).map(s => (
                                <span key={s} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: 999, border: '1px solid var(--border-default)' }}>{s}</span>
                              ))}
                              {p.skills.length > 4 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{p.skills.length - 4} more</span>}
                            </div>
                          )}


                          {/* CTA */}
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <Link
                              to={`/program/${p.id}`}
                              className="nx-btn nx-btn-primary"
                              style={{ flex: 1, textDecoration: 'none', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                            >
                              View Details
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleBookmark(p.id)}
                              className={`nx-btn ${isBookmarked ? 'nx-btn-primary' : 'nx-btn-secondary'}`}
                              style={{ width: 38, height: 38, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                              <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          {isApplied && (
                            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <GraduationCap size={13} /> You have applied to this internship
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Apply Modal */}
              {applying && (
                <div className="nx-modal-overlay" onClick={e => e.target === e.currentTarget && setApplying(null)}>
                  <div className="nx-modal nx-modal-md nx-scale-in">
                    <div className="nx-modal-header">
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Apply to {applying.title}</h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>at {applying.organization?.name}</p>
                      </div>
                      <button onClick={() => setApplying(null)} className="nx-btn nx-btn-ghost nx-btn-icon nx-btn-sm">
                        <X size={15} />
                      </button>
                    </div>
                    <div className="nx-modal-body">
                      <div className="nx-stack-md">
                        <div className="nx-form-group">
                          <label className="nx-label">Cover Letter</label>
                          <textarea value={applyForm.coverLetter} onChange={e => setApplyForm(f=>({...f,coverLetter:e.target.value}))} placeholder="Tell the organization why you're a great fit…" className="nx-textarea" rows={5} />
                        </div>
                        <div className="nx-form-group">
                          <label className="nx-label">LinkedIn Profile URL</label>
                          <input type="url" value={applyForm.linkedinLink} onChange={e => setApplyForm(f=>({...f,linkedinLink:e.target.value}))} placeholder="https://linkedin.com/in/yourprofile" className="nx-input" />
                        </div>
                        <div className="nx-form-group">
                          <label className="nx-label">Portfolio / GitHub URL</label>
                          <input type="url" value={applyForm.portfolioLink} onChange={e => setApplyForm(f=>({...f,portfolioLink:e.target.value}))} placeholder="https://github.com/yourhandle" className="nx-input" />
                        </div>
                      </div>
                    </div>
                    <div className="nx-modal-footer">
                      <Button variant="secondary" onClick={() => setApplying(null)}>Cancel</Button>
                      <Button variant="primary" onClick={() => applyToProgram(applying.id)}>
                        Submit Application <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SAVED INTERNSHIPS ─────────────────────────── */}
          {activeTab === 'saved' && (
            <div className="nx-stack-md">
              {savedPrograms.length === 0 ? (
                <Card><CardBody>
                  <EmptyState
                    icon={Bookmark}
                    title="No saved internships"
                    description="When you find an internship you like, save it to keep track of it here."
                    action={<Button variant="primary" onClick={() => setActiveTab('browse')} icon={Search}>Browse Internships</Button>}
                  />
                </CardBody></Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {savedPrograms.map(saved => {
                    const p = saved.program || {}
                    const isApplied = appliedIds.includes(p.id)
                    const org = p.tenant || p.organization || {}
                    const logo = org.logo_url
                    const name = org.name || 'Organization'
                    const verified = org.is_verified || false

                    return (
                      <Card key={saved.id} hover>
                        <CardBody>
                          {/* Org logo + info */}
                          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {logo
                                ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Building2 size={20} color="var(--color-primary)" />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {name}
                                {verified && <span style={{ color: '#10B981', fontSize: 11 }}>✔</span>}
                              </div>
                            </div>
                          </div>

                          {/* Badges */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <Badge variant="blue">{p.category}</Badge>
                            <Badge variant="gray">{p.type}</Badge>
                            {p.is_paid ? <Badge variant="green">Paid</Badge> : <Badge variant="gray">Unpaid</Badge>}
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.description || 'No description provided.'}
                          </p>

                          {/* Meta row */}
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                            {[
                              { icon: MapPin, val: p.location || 'Remote' },
                              { icon: Clock, val: p.duration || '—' },
                              { icon: Calendar, val: p.deadline ? `Deadline: ${new Date(p.deadline).toLocaleDateString()}` : '' },
                            ].filter(r => r.val).map((r, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                <r.icon size={11} />
                                <span>{r.val}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA */}
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <Link
                              to={`/program/${p.id}`}
                              className="nx-btn nx-btn-primary"
                              style={{ flex: 1, textDecoration: 'none', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                            >
                              View Details
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleBookmark(p.id)}
                              className="nx-btn nx-btn-secondary"
                              style={{ width: 38, height: 38, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444' }}
                              title="Remove bookmark"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </CardBody>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MY APPLICATIONS ──────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="nx-stack-md">
              {applications.length === 0 ? (
                <Card><CardBody>
                  <EmptyState icon={ClipboardList} title="No applications yet" description="Browse internships and apply to get started."
                    action={<Button variant="primary" onClick={() => setActiveTab('browse')} icon={Search}>Browse Internships</Button>} />
                </CardBody></Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {applications.map(app => (
                    <Card key={app.id}>
                      <CardBody>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{app.program?.title || 'Internship'}</div>
                          <StatusBadge status={app.status} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {app.program?.organization?.name || app.organization?.name || '—'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {app.program?.category && <Badge variant="blue">{app.program.category}</Badge>}
                          {app.program?.type && <Badge variant="gray">{app.program.type}</Badge>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE ───────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: 600 }}>
              <Card>
                <CardHeader>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>My Profile</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Organizations can see this when reviewing your application</p>
                  </div>
                </CardHeader>
                <form onSubmit={saveProfile}>
                  <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <Avatar name={user?.name} src={profile.avatar_url || user?.avatar_url} size="2xl" />
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                        <Badge variant="sky" style={{ marginTop: 6 }}>Student</Badge>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div className="nx-form-group">
                        <label className="nx-label">Profile Photo (Avatar)</label>
                        <input type="file" accept="image/*" onChange={e => handleProfileFileChange(e, 'avatar_url')} className="nx-input" />
                        {profile.avatar_url && (
                          <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 4 }}>
                            ✅ Photo uploaded: <a href={profile.avatar_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>View Image</a>
                          </div>
                        )}
                      </div>
                      <div className="nx-form-group">
                        <label className="nx-label">Resume / CV (PDF)</label>
                        <input type="file" accept=".pdf" onChange={e => handleProfileFileChange(e, 'resume_url')} className="nx-input" />
                        {profile.resume_url && (
                          <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 4 }}>
                            ✅ Resume uploaded: <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>View PDF</a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { label: 'University / Institution', field: 'university', placeholder: 'Addis Ababa University' },
                        { label: 'Field of Study', field: 'field_of_study', placeholder: 'Computer Science' },
                        { label: 'GPA (optional)', field: 'gpa', placeholder: '3.8 / 4.0' },
                        { label: 'Year of Study', field: 'year_of_study', placeholder: '3rd Year' },
                        { label: 'LinkedIn', field: 'linkedin_url', placeholder: 'https://linkedin.com/in/…' },
                        { label: 'Portfolio / GitHub', field: 'portfolio_url', placeholder: 'https://github.com/…' },
                      ].map(f => (
                        <div key={f.field} className="nx-form-group">
                          <label className="nx-label">{f.label}</label>
                          <input type="text" value={profile[f.field] || ''} onChange={e => setProfile(p=>({...p,[f.field]:e.target.value}))} placeholder={f.placeholder} className="nx-input" />
                        </div>
                      ))}
                    </div>

                    <div className="nx-form-group" style={{ marginTop: 14 }}>
                      <label className="nx-label">Skills</label>
                      <input type="text" value={profile.skills || ''} onChange={e => setProfile(p=>({...p,skills:e.target.value}))} placeholder="React, Python, SQL (comma separated)" className="nx-input" />
                    </div>

                    <div className="nx-form-group" style={{ marginTop: 14 }}>
                      <label className="nx-label">About Me</label>
                      <textarea value={profile.bio || ''} onChange={e => setProfile(p=>({...p,bio:e.target.value}))} placeholder="A short bio about yourself…" className="nx-textarea" rows={3} />
                    </div>
                  </CardBody>
                  <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}>
                    <Button type="submit" variant="primary" loading={savingProfile}>Save Profile</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default StudentDashboard
