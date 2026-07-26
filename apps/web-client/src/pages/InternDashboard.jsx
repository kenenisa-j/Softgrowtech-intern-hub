// InternDashboard.jsx — Nextern Design System v2
import { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  Card, CardHeader, CardBody, StatCard, Badge, StatusBadge, Button,
  EmptyState, SkeletonCard, Tabs, PageHeader, Alert, Progress, Avatar
} from '../components/ui'
import {
  LayoutDashboard, CheckSquare, ClipboardList, FileText, Award, MessageSquare,
  Star, Send, Check, RefreshCw, Layers
} from 'lucide-react'
import io from 'socket.io-client'


const InternDashboard = () => {
  const { authAxios, user, token } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const [programInfo, setProgramInfo]   = useState(null)
  const [tasks, setTasks]               = useState([])
  const [evaluations, setEvaluations]   = useState([])
  const [submissions, setSubmissions]   = useState([])
  const [certificate, setCertificate]   = useState(null)

  // Chat
  const [messages, setMessages]         = useState([])
  const [chatMsg, setChatMsg]           = useState('')
  const socketRef = useRef(null)

  // Review form
  const [reviewForm, setReviewForm]     = useState({ rating: 0, title: '', body: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const hasFinal = evaluations.some(e => e.type === 'FINAL')

  const fetchAll = useCallback(async () => {
    await Promise.resolve() // yield to avoid synchronous setState inside useEffect warning
    setLoading(true)
    try {
      const [pRes, tRes, eRes, sRes] = await Promise.all([
        authAxios.get('/programs/my-program').catch(() => ({ data: null })),
        authAxios.get('/tasks/my').catch(() => ({ data: { tasks: [] } })),
        authAxios.get('/evaluations/my').catch(() => ({ data: { evaluations: [] } })),
        authAxios.get('/submissions/my').catch(() => ({ data: { submissions: [] } })),
      ])
      setProgramInfo(pRes.data?.program || pRes.data)
      setTasks(tRes.data?.tasks || [])
      setEvaluations(eRes.data?.evaluations || [])
      setSubmissions(sRes.data?.submissions || [])

      try {
        // Correct backend route: /api/v1/reports/certificate/:internId
        const certRes = await authAxios.get(`/reports/certificate/${user?.id}`)
        setCertificate(certRes.data?.certificate)
      } catch (err) {
        console.error('Failed to load certificate:', err)
      }
    } finally { setLoading(false) }
  }, [authAxios, user?.id])

  // Initial data fetch
  useEffect(() => { fetchAll() }, [fetchAll])

  // Socket chat — re-connect whenever token or user changes so auth is never stale
  useEffect(() => {
    if (!token || !user?.tenantId) return
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', { auth: { token } })
    socketRef.current = socket
    socket.on('message', (msg) => setMessages(prev => [...prev, msg]))
    socket.on('chat_history', (hist) => setMessages(hist))
    socket.emit('join_room', { room: user.tenantId })
    return () => socket.disconnect()
  }, [token, user?.tenantId])

  const sendMessage = () => {
    if (!chatMsg.trim()) return
    socketRef.current?.emit('send_message', {
      room: user?.tenantId, message: chatMsg, sender: user?.name
    })
    setChatMsg('')
  }

  const submitReview = async () => {
    if (!reviewForm.rating || !reviewForm.title || !reviewForm.body) return
    setSubmittingReview(true)
    try {
      await authAxios.post('/reviews', {
        programId: programInfo?.id, ...reviewForm
      })
      setReviewSuccess(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.')
    } finally { setSubmittingReview(false) }
  }

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const taskProgress   = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

  const latestEval = evaluations.length
    ? evaluations.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null

  const TABS = [
    { key: 'overview',      label: 'Overview',      icon: LayoutDashboard },
    { key: 'program',       label: 'My Program',    icon: Layers },
    { key: 'tasks',         label: 'Tasks',         icon: CheckSquare, count: tasks.filter(t=>t.status!=='COMPLETED').length },
    { key: 'evaluations',   label: 'Evaluations',   icon: ClipboardList },
    { key: 'submissions',   label: 'Submissions',   icon: FileText },
    { key: 'certificate',   label: 'Certificate',   icon: Award },
    { key: 'reviews',       label: 'Review',        icon: Star },
    { key: 'chat',          label: 'Chat',          icon: MessageSquare },
  ]

  const evalFields = ['communication','technical','teamwork','initiative','punctuality','overall']

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <PageHeader
        title="My Dashboard"
        subtitle={`Welcome, ${user?.name?.split(' ')[0] || 'Intern'}`}
        actions={<Button variant="ghost" icon={RefreshCw} onClick={fetchAll} size="sm">Refresh</Button>}
      />

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="nx-grid-stats">{[...Array(3)].map((_,i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="nx-stack-lg">
              <div className="nx-grid-stats">
                <StatCard label="Task Progress" value={`${taskProgress}%`} icon={CheckSquare}
                  iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" />
                <StatCard label="Tasks Completed" value={completedTasks} icon={Check}
                  iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
                <StatCard label="Submissions" value={submissions.length} icon={FileText}
                  iconBg="var(--color-info-light)" iconColor="var(--color-info)" />
                <StatCard label="Evaluations" value={evaluations.length} icon={ClipboardList}
                  iconBg="#f3f0ff" iconColor="#7c3aed" />
              </div>

              {/* Task progress bar */}
              {tasks.length > 0 && (
                <Card>
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Task Completion</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{taskProgress}%</span>
                    </div>
                    <Progress value={taskProgress} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      {completedTasks} of {tasks.length} tasks completed
                    </div>
                  </CardBody>
                </Card>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Recent tasks */}
                <Card>
                  <CardHeader>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Tasks</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('tasks')}>View all</Button>
                  </CardHeader>
                  <div>
                    {tasks.slice(0, 5).map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: t.status === 'COMPLETED' ? 'var(--color-success-light)' : 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.status === 'COMPLETED' ? <Check size={13} color="var(--color-success)" /> : <CheckSquare size={13} color="var(--text-muted)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: t.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                          {t.deadline && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due {new Date(t.deadline).toLocaleDateString()}</div>}
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                    {tasks.length === 0 && <EmptyState icon={CheckSquare} title="No tasks assigned yet" />}
                  </div>
                </Card>

                {/* Latest evaluation */}
                <Card>
                  <CardHeader>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Latest Evaluation</h3>
                  </CardHeader>
                  {latestEval ? (
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Badge variant={latestEval.type === 'FINAL' ? 'blue' : 'amber'}>{latestEval.type} Evaluation</Badge>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(latestEval.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="nx-stack-sm">
                        {evalFields.map(f => (
                          latestEval[f] !== undefined && (
                            <div key={f}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{f}</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{latestEval[f]}/10</span>
                              </div>
                              <Progress value={latestEval[f]} max={10}
                                color={latestEval[f] >= 7 ? 'var(--color-success)' : latestEval[f] >= 5 ? 'var(--color-warning)' : 'var(--color-danger)'} />
                            </div>
                          )
                        ))}
                        {latestEval.feedback && (
                          <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            "{latestEval.feedback}"
                          </div>
                        )}
                      </div>
                    </CardBody>
                  ) : (
                    <CardBody><EmptyState icon={ClipboardList} title="No evaluations yet" description="Your mentor will submit evaluations throughout the program." /></CardBody>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ── PROGRAM INFO ─────────────────────────────── */}
          {activeTab === 'program' && (
            <div style={{ maxWidth: 720 }}>
              {programInfo ? (
                <Card>
                  <CardBody>
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{programInfo.title}</h2>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <Badge variant="blue">{programInfo.category}</Badge>
                        <Badge variant="gray">{programInfo.type}</Badge>
                        {programInfo.is_paid && <Badge variant="green">Paid · {programInfo.stipend}</Badge>}
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{programInfo.description}</p>
                    </div>

                    <div className="nx-grid-2" style={{ marginBottom: 20 }}>
                      {[
                        { label: 'Duration', val: programInfo.duration },
                        { label: 'Location', val: programInfo.location || 'N/A' },
                        { label: 'Start Date', val: programInfo.start_date ? new Date(programInfo.start_date).toLocaleDateString() : 'N/A' },
                        { label: 'End Date', val: programInfo.end_date ? new Date(programInfo.end_date).toLocaleDateString() : 'N/A' },
                      ].map(r => (
                        <div key={r.label} style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{r.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{r.val}</div>
                        </div>
                      ))}
                    </div>

                    {programInfo.skills?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {programInfo.skills.map(s => <Badge key={s} variant="gray">{s}</Badge>)}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ) : (
                <Card><CardBody><EmptyState icon={Layers} title="No program assigned" description="You haven't been assigned to an internship program yet." /></CardBody></Card>
              )}
            </div>
          )}

          {/* ── TASKS ────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="nx-stack-md">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {tasks.map(t => (
                  <Card key={t.id}>
                    <CardBody compact>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                        <StatusBadge status={t.status} />
                      </div>
                      {t.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>{t.description}</p>}
                      {t.deadline && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Due: <strong>{new Date(t.deadline).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
                {tasks.length === 0 && <Card><CardBody><EmptyState icon={CheckSquare} title="No tasks yet" description="Your mentor will assign tasks as the program progresses." /></CardBody></Card>}
              </div>
            </div>
          )}

          {/* ── EVALUATIONS ──────────────────────────────── */}
          {activeTab === 'evaluations' && (
            <div className="nx-stack-md">
              {evaluations.length === 0 ? (
                <Card><CardBody><EmptyState icon={ClipboardList} title="No evaluations yet" /></CardBody></Card>
              ) : (
                evaluations.map(ev => (
                  <Card key={ev.id}>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Badge variant={ev.type === 'FINAL' ? 'blue' : 'amber'}>{ev.type}</Badge>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(ev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="nx-stack-sm">
                        {evalFields.map(f => ev[f] !== undefined && (
                          <div key={f}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{f}</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev[f]}/10</span>
                            </div>
                            <Progress value={ev[f]} max={10} color={ev[f]>=7?'var(--color-success)':ev[f]>=5?'var(--color-warning)':'var(--color-danger)'} />
                          </div>
                        ))}
                        {ev.feedback && (
                          <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--color-primary)' }}>
                            "{ev.feedback}"
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── CERTIFICATE ──────────────────────────────── */}
          {activeTab === 'certificate' && (
            <div style={{ maxWidth: 600 }}>
              {certificate ? (
                <Card>
                  <CardBody>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid var(--color-success-border)' }}>
                        <Award size={36} color="var(--color-success)" />
                      </div>
                      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Certificate of Completion</h2>
                      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                        Issued by <strong style={{ color: 'var(--text-primary)' }}>{certificate.organizationName}</strong> on {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button variant="primary" icon={Award} onClick={() => window.open(`/verify/${certificate.id}`, '_blank')}>
                          View Certificate
                        </Button>
                        <Button variant="secondary">Download PDF</Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <Card><CardBody><EmptyState icon={Award} title="No certificate yet" description="You'll receive a certificate after completing the program and final evaluation." /></CardBody></Card>
              )}
            </div>
          )}

          {/* ── PROGRAM REVIEW ───────────────────────────── */}
          {activeTab === 'reviews' && (
            <div style={{ maxWidth: 560 }}>
              {!hasFinal && (
                <div style={{ marginBottom: 16 }}>
                  <Alert variant="warning" title="Review locked">
                    You can submit a program review after your final evaluation has been completed by your mentor.
                  </Alert>
                </div>
              )}
              {reviewSuccess ? (
                <Card><CardBody>
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Check size={24} color="var(--color-success)" />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Review submitted!</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Thank you for your feedback.</p>
                  </div>
                </CardBody></Card>
              ) : (
                <Card>
                  <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>Rate Your Program</h3></CardHeader>
                  <CardBody>
                    <div className="nx-stack-md">
                      {/* Star rating */}
                      <div className="nx-form-group">
                        <label className="nx-label">Overall Rating</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} type="button"
                              onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                              <Star size={28} color={n <= reviewForm.rating ? '#F59E0B' : 'var(--border-strong)'} fill={n <= reviewForm.rating ? '#F59E0B' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="nx-form-group">
                        <label className="nx-label nx-label-required">Review Title</label>
                        <input type="text" value={reviewForm.title} onChange={e => setReviewForm(f=>({...f,title:e.target.value}))} placeholder="Summary of your experience" className="nx-input" disabled={!hasFinal} />
                      </div>
                      <div className="nx-form-group">
                        <label className="nx-label nx-label-required">Your Review</label>
                        <textarea value={reviewForm.body} onChange={e => setReviewForm(f=>({...f,body:e.target.value}))} placeholder="Describe your internship experience…" className="nx-textarea" rows={4} disabled={!hasFinal} />
                      </div>
                      <Button variant="primary" loading={submittingReview} onClick={submitReview}
                        disabled={!hasFinal || !reviewForm.rating || !reviewForm.title || !reviewForm.body}>
                        Submit Review
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* ── CHAT ─────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <Card style={{ maxWidth: 640, height: '65vh', display: 'flex', flexDirection: 'column' }}>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>Team Chat</h3></CardHeader>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 && <EmptyState icon={MessageSquare} title="No messages yet" description="Start a conversation with your team." />}
                {messages.map((m, i) => {
                  const isMine = m.sender === user?.name
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                      {!isMine && <Avatar name={m.sender} size="sm" />}
                      <div style={{ maxWidth: '70%' }}>
                        {!isMine && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>{m.sender}</div>}
                        <div style={{
                          padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                          background: isMine ? 'var(--color-primary)' : 'var(--bg-subtle)',
                          color: isMine ? 'white' : 'var(--text-primary)',
                          borderBottomRightRadius: isMine ? 4 : 12,
                          borderBottomLeftRadius: isMine ? 12 : 4,
                        }}>
                          {m.message}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <CardBody compact style={{ borderTop: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message…" className="nx-input" style={{ flex: 1 }} />
                  <Button variant="primary" icon={Send} onClick={sendMessage} />
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default InternDashboard
