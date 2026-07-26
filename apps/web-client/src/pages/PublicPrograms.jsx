// PublicPrograms.jsx — Nextern Design System v2
// Public internship browse page (no login required)
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Search, X, MapPin, Clock, Calendar,
  Building2, ArrowRight, Moon, Sun,
  Briefcase, SlidersHorizontal, ArrowLeft
} from 'lucide-react'
import { EmptyState, Skeleton } from '../components/ui'

const CATEGORIES = [
  'Software Engineering','Cybersecurity','AI & Data Science','Full-Stack Development',
  'Marketing','Accounting','Finance','Human Resources','Nursing','Pharmacy',
  'Graphic Design','Photography','Video Editing','Law','Agriculture',
  'Education','Construction','Hospitality','Research','Civil Engineering',
]

const PublicPrograms = () => {
  const { theme, toggleTheme } = useTheme()
  const [searchParams] = useSearchParams()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const [search, setSearch]       = useState(searchParams.get('q') || '')
  const [category, setCategory]   = useState(searchParams.get('category') || '')
  const [type, setType]           = useState('')
  const [paid, setPaid]           = useState('')

  useEffect(() => {
    axios.get('/programs/public')
      .then(r => { setLoading(false); setPrograms(r.data?.programs || []) })
      .catch(() => { setLoading(false); setPrograms([]) })
  }, [])

  const filtered = programs.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.organization?.name?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q)
    const matchCat  = !category || p.category === category
    const matchType = !type || p.type === type
    const matchPaid = !paid || (paid === 'paid' ? p.is_paid : !p.is_paid)
    return matchQ && matchCat && matchType && matchPaid
  })

  const activeFilters = [category, type, paid].filter(Boolean).length

  const clearFilters = () => { setCategory(''); setType(''); setPaid('') }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', height: 60, padding: '0 24px', gap: 16
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Nextern</span>
        </Link>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 440 }}>
          <div className="nx-search">
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, category, or organization…"
              style={{ fontSize: 13 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-default)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', background: 'var(--bg-card)' }}>Sign In</Link>
          <Link to="/register" style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Register</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Page title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Browse Internships</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {loading ? 'Loading…' : `${filtered.length} internship${filtered.length !== 1 ? 's' : ''} available`}
            </p>
          </div>

          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              borderRadius: 8, border: '1px solid var(--border-default)',
              background: activeFilters > 0 ? 'var(--color-primary-light)' : 'var(--bg-card)',
              color: activeFilters > 0 ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer'
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters > 0 && (
              <span style={{ background: 'var(--color-primary)', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{activeFilters}</span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 20 }}
            >
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: 12, padding: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end'
              }}>
                {/* Category */}
                <div className="nx-form-group" style={{ flex: '1 1 200px' }}>
                  <label className="nx-label">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="nx-select">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Type */}
                <div className="nx-form-group" style={{ flex: '1 1 140px' }}>
                  <label className="nx-label">Work Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="nx-select">
                    <option value="">All Types</option>
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                {/* Paid */}
                <div className="nx-form-group" style={{ flex: '1 1 140px' }}>
                  <label className="nx-label">Compensation</label>
                  <select value={paid} onChange={e => setPaid(e.target.value)} className="nx-select">
                    <option value="">Any</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>

                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="nx-btn nx-btn-ghost nx-btn-sm" style={{ flexShrink: 0 }}>
                    <X size={13} /> Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeFilters > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {category && <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--color-primary-border)' }}>{category}<button onClick={() => setCategory('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit', padding: 0 }}><X size={11} /></button></span>}
            {type && <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--color-primary-border)' }}>{type}<button onClick={() => setType('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit', padding: 0 }}><X size={11} /></button></span>}
            {paid && <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--color-primary-border)' }}>{paid}<button onClick={() => setPaid('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'inherit', padding: 0 }}><X size={11} /></button></span>}
          </div>
        )}

        {/* Programs grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Skeleton width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton height={14} width="70%" />
                    <Skeleton height={12} width="50%" />
                  </div>
                </div>
                <Skeleton height={12} />
                <Skeleton height={12} width="80%" />
                <Skeleton height={36} style={{ borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
            <EmptyState
              icon={Briefcase}
              title="No internships found"
              description="Try adjusting your search or clearing the filters."
              action={
                <button onClick={() => { setSearch(''); clearFilters() }} className="nx-btn nx-btn-secondary">
                  Clear all filters
                </button>
              }
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((p, i) => {
              const org = p.tenant || p.organization || {};
              const logo = org.logo_url;
              const name = org.name || 'Organization';
              const verified = org.is_verified || false;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  whileHover={{ y: -2 }}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                    borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 0,
                    transition: 'box-shadow 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {logo
                        ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Building2 size={20} color="var(--color-primary)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {name}
                        {verified && <span style={{ color: '#10B981', fontSize: 11 }}>✔</span>}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)', fontWeight: 600 }}>{p.category}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', fontWeight: 600 }}>{p.type}</span>
                    {p.is_paid
                      ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)', fontWeight: 600 }}>Paid</span>
                      : <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-default)', fontWeight: 600 }}>Unpaid</span>
                    }
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                    {p.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <MapPin size={11} />{p.location}
                      </div>
                    )}
                    {p.duration && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Clock size={11} />{p.duration}
                      </div>
                    )}
                    {p.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Calendar size={11} />Due {new Date(p.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {p.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                      {p.skills.slice(0, 4).map(s => (
                        <span key={s} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: 999, border: '1px solid var(--border-default)' }}>{s}</span>
                      ))}
                      {p.skills.length > 4 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{p.skills.length - 4}</span>}
                    </div>
                  )}

                  {/* CTA */}
                  <Link to={`/program/${p.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', borderRadius: 8, background: 'var(--color-primary)',
                    color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    View Details <ArrowRight size={13} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom back link */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PublicPrograms
