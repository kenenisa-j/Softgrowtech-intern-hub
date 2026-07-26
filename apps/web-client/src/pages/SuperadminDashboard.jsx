// SuperadminDashboard.jsx — Nextern Design System v2
// Uses real API routes: /api/v1/superadmin/*
import { useState, useEffect, useContext, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  Card, CardHeader, CardBody, StatCard, Badge, StatusBadge, Button,
  Modal, EmptyState, SkeletonCard, Tabs, PageHeader, Alert
} from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  LayoutDashboard, Building2, Users, ShieldCheck, BarChart2,
  Check, X, RefreshCw, Search
} from 'lucide-react'

const SuperadminDashboard = () => {
  const { authAxios, user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null) // tenant being rejected
  const [rejectReason, setRejectReason] = useState('')

  const [tenants, setTenants]   = useState([])
  const [stats, setStats]       = useState(null)

  const [tenantSearch, setTenantSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchAll = useCallback(async () => {
    await Promise.resolve() // yield to avoid synchronous setState inside useEffect warning
    setLoading(true)
    try {
      // Real API routes: /api/v1/superadmin/*
      const [tRes, sRes] = await Promise.all([
        authAxios.get('/superadmin/tenants').catch(() => ({ data: { tenants: [] } })),
        authAxios.get('/superadmin/stats').catch(() => ({ data: { stats: null } })),
      ])
      setTenants(tRes.data?.tenants || [])
      setStats(sRes.data?.stats || null)

      // Derive users summary from tenants userCount
      // Separate user list endpoint does not exist — show tenant-level data
    } finally { setLoading(false) }
  }, [authAxios])

  useEffect(() => { fetchAll() }, [fetchAll])

  const approveTenant = async (id) => {
    setActionLoading(id)
    try {
      await authAxios.post(`/superadmin/tenants/${id}/approve`)
      setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'ACTIVE' } : t))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve')
    } finally { setActionLoading(null) }
  }

  const openRejectModal = (tenant) => {
    setRejectModal(tenant)
    setRejectReason('')
  }

  const confirmReject = async () => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.')
    setActionLoading(rejectModal.id)
    try {
      await authAxios.post(`/superadmin/tenants/${rejectModal.id}/reject`, { reason: rejectReason })
      setTenants(prev => prev.map(t => t.id === rejectModal.id ? { ...t, status: 'REJECTED' } : t))
      setRejectModal(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject')
    } finally { setActionLoading(null) }
  }

  const suspendTenant = async (id) => {
    if (!confirm('Suspend this organization? They will lose access immediately.')) return
    setActionLoading(id)
    try {
      await authAxios.post(`/superadmin/tenants/${id}/suspend`)
      setTenants(prev => prev.map(t => t.id === id ? { ...t, status: 'SUSPENDED' } : t))
    } catch (err) {
      console.error('Failed to suspend tenant:', err)
    } finally { setActionLoading(null) }
  }

  const pendingTenants = tenants.filter(t => t.status === 'PENDING_APPROVAL')
  const filteredTenants = tenants.filter(t =>
    !tenantSearch ||
    t.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.subdomain?.toLowerCase().includes(tenantSearch.toLowerCase())
  )

  // Build chart data from real stats
  const registrationsByMonth = stats?.registrationsByMonth || []
  const tierData = ['FREE', 'STANDARD', 'ENTERPRISE'].map(tier => ({
    name: tier.charAt(0) + tier.slice(1).toLowerCase(),
    count: tenants.filter(t => t.tier === tier).length,
  }))

  const statusBreakdown = [
    { label: 'Active',    val: stats?.approvedCompanies  ?? tenants.filter(t => t.status === 'ACTIVE').length,            color: 'var(--color-success)' },
    { label: 'Pending',   val: stats?.pendingCompanies   ?? tenants.filter(t => t.status === 'PENDING_APPROVAL').length,  color: 'var(--color-warning)' },
    { label: 'Rejected',  val: tenants.filter(t => t.status === 'REJECTED').length,                                       color: 'var(--color-danger)' },
    { label: 'Suspended', val: stats?.suspendedCompanies ?? tenants.filter(t => t.status === 'SUSPENDED').length,         color: 'var(--text-muted)' },
  ]

  const TABS = [
    { key: 'overview',  label: 'Overview',      icon: LayoutDashboard },
    { key: 'tenants',   label: 'Organizations', icon: Building2, count: tenants.length },
    { key: 'approvals', label: 'Approvals',     icon: ShieldCheck, count: pendingTenants.length },
    { key: 'analytics', label: 'Analytics',     icon: BarChart2 },
  ]

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <PageHeader
        title="Platform Administration"
        subtitle={`Welcome, ${user?.name || 'Super Admin'} — manage all organizations and platform settings`}
        actions={<Button variant="ghost" icon={RefreshCw} onClick={fetchAll} size="sm">Refresh</Button>}
      />

      <div style={{ marginBottom: 24 }}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="nx-grid-stats">{[...Array(4)].map((_,i)=><SkeletonCard key={i}/>)}</div>
      ) : (
        <>
          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="nx-stack-lg">
              {/* Stat cards */}
              <div className="nx-grid-stats">
                <StatCard label="Total Organizations" value={stats?.totalCompanies ?? tenants.length}     icon={Building2}  iconBg="var(--color-primary-light)"  iconColor="var(--color-primary)" />
                <StatCard label="Active Workspaces"   value={stats?.approvedCompanies ?? tenants.filter(t=>t.status==='ACTIVE').length} icon={Check} iconBg="var(--color-success-light)" iconColor="var(--color-success)" />
                <StatCard label="Pending Approval"    value={stats?.pendingCompanies ?? pendingTenants.length}  icon={ShieldCheck} iconBg="var(--color-warning-light)" iconColor="var(--color-warning)" />
                <StatCard label="Total Interns"       value={stats?.totalInterns ?? '—'}                  icon={Users}      iconBg="#f3f0ff"                    iconColor="#7c3aed" />
              </div>

              {/* Pending alert */}
              {pendingTenants.length > 0 && (
                <Alert variant="warning" title={`${pendingTenants.length} organization${pendingTenants.length > 1 ? 's' : ''} awaiting approval`}>
                  Review and approve pending workspaces from the <button onClick={() => setActiveTab('approvals')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warning)', fontWeight: 600, padding: 0 }}>Approvals tab</button>.
                </Alert>
              )}

              {/* Recent orgs + status breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card>
                  <CardHeader>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Organizations</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('tenants')}>View all</Button>
                  </CardHeader>
                  <div>
                    {tenants.slice(0, 6).map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: i < 5 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={16} color="var(--color-primary)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.subdomain} · {t.userCount} users</div>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                    {tenants.length === 0 && <div style={{ padding: 24 }}><EmptyState icon={Building2} title="No organizations yet" /></div>}
                  </div>
                </Card>

                <Card>
                  <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>Workspace Status</h3></CardHeader>
                  <CardBody>
                    {statusBreakdown.map(r => (
                      <div key={r.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.val}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${tenants.length ? (r.val / tenants.length) * 100 : 0}%`, background: r.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>
            </div>
          )}

          {/* ── ORGANIZATIONS LIST ────────────────────────── */}
          {activeTab === 'tenants' && (
            <div className="nx-stack-md">
              <div className="nx-search" style={{ maxWidth: 360 }}>
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <input value={tenantSearch} onChange={e => setTenantSearch(e.target.value)} placeholder="Search organizations…" />
              </div>

              {filteredTenants.length === 0 ? (
                <Card><CardBody><EmptyState icon={Building2} title="No organizations found" /></CardBody></Card>
              ) : (
                <Card>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="nx-table">
                      <thead>
                        <tr><th>Organization</th><th>Subdomain</th><th>Tier</th><th>Users</th><th>Status</th><th>Registered</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {filteredTenants.map(t => (
                          <tr key={t.id}>
                            <td className="nx-td-primary">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Building2 size={14} color="var(--color-primary)" />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</span>
                              </div>
                            </td>
                            <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{t.subdomain}</span></td>
                            <td>
                              <Badge variant={t.tier === 'ENTERPRISE' ? 'purple' : t.tier === 'STANDARD' ? 'blue' : 'gray'}>
                                {t.tier || 'FREE'}
                              </Badge>
                            </td>
                            <td>{t.userCount}</td>
                            <td><StatusBadge status={t.status} /></td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {t.status === 'PENDING_APPROVAL' && (
                                  <>
                                    <Button size="sm" variant="primary" loading={actionLoading === t.id} onClick={() => approveTenant(t.id)}>Approve</Button>
                                    <Button size="sm" variant="outline-danger" onClick={() => openRejectModal(t)}>Reject</Button>
                                  </>
                                )}
                                {t.status === 'ACTIVE' && (
                                  <Button size="sm" variant="outline-danger" loading={actionLoading === t.id} onClick={() => suspendTenant(t.id)}>Suspend</Button>
                                )}
                                {t.status === 'SUSPENDED' && (
                                  <Button size="sm" variant="primary" loading={actionLoading === t.id} onClick={() => approveTenant(t.id)}>Reactivate</Button>
                                )}
                              </div>
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

          {/* ── APPROVALS ─────────────────────────────────── */}
          {activeTab === 'approvals' && (
            <div className="nx-stack-md">
              {pendingTenants.length === 0 ? (
                <Card><CardBody>
                  <EmptyState icon={ShieldCheck} title="All caught up!" description="No organizations are waiting for approval." />
                </CardBody></Card>
              ) : (
                pendingTenants.map(t => (
                  <Card key={t.id}>
                    <CardBody>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={22} color="var(--color-primary)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t.name}</div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>Subdomain: <strong style={{ color: 'var(--text-primary)' }}>{t.subdomain}</strong></span>
                            <span>Users: <strong style={{ color: 'var(--text-primary)' }}>{t.userCount}</strong></span>
                            <span>Tier: <strong style={{ color: 'var(--text-primary)' }}>{t.tier || 'FREE'}</strong></span>
                            <span>Registered: <strong style={{ color: 'var(--text-primary)' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</strong></span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <Button variant="primary" loading={actionLoading === t.id} icon={Check} onClick={() => approveTenant(t.id)}>
                            Approve
                          </Button>
                          <Button variant="outline-danger" icon={X} onClick={() => openRejectModal(t)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── ANALYTICS ─────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="nx-stack-md">
              <div className="nx-grid-stats">
                {[
                  { label: 'Total Organizations',  val: stats?.totalCompanies ?? tenants.length },
                  { label: 'Active Workspaces',    val: stats?.approvedCompanies ?? tenants.filter(t=>t.status==='ACTIVE').length },
                  { label: 'Total Interns',        val: stats?.totalInterns ?? 0 },
                  { label: 'Total Mentors',        val: stats?.totalMentors ?? 0 },
                  { label: 'Internship Programs',  val: stats?.totalPrograms ?? 0 },
                  { label: 'Pending Approvals',    val: stats?.pendingCompanies ?? pendingTenants.length },
                ].map(s => (
                  <Card key={s.label}>
                    <CardBody compact>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{s.val}</div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card>
                  <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>Organizations by Tier</h3></CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={tierData} barCategoryGap="35%">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="count" name="Organizations" radius={[4,4,0,0]} fill="var(--color-primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>Registration Trend (6 months)</h3></CardHeader>
                  <CardBody>
                    {registrationsByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={registrationsByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                          <Line dataKey="registrations" name="New Orgs" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No registration data available yet
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── REJECT REASON MODAL ───────────────────────────── */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title={`Reject "${rejectModal?.name}"`} size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" loading={!!actionLoading} onClick={confirmReject}>Confirm Rejection</Button>
          </div>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Please provide a reason for rejection. This will be emailed to the organization admin.
        </p>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="e.g. Incomplete information provided, please resubmit with valid documentation."
          className="nx-textarea"
          rows={4}
        />
      </Modal>
    </DashboardLayout>
  )
}

export default SuperadminDashboard
