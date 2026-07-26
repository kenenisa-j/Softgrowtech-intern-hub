// MentorDashboard.jsx — Nextern Design System v2
import { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  Card, CardHeader, CardBody, StatCard, Badge, StatusBadge, Button,
  Modal, EmptyState, SkeletonCard, Tabs, PageHeader, Progress, Avatar
} from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { io } from 'socket.io-client'
import {
  LayoutDashboard, Users, CheckSquare, ClipboardList, BarChart2, MessageSquare,
  Plus, Send, Check, RefreshCw, FileText
} from 'lucide-react'

const EVAL_FIELDS = [
  { key: 'communication',   label: 'Communication' },
  { key: 'technical',       label: 'Technical Skills' },
  { key: 'teamwork',        label: 'Teamwork' },
  { key: 'initiative',      label: 'Initiative' },
  { key: 'punctuality',     label: 'Punctuality' },
  { key: 'overall',         label: 'Overall' },
]

const MentorDashboard = () => {
  const { authAxios, user, token } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading]     = useState(true)

  const [interns, setInterns]         = useState([])
  const [tasks, setTasks]             = useState([])
  const [submissions, setSubmissions] = useState([])
  const [evaluations, setEvaluations] = useState([])

  // Task modal
  const [taskModal, setTaskModal] = useState(false)
  const [taskForm, setTaskForm]   = useState({ title: '', description: '', deadline: '', priority: 'MEDIUM', points: 100 })
  const [savingTask, setSavingTask] = useState(false)

  // Eval modal
  const [evalModal, setEvalModal] = useState(false)
  const [evalTarget, setEvalTarget] = useState(null)
  const [evalForm, setEvalForm]   = useState({ type: 'WEEKLY', communication: 8, technical: 8, teamwork: 8, initiative: 8, punctuality: 8, overall: 8, feedback: '' })
  const [savingEval, setSavingEval] = useState(false)

  // Grade modal
  const [gradeModal, setGradeModal]   = useState(false)
  const [gradeSub, setGradeSub]       = useState(null)
  const [gradeForm, setGradeForm]     = useState({ status: 'approved', grade: 'A', score: 100, feedback: '' })
  const [savingGrade, setSavingGrade] = useState(false)

  // Chat
  const [messages, setMessages]       = useState([])
  const [chatMsg, setChatMsg]         = useState('')
  const socketRef = useRef(null)

  const fetchAll = useCallback(async () => {
    await Promise.resolve() // yield to avoid synchronous setState inside useEffect warning
    setLoading(true)
    try {
      const [iRes, tRes, sRes, eRes] = await Promise.all([
        authAxios.get('/users/interns').catch(() => ({ data: { interns: [] } })),
        authAxios.get('/tasks').catch(() => ({ data: { tasks: [] } })),
        authAxios.get('/submissions').catch(() => ({ data: { submissions: [] } })),
        authAxios.get('/evaluations').catch(() => ({ data: { evaluations: [] } })),
      ])
      setInterns(iRes.data?.interns || [])
      setTasks(tRes.data?.tasks || [])
      setSubmissions(sRes.data?.submissions || [])
      setEvaluations(eRes.data?.evaluations || [])
    } finally { setLoading(false) }
  }, [authAxios])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!token || !user?.tenantId) return
    const socket = io('http://localhost:5001', { auth: { token } })
    socketRef.current = socket
    socket.on('message', msg => setMessages(prev => [...prev, msg]))
    socket.on('chat_history', hist => setMessages(hist))
    socket.emit('join_room', { room: user.tenantId })
    return () => socket.disconnect()
  }, [token, user?.tenantId])

  const createTask = async () => {
    setSavingTask(true)
    try {
      await authAxios.post('/tasks', taskForm)
      setTaskModal(false)
      setTaskForm({ title: '', description: '', deadline: '', priority: 'MEDIUM', points: 100 })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to create task') }
    finally { setSavingTask(false) }
  }

  const submitEval = async () => {
    setSavingEval(true)
    try {
      await authAxios.post('/evaluations', { ...evalForm, internId: evalTarget?.id })
      setEvalModal(false)
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit evaluation') }
    finally { setSavingEval(false) }
  }

  const gradeSubmission = async () => {
    setSavingGrade(true)
    try {
      await authAxios.put(`/submissions/${gradeSub.id}/grade`, gradeForm)
      setGradeModal(false)
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to grade submission') }
    finally { setSavingGrade(false) }
  }

  const sendMessage = () => {
    if (!chatMsg.trim()) return
    socketRef.current?.emit('send_message', { room: user?.tenantId, message: chatMsg, sender: user?.name })
    setChatMsg('')
  }

  const pendingSubs = submissions.filter(s => s.status === 'pending' || s.status === 'PENDING')
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length

  // Chart data: evaluation averages per intern
  const evalChartData = interns.slice(0, 6).map(intern => {
    const evalItems = evaluations.filter(e => e.internId === intern.id)
    const avg = EVAL_FIELDS.reduce((acc, f) => {
      const vals = evalItems.map(e => e[f.key]).filter(v => v !== undefined)
      return acc + (vals.length ? vals.reduce((s,v)=>s+v,0)/vals.length : 0)
    }, 0) / EVAL_FIELDS.length
    return { name: intern.name?.split(' ')[0] || 'Intern', avg: +avg.toFixed(1) }
  })

  const TABS = [
    { key: 'overview',    label: 'Overview',     icon: LayoutDashboard },
    { key: 'interns',     label: 'My Interns',   icon: Users, count: interns.length },
    { key: 'tasks',       label: 'Tasks',         icon: CheckSquare, count: tasks.length },
    { key: 'submissions', label: 'Submissions',   icon: FileText, count: pendingSubs.length },
    { key: 'evaluations', label: 'Evaluations',   icon: ClipboardList },
    { key: 'analytics',   label: 'Analytics',     icon: BarChart2 },
    { key: 'chat',        label: 'Chat',           icon: MessageSquare },
  ]

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <PageHeader
        title="Mentor Dashboard"
        subtitle={`Welcome, ${user?.name?.split(' ')[0] || 'Mentor'}`}
        actions={
          <>
            <Button variant="ghost" icon={RefreshCw} onClick={fetchAll} size="sm">Refresh</Button>
            <Button variant="primary" icon={Plus} onClick={() => setTaskModal(true)}>New Task</Button>
          </>
        }
      />

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="nx-grid-stats">{[...Array(4)].map((_,i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="nx-stack-lg">
              <div className="nx-grid-stats">
                <StatCard label="My Interns" value={interns.length} icon={Users} iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" />
                <StatCard label="Active Tasks" value={tasks.length} icon={CheckSquare} iconBg="var(--color-warning-light)" iconColor="var(--color-warning)" />
                <StatCard label="Pending Reviews" value={pendingSubs.length} icon={FileText} iconBg="var(--color-danger-light)" iconColor="var(--color-danger)" />
                <StatCard label="Evaluations Done" value={evaluations.length} icon={ClipboardList} iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Interns quick view */}
                <Card>
                  <CardHeader>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>My Interns</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('interns')}>View all</Button>
                  </CardHeader>
                  <div>
                    {interns.slice(0, 5).map((intern, i) => (
                      <div key={intern.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <Avatar name={intern.name} size="sm" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{intern.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{intern.program?.title || '—'}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setEvalTarget(intern); setEvalModal(true) }}>Evaluate</Button>
                      </div>
                    ))}
                    {interns.length === 0 && <EmptyState icon={Users} title="No interns assigned" />}
                  </div>
                </Card>

                {/* Pending submissions */}
                <Card>
                  <CardHeader>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Pending Reviews</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('submissions')}>View all</Button>
                  </CardHeader>
                  <div>
                    {pendingSubs.slice(0, 5).map((sub, i) => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={14} color="var(--color-warning)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.task?.title || 'Submission'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>By {sub.intern?.name || '—'}</div>
                        </div>
                        <Button size="sm" variant="primary" onClick={() => { setGradeSub(sub); setGradeModal(true) }}>Grade</Button>
                      </div>
                    ))}
                    {pendingSubs.length === 0 && <EmptyState icon={FileText} title="No pending reviews" description="All submissions have been graded." />}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── INTERNS ───────────────────────────────────── */}
          {activeTab === 'interns' && (
            <div>
              {interns.length === 0 ? (
                <Card><CardBody><EmptyState icon={Users} title="No interns assigned" description="Interns will appear here once assigned to your programs." /></CardBody></Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {interns.map(intern => {
                    const internEvals = evaluations.filter(e => e.internId === intern.id)
                    const internTasks = tasks.filter(t => t.assignedToId === intern.id)
                    const completed = internTasks.filter(t => t.status === 'COMPLETED').length
                    return (
                      <Card key={intern.id}>
                        <CardBody>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <Avatar name={intern.name} size="lg" />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{intern.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{intern.email}</div>
                              <StatusBadge status={intern.status || 'ACTIVE'} />
                            </div>
                          </div>

                          {internTasks.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Task progress</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{completed}/{internTasks.length}</span>
                              </div>
                              <Progress value={completed} max={internTasks.length} />
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="sm" variant="primary" style={{ flex: 1 }} onClick={() => { setEvalTarget(intern); setEvalModal(true) }}>
                              Evaluate
                            </Button>
                          </div>

                          {internEvals.length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                              {internEvals.length} evaluation{internEvals.length > 1 ? 's' : ''} submitted
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

          {/* ── TASKS ────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="nx-stack-md">
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" icon={Plus} onClick={() => setTaskModal(true)}>Create Task</Button>
              </div>
              {tasks.length === 0 ? (
                <Card><CardBody><EmptyState icon={CheckSquare} title="No tasks created" description="Create tasks to assign to your interns."
                  action={<Button variant="primary" icon={Plus} onClick={() => setTaskModal(true)}>Create Task</Button>} /></CardBody></Card>
              ) : (
                <Card>
                  <div className="nx-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <table className="nx-table">
                      <thead>
                        <tr><th>Task</th><th>Priority</th><th>Points</th><th>Status</th><th>Deadline</th></tr>
                      </thead>
                      <tbody>
                        {tasks.map(t => (
                          <tr key={t.id}>
                            <td className="nx-td-primary">
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                              {t.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                            </td>
                            <td><Badge variant={t.priority === 'HIGH' ? 'red' : t.priority === 'MEDIUM' ? 'amber' : 'gray'}>{t.priority}</Badge></td>
                            <td>{t.points || 100}</td>
                            <td><StatusBadge status={t.status || 'TODO'} /></td>
                            <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── SUBMISSIONS ──────────────────────────────── */}
          {activeTab === 'submissions' && (
            <div>
              {submissions.length === 0 ? (
                <Card><CardBody><EmptyState icon={FileText} title="No submissions yet" /></CardBody></Card>
              ) : (
                <Card>
                  <div className="nx-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                    <table className="nx-table">
                      <thead>
                        <tr><th>Intern</th><th>Task</th><th>Status</th><th>Grade</th><th>Submitted</th><th></th></tr>
                      </thead>
                      <tbody>
                        {submissions.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar name={s.intern?.name} size="sm" />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.intern?.name || '—'}</span>
                              </div>
                            </td>
                            <td>{s.task?.title || '—'}</td>
                            <td><StatusBadge status={s.status || 'PENDING'} /></td>
                            <td>{s.grade || '—'}</td>
                            <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                            <td>
                              {(s.status === 'pending' || s.status === 'PENDING') && (
                                <Button size="sm" variant="primary" onClick={() => { setGradeSub(s); setGradeModal(true) }}>Grade</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── EVALUATIONS ──────────────────────────────── */}
          {activeTab === 'evaluations' && (
            <div className="nx-stack-md">
              {evaluations.length === 0 ? (
                <Card><CardBody><EmptyState icon={ClipboardList} title="No evaluations submitted" description="Select an intern to submit their evaluation." /></CardBody></Card>
              ) : (
                evaluations.map(ev => {
                  const intern = interns.find(i => i.id === ev.internId)
                  return (
                    <Card key={ev.id}>
                      <CardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {intern && <Avatar name={intern.name} size="sm" />}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{intern?.name || 'Intern'}</div>
                            <Badge variant={ev.type === 'FINAL' ? 'blue' : 'amber'}>{ev.type}</Badge>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(ev.createdAt).toLocaleDateString()}</span>
                      </CardHeader>
                      <CardBody>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {EVAL_FIELDS.map(f => ev[f.key] !== undefined && (
                            <div key={f.key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev[f.key]}/10</span>
                              </div>
                              <Progress value={ev[f.key]} max={10} color={ev[f.key]>=7?'var(--color-success)':ev[f.key]>=5?'var(--color-warning)':'var(--color-danger)'} />
                            </div>
                          ))}
                        </div>
                        {ev.feedback && (
                          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--color-primary)' }}>
                            "{ev.feedback}"
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {/* ── ANALYTICS ─────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="nx-stack-md">
              <div className="nx-grid-stats">
                <StatCard label="Total Interns" value={interns.length} icon={Users} iconBg="var(--color-primary-light)" iconColor="var(--color-primary)" />
                <StatCard label="Tasks Created" value={tasks.length} icon={CheckSquare} iconBg="var(--color-warning-light)" iconColor="var(--color-warning)" />
                <StatCard label="Completed Tasks" value={completedTasks} icon={Check} iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
                <StatCard label="Evaluations" value={evaluations.length} icon={ClipboardList} iconBg="#f3f0ff" iconColor="#7c3aed" />
              </div>

              <Card>
                <CardHeader>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Intern Performance Averages</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Average evaluation score per intern (out of 10)</p>
                  </div>
                </CardHeader>
                <CardBody>
                  {evalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={evalChartData} barCategoryGap="35%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0,10]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="avg" name="Avg Score" radius={[4,4,0,0]} fill="var(--color-primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={BarChart2} title="No evaluation data" description="Submit evaluations to see analytics." />
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          {/* ── CHAT ─────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <Card style={{ maxWidth: 640, height: '65vh', display: 'flex', flexDirection: 'column' }}>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>Team Chat</h3></CardHeader>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 && <EmptyState icon={MessageSquare} title="No messages yet" />}
                {messages.map((m, i) => {
                  const isMine = m.sender === user?.name
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                      {!isMine && <Avatar name={m.sender} size="sm" />}
                      <div style={{ maxWidth: '70%' }}>
                        {!isMine && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>{m.sender}</div>}
                        <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, background: isMine ? 'var(--color-primary)' : 'var(--bg-subtle)', color: isMine ? 'white' : 'var(--text-primary)', borderBottomRightRadius: isMine ? 4 : 12, borderBottomLeftRadius: isMine ? 12 : 4 }}>
                          {m.message}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <CardBody compact style={{ borderTop: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message…" className="nx-input" style={{ flex: 1 }} />
                  <Button variant="primary" icon={Send} onClick={sendMessage} />
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* ── TASK MODAL ───────────────────────────────── */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)} title="Create Task" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTaskModal(false)}>Cancel</Button>
            <Button variant="primary" loading={savingTask} onClick={createTask}>Create Task</Button>
          </>
        }
      >
        <div className="nx-stack-md">
          <div className="nx-form-group">
            <label className="nx-label nx-label-required">Title</label>
            <input type="text" value={taskForm.title} onChange={e => setTaskForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Build login page" className="nx-input" />
          </div>
          <div className="nx-form-group">
            <label className="nx-label">Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm(f=>({...f,description:e.target.value}))} placeholder="Task details and requirements…" className="nx-textarea" rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="nx-form-group">
              <label className="nx-label">Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(f=>({...f,priority:e.target.value}))} className="nx-select">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="nx-form-group">
              <label className="nx-label">Points</label>
              <input type="number" value={taskForm.points} onChange={e => setTaskForm(f=>({...f,points:+e.target.value}))} className="nx-input" min={1} max={1000} />
            </div>
          </div>
          <div className="nx-form-group">
            <label className="nx-label">Deadline</label>
            <input type="date" value={taskForm.deadline} onChange={e => setTaskForm(f=>({...f,deadline:e.target.value}))} className="nx-input" />
          </div>
        </div>
      </Modal>

      {/* ── EVAL MODAL ───────────────────────────────── */}
      <Modal open={evalModal} onClose={() => setEvalModal(false)} title={`Evaluate: ${evalTarget?.name || ''}`} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEvalModal(false)}>Cancel</Button>
            <Button variant="primary" loading={savingEval} onClick={submitEval}>Submit Evaluation</Button>
          </>
        }
      >
        <div className="nx-stack-md">
          <div className="nx-form-group">
            <label className="nx-label">Evaluation Type</label>
            <select value={evalForm.type} onChange={e => setEvalForm(f=>({...f,type:e.target.value}))} className="nx-select">
              <option value="WEEKLY">Weekly</option>
              <option value="MID_TERM">Mid-Term</option>
              <option value="FINAL">Final</option>
            </select>
          </div>

          <div className="nx-grid-2">
            {EVAL_FIELDS.map(f => (
              <div key={f.key} className="nx-form-group">
                <label className="nx-label">{f.label} ({evalForm[f.key] || 8}/10)</label>
                <input type="range" min={1} max={10} value={evalForm[f.key] || 8}
                  onChange={e => setEvalForm(p => ({ ...p, [f.key]: +e.target.value }))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
              </div>
            ))}
          </div>

          <div className="nx-form-group">
            <label className="nx-label">Feedback</label>
            <textarea value={evalForm.feedback} onChange={e => setEvalForm(f=>({...f,feedback:e.target.value}))} placeholder="Provide constructive feedback…" className="nx-textarea" rows={3} />
          </div>
        </div>
      </Modal>

      {/* ── GRADE MODAL ──────────────────────────────── */}
      <Modal open={gradeModal} onClose={() => setGradeModal(false)} title={`Grade: ${gradeSub?.task?.title || 'Submission'}`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGradeModal(false)}>Cancel</Button>
            <Button variant="primary" loading={savingGrade} onClick={gradeSubmission}>Submit Grade</Button>
          </>
        }
      >
        <div className="nx-stack-md">
          <div className="nx-form-group">
            <label className="nx-label">Decision</label>
            <select value={gradeForm.status} onChange={e => setGradeForm(f=>({...f,status:e.target.value}))} className="nx-select">
              <option value="approved">Approve</option>
              <option value="needs_revision">Needs Revision</option>
              <option value="rejected">Reject</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="nx-form-group">
              <label className="nx-label">Letter Grade</label>
              <select value={gradeForm.grade} onChange={e => setGradeForm(f=>({...f,grade:e.target.value}))} className="nx-select">
                {['A+','A','A-','B+','B','B-','C+','C','D','F'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="nx-form-group">
              <label className="nx-label">Score (/100)</label>
              <input type="number" value={gradeForm.score} onChange={e => setGradeForm(f=>({...f,score:+e.target.value}))} className="nx-input" min={0} max={100} />
            </div>
          </div>
          <div className="nx-form-group">
            <label className="nx-label">Feedback</label>
            <textarea value={gradeForm.feedback} onChange={e => setGradeForm(f=>({...f,feedback:e.target.value}))} placeholder="Feedback for the intern…" className="nx-textarea" rows={3} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default MentorDashboard
