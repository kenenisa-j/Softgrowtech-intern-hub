// CompanyDashboard.jsx — Nextern Design System v2
import { useState, useEffect, useContext, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  Card, CardHeader, CardBody, CardFooter, StatCard, Badge, StatusBadge, Button, IconButton,
  Modal, EmptyState, SkeletonCard, Tabs,
  PageHeader, Alert, Avatar
} from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Building2, Users, Briefcase, ClipboardList, Plus,
  UserPlus, X,
  ChevronRight, ChevronDown,
  LayoutDashboard, BarChart2, UserCheck, Layers, RefreshCw,
  ExternalLink, Search as SearchIcon, Edit, Trash2,
  Check, Shield
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────
const STAGES = [
  { key: 'PENDING',     label: 'Applied',     variant: 'amber' },
  { key: 'SHORTLISTED', label: 'Shortlisted', variant: 'blue' },
  { key: 'INTERVIEW',   label: 'Interview',   variant: 'purple' },
  { key: 'ACCEPTED',    label: 'Accepted',    variant: 'green' },
  { key: 'REJECTED',    label: 'Rejected',    variant: 'red' },
]
const NEXT_STAGE = { PENDING: 'SHORTLISTED', SHORTLISTED: 'INTERVIEW', INTERVIEW: 'ACCEPTED' }

const CATEGORIES = [
  'Software Engineering','Cybersecurity','AI & Data Science','Full-Stack Development',
  'Marketing','Accounting','Finance','Human Resources','Nursing','Pharmacy',
  'Laboratory Science','Civil Engineering','Mechanical Engineering','Electrical Engineering',
  'Graphic Design','Photography','Video Editing','Law','Agriculture',
  'Education','Construction','Hospitality','Research'
]

const BLANK_PROGRAM = {
  title:'', description:'', category:'Software Engineering', skills:'',
  type:'ONSITE', is_paid:false, stipend:'', duration:'3 Months',
  start_date:'', end_date:'', positions:5, deadline:'',
  visibility:'PUBLIC', location:'', responsibilities:'', benefits:'', preferred_quals:''
}

// ── Main Component ─────────────────────────────────────────
const CompanyDashboard = () => {
  const { authAxios, user } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Data
  const [programs, setPrograms]       = useState([])
  const [applications, setApplications] = useState([])
  const [mentors, setMentors]         = useState([])
  const [interns, setInterns]         = useState([])
  const [orgProfile, setOrgProfile]   = useState(null)

  // Program modal
  const [programModal, setProgramModal] = useState(false)
  const [programForm, setProgramForm]   = useState(BLANK_PROGRAM)
  const [editingProgramId, setEditingProgramId] = useState(null)
  const [savingProgram, setSavingProgram] = useState(false)

  // Mentor expansion
  const [expandedProgram, setExpandedProgram] = useState(null)
  const [programMentors, setProgramMentors] = useState({})
  const [assigningMentorId, setAssigningMentorId] = useState('')

  // Provision intern
  const [provisionModal, setProvisionModal] = useState(false)
  const [provisionForm, setProvisionForm]   = useState({ name:'', email:'', programId:'', mentorId:'' })
  const [provisionSaving, setProvisionSaving] = useState(false)

  // Application filter
  const [appFilter, setAppFilter]   = useState('')
  const [sendingInvite, setSendingInvite] = useState(null)

  // Org profile
  const [orgForm, setOrgForm]       = useState({})
  const [savingOrg, setSavingOrg]   = useState(false)
  const [orgSaveSuccess, setOrgSaveSuccess] = useState(false)

  // Search states
  const [programSearch, setProgramSearch] = useState('')
  const [internSearch, setInternSearch]   = useState('')


  // ── Fetch all data ────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    await Promise.resolve() // yield to avoid synchronous setState inside useEffect warning
    setLoading(true)
    try {
      const [pRes, aRes, mRes, iRes] = await Promise.all([
        authAxios.get('/programs/my'),
        authAxios.get('/programs/org'),
        authAxios.get('/users/mentors'),
        authAxios.get('/users/interns'),
      ])
      setPrograms(pRes.data.programs || [])
      setApplications(aRes.data.applications || [])
      setMentors(mRes.data.mentors || [])
      setInterns(iRes.data.interns || [])

      try {
        const oRes = await authAxios.get('/organizations/my-profile')
        const org = oRes.data.organization || {}
        setOrgProfile(org)
        setOrgForm(org)
      } catch (err) {
        console.error('Failed to load org profile:', err)
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [authAxios])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Stats ─────────────────────────────────────────────────
  const stats = {
    programs:     programs.length,
    activeInterns: interns.filter(i => i.is_active || i.status === 'ACCEPTED').length,
    pendingApps:  applications.filter(a => a.status === 'PENDING').length,
    mentors:      mentors.length,
    acceptRate:   applications.length
      ? Math.round((applications.filter(a => a.status === 'ACCEPTED').length / applications.length) * 100)
      : 0,
  }

  // ── Chart data ─────────────────────────────────────────────
  const funnelData = STAGES.slice(0, 4).map(s => ({
    name: s.label,
    count: applications.filter(a => a.status === s.key).length,
  }))

  const programAppData = programs.slice(0, 6).map(p => ({
    name: p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title,
    apps: applications.filter(a => a.programId === p.id).length,
  }))

  // ── Handlers ──────────────────────────────────────────────
  const openCreateProgram = () => {
    setProgramForm(BLANK_PROGRAM)
    setEditingProgramId(null)
    setProgramModal(true)
  }

  const openEditProgram = (p) => {
    setProgramForm({
      title: p.title || '', description: p.description || '',
      category: p.category || 'Software Engineering', skills: (p.skills || []).join(', '),
      type: p.type || 'ONSITE', is_paid: p.is_paid || false, stipend: p.stipend || '',
      duration: p.duration || '3 Months', start_date: p.start_date?.slice(0,10) || '',
      end_date: p.end_date?.slice(0,10) || '', positions: p.positions || 5,
      deadline: p.deadline?.slice(0,10) || '', visibility: p.visibility || 'PUBLIC',
      location: p.location || '', responsibilities: p.responsibilities || '',
      benefits: p.benefits || '', preferred_quals: p.preferred_quals || ''
    })
    setEditingProgramId(p.id)
    setProgramModal(true)
  }

  const saveProgram = async () => {
    setSavingProgram(true)
    try {
      let cleanedStipend = programForm.stipend;
      if (cleanedStipend) {
        cleanedStipend = cleanedStipend.toString().replace(/[^0-9.]/g, '');
      }
      const payload = { 
        ...programForm, 
        stipend: cleanedStipend || null,
        skills: programForm.skills.split(',').map(s=>s.trim()).filter(Boolean) 
      }
      if (editingProgramId) {
        await authAxios.put(`/programs/${editingProgramId}`, payload)
      } else {
        await authAxios.post('/programs', payload)
      }
      setProgramModal(false)
      setActiveTab('programs')   // ← always jump to the Programs list so it's visible
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save program.')
    } finally {
      setSavingProgram(false)
    }
  }

  const deleteProgram = async (id) => {
    if (!confirm('Delete this program? This cannot be undone.')) return
    try { await authAxios.delete(`/programs/${id}`); fetchAll() }
    catch { alert('Could not delete program.') }
  }

  const moveApplication = async (appId, status) => {
    try {
      await authAxios.put(`/programs/applications/${appId}/status`, { status })
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    } catch { alert('Failed to update application status.') }
  }

  const rejectApplication = (id) => moveApplication(id, 'REJECTED')

  const sendInvite = async (app) => {
    setSendingInvite(app.id)
    try {
      const { data } = await authAxios.post('/invites/generate', {
        email: app.email, name: app.name, applicationId: app.id, programId: app.programId
      })
      alert(`Invite sent!\n\nDev link: ${data.inviteUrl || '(check server console)'}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invite.')
    } finally {
      setSendingInvite(null)
    }
  }

  const loadProgramMentors = async (programId) => {
    try {
      const r = await authAxios.get(`/programs/${programId}/mentors`)
      setProgramMentors(prev => ({ ...prev, [programId]: r.data.mentors || [] }))
    } catch (err) {
      console.error('Failed to load program mentors:', err)
    }
  }

  const assignMentor = async (programId) => {
    if (!assigningMentorId) return
    try {
      await authAxios.post(`/programs/${programId}/mentors`, { mentorId: assigningMentorId })
      setAssigningMentorId('')
      loadProgramMentors(programId)
    } catch (err) {
      console.error('Failed to assign mentor:', err)
    }
  }

  const removeMentor = async (programId, mentorId) => {
    try {
      await authAxios.delete(`/programs/${programId}/mentors/${mentorId}`)
      loadProgramMentors(programId)
    } catch (err) {
      console.error('Failed to remove mentor:', err)
    }
  }

  const provisionIntern = async () => {
    setProvisionSaving(true)
    try {
      await authAxios.post('/users/provision-intern', provisionForm)
      setProvisionModal(false)
      setProvisionForm({ name:'', email:'', programId:'', mentorId:'' })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to provision intern.')
    } finally {
      setProvisionSaving(false)
    }
  }

  const saveOrgProfile = async (e) => {
    e.preventDefault()
    setSavingOrg(true)
    try {
      await authAxios.put('/organizations/profile', orgForm)
      setOrgSaveSuccess(true)
      setTimeout(() => setOrgSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save org profile:', err)
    } finally {
      setSavingOrg(false)
    }
  }

  const TABS = [
    { key: 'overview',      label: 'Overview',      icon: LayoutDashboard },
    { key: 'programs',      label: 'Programs',      icon: Layers, count: programs.length },
    { key: 'applications',  label: 'Applications',  icon: ClipboardList, count: applications.length },
    { key: 'interns',       label: 'Interns',       icon: Users, count: interns.length },
    { key: 'mentors',       label: 'Mentors',       icon: UserCheck, count: mentors.length },
    { key: 'invite',        label: 'Invite',        icon: UserPlus },
    { key: 'insights',      label: 'Analytics',     icon: BarChart2 },
    { key: 'org_profile',   label: 'Org Profile',   icon: Building2 },
  ]

  // ── Filtered lists ─────────────────────────────────────────
  const filteredPrograms = programs.filter(p =>
    p.title?.toLowerCase().includes(programSearch.toLowerCase())
  )
  const filteredInterns = interns.filter(i =>
    i.name?.toLowerCase().includes(internSearch.toLowerCase()) ||
    i.email?.toLowerCase().includes(internSearch.toLowerCase())
  )
  const filteredApps = applications.filter(a =>
    !appFilter || a.programId === appFilter
  )

  // ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>

      {/* Page Header */}
      <PageHeader
        title={orgProfile?.name || 'Dashboard'}
        subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`}
        actions={
          <>
            <Button variant="ghost" icon={RefreshCw} onClick={fetchAll} size="sm">Refresh</Button>
            <Button variant="primary" icon={Plus} onClick={openCreateProgram}>New Program</Button>
          </>
        }
      />

      {/* Tabs */}
      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="nx-grid-stats" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="nx-stack-lg">
              {/* Stat cards */}
              <div className="nx-grid-stats">
                <StatCard label="Active Programs" value={stats.programs} icon={Briefcase}
                  iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" change={12} changeLabel="vs last month" />
                <StatCard label="Active Interns" value={stats.activeInterns} icon={Users}
                  iconBg="var(--color-success-light)" iconColor="var(--color-success)" change={8} changeLabel="vs last month" />
                <StatCard label="Pending Applications" value={stats.pendingApps} icon={ClipboardList}
                  iconBg="var(--color-warning-light)" iconColor="var(--color-warning)" />
                <StatCard label="Mentors" value={stats.mentors} icon={UserCheck}
                  iconBg="#f3f0ff" iconColor="#7c3aed" />
              </div>

              {/* Recent activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Recent Applications */}
                <Card>
                  <CardHeader>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Applications</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Latest candidate submissions</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('applications')}>View all</Button>
                  </CardHeader>
                  <div>
                    {applications.slice(0, 5).map((a, i) => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                        borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none'
                      }}>
                        <Avatar name={a.name} size="sm" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.program?.title || '—'}</div>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <EmptyState icon={ClipboardList} title="No applications yet" description="Applications will appear here once candidates apply." />
                    )}
                  </div>
                </Card>

                {/* Programs overview */}
                <Card>
                  <CardHeader>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Programs</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Active internship programs</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('programs')}>View all</Button>
                  </CardHeader>
                  <div>
                    {programs.slice(0, 5).map((p, i) => {
                      const appCount = applications.filter(a => a.programId === p.id).length
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                          borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none'
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={16} color="var(--color-primary)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.type} · {p.category}</div>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{appCount} apps</span>
                        </div>
                      )
                    })}
                    {programs.length === 0 && (
                      <EmptyState icon={Briefcase} title="No programs yet"
                        action={<Button variant="primary" icon={Plus} size="sm" onClick={openCreateProgram}>Create program</Button>} />
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── PROGRAMS ─────────────────────────────────── */}
          {activeTab === 'programs' && (
            <div className="nx-stack-md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div className="nx-search" style={{ maxWidth: 320 }}>
                  <SearchIcon size={13} style={{ color: 'var(--text-muted)' }} />
                  <input value={programSearch} onChange={e => setProgramSearch(e.target.value)} placeholder="Search programs…" />
                </div>
                <Button variant="primary" icon={Plus} onClick={openCreateProgram}>New Program</Button>
              </div>

              {filteredPrograms.length === 0 ? (
                <Card><CardBody><EmptyState icon={Briefcase} title="No programs found"
                  description="Create your first internship program to get started."
                  action={<Button variant="primary" icon={Plus} onClick={openCreateProgram}>Create Program</Button>}
                /></CardBody></Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                  {filteredPrograms.map(p => {
                    const appCount = applications.filter(a => a.programId === p.id).length
                    const assignedMentors = programMentors[p.id] || []
                    const isExpanded = expandedProgram === p.id
                    return (
                      <Card key={p.id}>
                        <CardBody>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.title}</div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <Badge variant="blue">{p.category}</Badge>
                                <Badge variant="gray">{p.type}</Badge>
                                {p.visibility === 'PUBLIC' && <Badge variant="green">Public</Badge>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <IconButton icon={Edit} size="sm" onClick={() => openEditProgram(p)} title="Edit" />
                              <IconButton icon={Trash2} variant="danger" size="sm" onClick={() => deleteProgram(p.id)} title="Delete" />
                            </div>
                          </div>

                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {p.description || 'No description provided.'}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {[
                              { label: 'Duration', val: p.duration || '—' },
                              { label: 'Positions', val: p.positions || '—' },
                              { label: 'Applications', val: appCount },
                              { label: 'Stipend', val: p.is_paid ? `${p.stipend || ''}` : 'Unpaid' },
                            ].map(r => (
                              <div key={r.label} style={{ background: 'var(--bg-subtle)', borderRadius: 6, padding: '6px 10px' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{r.val}</div>
                              </div>
                            ))}
                          </div>

                          {/* Mentors section */}
                          <button
                            onClick={() => {
                              const next = isExpanded ? null : p.id
                              setExpandedProgram(next)
                              if (next) loadProgramMentors(p.id)
                            }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}
                          >
                            <span>Mentors ({assignedMentors.length})</span>
                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>

                          {isExpanded && (
                            <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                {assignedMentors.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No mentors assigned</span>}
                                {assignedMentors.map(m => (
                                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 999, padding: '3px 8px 3px 4px' }}>
                                    <Avatar name={m.name} size="sm" />
                                    <span style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</span>
                                    <button onClick={() => removeMentor(p.id, m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0, marginLeft: 2 }}>
                                      <X size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <select
                                  value={assigningMentorId}
                                  onChange={e => setAssigningMentorId(e.target.value)}
                                  className="nx-select"
                                  style={{ flex: 1, height: 32, fontSize: 12 }}
                                >
                                  <option value="">Select mentor…</option>
                                  {mentors.filter(m => !assignedMentors.find(am => am.id === m.id)).map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                <Button size="sm" variant="primary" onClick={() => assignMentor(p.id)} disabled={!assigningMentorId}>
                                  Assign
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── APPLICATIONS KANBAN ───────────────────────── */}
          {activeTab === 'applications' && (
            <div className="nx-stack-md">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={appFilter}
                  onChange={e => setAppFilter(e.target.value)}
                  className="nx-select"
                  style={{ width: 'auto', minWidth: 200 }}
                >
                  <option value="">All Programs</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="nx-kanban">
                {STAGES.map(stage => {
                  const stageApps = filteredApps.filter(a => a.status === stage.key)
                  return (
                    <div key={stage.key} className="nx-kanban-col">
                      <div className="nx-kanban-col-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Badge variant={stage.variant} dot>{stage.label}</Badge>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{stageApps.length}</span>
                      </div>

                      {stageApps.length === 0 ? (
                        <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', border: '1px dashed var(--border-default)', borderRadius: 8 }}>
                          No candidates
                        </div>
                      ) : (
                        stageApps.map(app => (
                          <div key={app.id} className="nx-kanban-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar name={app.name} size="sm" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.email}</div>
                              </div>
                            </div>

                            {app.program?.title && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px', background: 'var(--bg-subtle)', borderRadius: 6 }}>
                                {app.program.title}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {app.linkedinLink && (
                                <a href={app.linkedinLink} target="_blank" rel="noreferrer" className="nx-btn nx-btn-ghost nx-btn-sm nx-btn-icon" title="LinkedIn">
                                  <ExternalLink size={11} />
                                </a>
                              )}
                              {NEXT_STAGE[stage.key] && (
                                <Button size="sm" variant="primary" onClick={() => moveApplication(app.id, NEXT_STAGE[stage.key])} style={{ flex: 1, fontSize: 11 }}>
                                  Move to {STAGES.find(s => s.key === NEXT_STAGE[stage.key])?.label}
                                </Button>
                              )}
                              {stage.key === 'ACCEPTED' && (
                                <Button size="sm" variant="primary" loading={sendingInvite === app.id}
                                  onClick={() => sendInvite(app)} style={{ flex: 1, fontSize: 11 }}>
                                  Send Invite
                                </Button>
                              )}
                              {stage.key !== 'REJECTED' && stage.key !== 'ACCEPTED' && (
                                <Button size="sm" variant="outline-danger" onClick={() => rejectApplication(app.id)} style={{ fontSize: 11 }}>
                                  Reject
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── INTERNS ───────────────────────────────────── */}
          {activeTab === 'interns' && (
            <div className="nx-stack-md">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div className="nx-search" style={{ maxWidth: 300 }}>
                  <SearchIcon size={13} style={{ color: 'var(--text-muted)' }} />
                  <input value={internSearch} onChange={e => setInternSearch(e.target.value)} placeholder="Search interns…" />
                </div>
                <Button variant="primary" icon={UserPlus} onClick={() => setProvisionModal(true)}>Add Intern</Button>
              </div>

              {filteredInterns.length === 0 ? (
                <Card><CardBody><EmptyState icon={Users} title="No interns yet"
                  description="Provision interns directly or they can onboard via invite link."
                  action={<Button variant="primary" icon={UserPlus} onClick={() => setProvisionModal(true)}>Add Intern</Button>}
                /></CardBody></Card>
              ) : (
                <Card>
                  <div className="nx-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <table className="nx-table">
                      <thead>
                        <tr>
                          <th>Intern</th>
                          <th>Program</th>
                          <th>Mentor</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInterns.map(i => (
                          <tr key={i.id}>
                            <td className="nx-td-primary">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Avatar name={i.name} size="sm" />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{i.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>{i.program?.title || '—'}</td>
                            <td>{i.mentor?.name || '—'}</td>
                            <td><StatusBadge status={i.status || 'ACTIVE'} /></td>
                            <td>{i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── MENTORS ───────────────────────────────────── */}
          {activeTab === 'mentors' && (
            <div className="nx-stack-md">
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <Button variant="primary" icon={UserPlus} onClick={() => setActiveTab('invite')}>Add Mentor</Button>
              </div>

              {mentors.length === 0 ? (
                <Card><CardBody><EmptyState icon={UserCheck} title="No mentors yet" description="Mentors will appear here once provisioned." action={<Button variant="primary" icon={UserPlus} onClick={() => setActiveTab('invite')}>Add Mentor</Button>} /></CardBody></Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {mentors.map(m => {
                    return (
                      <Card key={m.id}>
                        <CardBody>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Avatar name={m.name} size="lg" />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                              <Badge variant="purple" style={{ marginTop: 4 }}>Mentor</Badge>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Domain: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{m.domain || '—'}</span>
                          </div>
                        </CardBody>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS ─────────────────────────────────── */}
          {activeTab === 'insights' && (
            <div className="nx-stack-md">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card>
                  <CardHeader>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>Application Funnel</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Candidates per stage</p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={funnelData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="count" name="Candidates" radius={[4,4,0,0]} fill="var(--color-primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>Applications by Program</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Top 6 programs</p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={programAppData} layout="vertical" barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="apps" name="Applications" radius={[0,4,4,0]} fill="var(--color-accent)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </div>

              {/* Summary metrics */}
              <div className="nx-grid-4">
                {[
                  { label: 'Total Applications', val: applications.length },
                  { label: 'Acceptance Rate', val: `${stats.acceptRate}%` },
                  { label: 'Active Programs', val: programs.length },
                  { label: 'Active Interns', val: stats.activeInterns },
                ].map(s => (
                  <Card key={s.label}>
                    <CardBody compact>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.val}</div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── ORG PROFILE ───────────────────────────────── */}
          {activeTab === 'org_profile' && (
            <div style={{ maxWidth: 720 }}>
              {orgSaveSuccess && (
                <div style={{ marginBottom: 16 }}>
                  <Alert variant="success" title="Profile saved" onClose={() => setOrgSaveSuccess(false)}>
                    Your organization profile has been updated successfully.
                  </Alert>
                </div>
              )}
              <Card>
                <CardHeader>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Organization Profile</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Visible to applicants on the public listing</p>
                  </div>
                </CardHeader>
                <form onSubmit={saveOrgProfile}>
                  <CardBody>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: 'Organization Name', field: 'name', placeholder: 'Acme Corp' },
                        { label: 'Industry', field: 'industry', placeholder: 'Software Engineering' },
                        { label: 'Location', field: 'location', placeholder: 'Addis Ababa, Ethiopia' },
                        { label: 'Company Size', field: 'company_size', placeholder: '50–200' },
                        { label: 'Phone', field: 'phone', placeholder: '+251 911 000 000' },
                        { label: 'Website', field: 'website', placeholder: 'https://acme.com' },
                        { label: 'LinkedIn', field: 'linkedin_url', placeholder: 'https://linkedin.com/company/acme' },
                        { label: 'Logo URL', field: 'logo_url', placeholder: 'https://...' },
                      ].map(f => (
                        <div key={f.field} className="nx-form-group">
                          <label className="nx-label">{f.label}</label>
                          <input
                            type="text" value={orgForm[f.field] || ''}
                            onChange={e => setOrgForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="nx-input"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="nx-form-group" style={{ marginTop: 16 }}>
                      <label className="nx-label">About / Description</label>
                      <textarea
                        value={orgForm.description || ''}
                        onChange={e => setOrgForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your organization, culture, and mission…"
                        className="nx-textarea"
                        rows={4}
                      />
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button type="submit" variant="primary" loading={savingOrg}>
                      Save Profile
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
          {/* ── INVITE USERS ───────────────────────────────── */}
          {activeTab === 'invite' && (
            <div style={{ maxWidth: 500 }}>
              <Card>
                <CardHeader>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Invite / Add Team Member</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Provision a new Mentor or Administrator account</p>
                  </div>
                </CardHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target;
                  const name = target.elements.inviteName.value;
                  const email = target.elements.inviteEmail.value;
                  const role = target.elements.inviteRole.value;
                  const domain = target.elements.inviteDomain.value;
                  if (!name || !email) return alert('Name and Email are required.');
                  try {
                    await authAxios.post('/admin/users/provision', { name, email, role, domain });
                    alert('Invitation sent successfully! A welcome credentials email has been dispatched.');
                    target.reset();
                    fetchAll();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to send invitation.');
                  }
                }}>
                  <CardBody>
                    <div className="nx-stack-md">
                      <div className="nx-form-group">
                        <label className="nx-label nx-label-required">Full Name</label>
                        <input name="inviteName" type="text" placeholder="e.g. Jane Doe" className="nx-input" required />
                      </div>
                      <div className="nx-form-group">
                        <label className="nx-label nx-label-required">Email Address</label>
                        <input name="inviteEmail" type="email" placeholder="e.g. jane@company.com" className="nx-input" required />
                      </div>
                      <div className="nx-form-group">
                        <label className="nx-label">Role</label>
                        <select name="inviteRole" className="nx-select">
                          <option value="MENTOR">Mentor</option>
                          <option value="ORG_ADMIN">Administrator</option>
                        </select>
                      </div>
                      <div className="nx-form-group">
                        <label className="nx-label">Domain / Department</label>
                        <input name="inviteDomain" type="text" placeholder="e.g. Software Engineering" className="nx-input" />
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button type="submit" variant="primary">Send Invitation Link</Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ── PROGRAM MODAL ─────────────────────────────────── */}
      <Modal
        open={programModal}
        onClose={() => setProgramModal(false)}
        title={editingProgramId ? 'Edit Program' : 'Create New Program'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setProgramModal(false)}>Cancel</Button>
            <Button variant="primary" loading={savingProgram} onClick={saveProgram}>
              {editingProgramId ? 'Save Changes' : 'Create Program'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="nx-form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="nx-label nx-label-required">Program Title</label>
            <input type="text" value={programForm.title} onChange={e => setProgramForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Frontend Engineering Internship" className="nx-input" />
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Category</label>
            <select value={programForm.category} onChange={e => setProgramForm(p => ({ ...p, category: e.target.value }))} className="nx-select">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Type</label>
            <select value={programForm.type} onChange={e => setProgramForm(p => ({ ...p, type: e.target.value }))} className="nx-select">
              <option value="ONSITE">Onsite</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Duration</label>
            <input type="text" value={programForm.duration} onChange={e => setProgramForm(p => ({ ...p, duration: e.target.value }))} placeholder="3 Months" className="nx-input" />
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Positions</label>
            <input type="number" value={programForm.positions} onChange={e => setProgramForm(p => ({ ...p, positions: +e.target.value }))} className="nx-input" min={1} />
          </div>

          <div className="nx-form-group">
            <label className="nx-label nx-label-required">Start Date</label>
            <input type="date" value={programForm.start_date} onChange={e => setProgramForm(p => ({ ...p, start_date: e.target.value }))} className="nx-input" />
          </div>

          <div className="nx-form-group">
            <label className="nx-label nx-label-required">End Date</label>
            <input type="date" value={programForm.end_date} onChange={e => setProgramForm(p => ({ ...p, end_date: e.target.value }))} className="nx-input" />
          </div>

          <div className="nx-form-group">
            <label className="nx-label nx-label-required">Application Deadline</label>
            <input type="date" value={programForm.deadline} onChange={e => setProgramForm(p => ({ ...p, deadline: e.target.value }))} className="nx-input" />
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Visibility</label>
            <select value={programForm.visibility} onChange={e => setProgramForm(p => ({ ...p, visibility: e.target.value }))} className="nx-select">
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Location</label>
            <input type="text" value={programForm.location} onChange={e => setProgramForm(p => ({ ...p, location: e.target.value }))} placeholder="Addis Ababa, Ethiopia" className="nx-input" />
          </div>

          <div className="nx-form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="nx-label">Skills Required</label>
            <input type="text" value={programForm.skills} onChange={e => setProgramForm(p => ({ ...p, skills: e.target.value }))} placeholder="React, Node.js, SQL (comma separated)" className="nx-input" />
          </div>

          <div className="nx-form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="nx-label">Description</label>
            <textarea value={programForm.description} onChange={e => setProgramForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the role and what interns will work on…" className="nx-textarea" rows={3} />
          </div>

          <div className="nx-form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="is_paid" checked={programForm.is_paid} onChange={e => setProgramForm(p => ({ ...p, is_paid: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <label htmlFor="is_paid" className="nx-label" style={{ margin: 0, cursor: 'pointer' }}>Paid internship</label>
            {programForm.is_paid && (
              <input type="text" value={programForm.stipend} onChange={e => setProgramForm(p => ({ ...p, stipend: e.target.value }))} placeholder="e.g. $500/month" className="nx-input" style={{ maxWidth: 200, marginLeft: 8 }} />
            )}
          </div>

          <div className="nx-form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="nx-label">Responsibilities</label>
            <textarea value={programForm.responsibilities} onChange={e => setProgramForm(p => ({ ...p, responsibilities: e.target.value }))} placeholder="List the main responsibilities…" className="nx-textarea" rows={2} />
          </div>

          <div className="nx-form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="nx-label">Benefits & Perks</label>
            <textarea value={programForm.benefits} onChange={e => setProgramForm(p => ({ ...p, benefits: e.target.value }))} placeholder="Mentorship, certificate, networking events…" className="nx-textarea" rows={2} />
          </div>
        </div>
      </Modal>

      {/* ── PROVISION INTERN MODAL ────────────────────────── */}
      <Modal
        open={provisionModal}
        onClose={() => setProvisionModal(false)}
        title="Add Intern"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setProvisionModal(false)}>Cancel</Button>
            <Button variant="primary" loading={provisionSaving} onClick={provisionIntern}>Add Intern</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="nx-form-group">
            <label className="nx-label nx-label-required">Full Name</label>
            <input type="text" value={provisionForm.name} onChange={e => setProvisionForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" className="nx-input" />
          </div>
          <div className="nx-form-group">
            <label className="nx-label nx-label-required">Email</label>
            <input type="email" value={provisionForm.email} onChange={e => setProvisionForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" className="nx-input" />
          </div>
          <div className="nx-form-group">
            <label className="nx-label">Assign to Program</label>
            <select value={provisionForm.programId} onChange={e => setProvisionForm(p => ({ ...p, programId: e.target.value }))} className="nx-select">
              <option value="">Select program…</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="nx-form-group">
            <label className="nx-label">Assign Mentor</label>
            <select value={provisionForm.mentorId} onChange={e => setProvisionForm(p => ({ ...p, mentorId: e.target.value }))} className="nx-select">
              <option value="">Select mentor…</option>
              {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  )
}

export default CompanyDashboard
