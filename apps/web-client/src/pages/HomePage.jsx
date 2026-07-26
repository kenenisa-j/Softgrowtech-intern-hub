// HomePage.jsx — Nextern Design System v2
// Premium public landing page
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  GraduationCap, Search, ArrowRight, Building2, Star, Moon, Sun, Menu, X, ChevronRight, Zap, Shield,
  BarChart2, Award, Clock, MapPin
} from 'lucide-react'

const CATEGORY_ICONS = {  'Engineering': '⚙️', 'Software Engineering': '💻', 'Cybersecurity': '🔒',
  'AI & Data Science': '🤖', 'Full-Stack Development': '🖥️',
  'Design': '🎨', 'Graphic Design': '🎨', 'Photography': '📷', 'Video Editing': '🎬',
  'Marketing': '📣', 'Finance': '💹', 'Accounting': '📒',
  'Healthcare': '🏥', 'Nursing': '💊', 'Pharmacy': '💉',
  'Data Science': '📊', 'Law': '⚖️', 'Education': '📚',
  'Human Resources': '👥', 'Agriculture': '🌱', 'Construction': '🏗️',
  'Hospitality': '🏨', 'Research': '🔬', 'Civil Engineering': '🏙️',
  'Mechanical Engineering': '🔧', 'Electrical Engineering': '⚡',
}

const TESTIMONIALS = [
  { name: 'Selam Tesfaye', initials: 'ST', role: 'Software Intern', quote: 'Nextern helped me land my first tech internship within weeks. The platform is incredibly intuitive.' },
  { name: 'Dawit Bekele', initials: 'DB', role: 'HR Manager', quote: 'We filled three intern positions in record time. The quality of applicants is outstanding.' },
  { name: 'Meron Alemu', initials: 'MA', role: 'Design Intern', quote: 'I loved how transparent the process was. I always knew exactly where my application stood.' },
]

const FEATURES = [
  { icon: Zap, title: 'Smart Matching', desc: 'AI-powered matching connects students with the most relevant internship opportunities in seconds.' },
  { icon: Shield, title: 'Verified Organizations', desc: 'Every organization goes through our approval process to ensure quality and authenticity.' },
  { icon: BarChart2, title: 'Progress Tracking', desc: 'Real-time dashboards for mentors, interns, and organizations to track every milestone.' },
  { icon: Award, title: 'Certificates', desc: 'Earn verifiable digital certificates upon completing your internship program.' },
]

const HOW_IT_WORKS = [
  {
    step: '01', label: 'For Organizations', color: 'var(--color-primary)',
    items: ['Register your workspace', 'Create internship programs', 'Review applications with Kanban', 'Onboard accepted interns']
  },
  {
    step: '02', label: 'For Students', color: 'var(--color-success)',
    items: ['Create a free account', 'Browse & filter programs', 'Apply with one click', 'Track application status live']
  },
]
const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const end = parseInt(value, 10);
    if (isNaN(end) || end <= 0) {
      setCount(0);
      return;
    }

    const duration = 1500; // Animation duration in milliseconds
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value]);

  return <span style={{ transition: 'all 0.2s ease' }}>+{count}</span>;
};

const HomePage = () => {
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [programs, setPrograms] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ orgs: 0, programs: 0, applications: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    axios.get('/programs/public').then(r => {
      const progs = r.data?.programs || []
      setPrograms(progs.slice(0, 6))
    }).catch(() => {})

    axios.get('/programs/stats').then(r => {
      const d = r.data
      setStats({ orgs: d.organizations || 0, programs: d.internships || 0, applications: d.applications || 0 })
    }).catch(() => {})

    axios.get('/programs/categories').then(r => {
      const cats = (r.data?.categories || []).slice(0, 8)
      setCategories(cats.map(c => ({ name: c, icon: CATEGORY_ICONS[c] || '📋' })))
    }).catch(() => {})
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) window.location.href = `/internships?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 100,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', padding: '0 24px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Nextern</span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {[
              { to: '/internships', label: 'Browse' },
              { to: '/login', label: 'Sign In' },
            ].map(l => (
              <Link key={l.label} to={l.to} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/register" style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--color-primary)', color: 'white',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
            }} className="desktop-nav">
              Get Started <ArrowRight size={13} />
            </Link>
            <button onClick={() => setMobileMenuOpen(o => !o)} className="mobile-menu-btn" style={{ display: 'none', width: 36, height: 36, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)', padding: 16, zIndex: 99, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ to: '/internships', label: 'Browse Internships' }, { to: '/login', label: 'Sign In' }, { to: '/register', label: 'Register Organization' }, { to: '/student/register', label: 'Student Sign Up' }].map(l => (
            <Link key={l.label} to={l.to} onClick={() => setMobileMenuOpen(false)} style={{ padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--bg-subtle)' }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', borderRadius: 999, marginBottom: 24 }}
          >
            <Zap size={13} color="var(--color-primary)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>Multi-tenant Internship Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 20 }}
          >
            The modern platform for{' '}
            <span style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              internship management
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}
          >
            Nextern connects talented students with organizations offering meaningful internships. Manage applications, mentors, tasks, and evaluations — all in one place.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', gap: 0, maxWidth: 520, margin: '0 auto 32px', boxShadow: 'var(--shadow-lg)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16, color: 'var(--text-muted)', flexShrink: 0 }}>
              <Search size={16} />
            </div>
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search internships, categories, or organizations…"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 12px', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}
            />
            <button onClick={handleSearch} style={{
              padding: '0 24px', background: 'var(--color-primary)', border: 'none', cursor: 'pointer',
              color: 'white', fontWeight: 600, fontSize: 14, flexShrink: 0
            }}>
              Search
            </button>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/student/register" style={{
              padding: '12px 24px', borderRadius: 10, background: 'var(--color-primary)', color: 'white',
              fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'all 0.2s'
            }}>
              <GraduationCap size={16} /> Find Internships
            </Link>
            <Link to="/register" style={{
              padding: '12px 24px', borderRadius: 10, background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
            }}>
              <Building2 size={16} /> Register Organization
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-card)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { val: stats.orgs, label: 'Organizations' },
            { val: stats.programs, label: 'Open Internships' },
            { val: stats.applications, label: 'Applications' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-1px' }}>
                <AnimatedCounter value={s.val} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Browse by Category</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 10 }}>Explore internships across every industry and discipline</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
            >
              <Link to={`/internships?category=${encodeURIComponent(cat.name)}`} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12,
                textDecoration: 'none', transition: 'all 0.15s', cursor: 'pointer'
              }}>
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.count} open</div>
                </div>
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PROGRAMS ─────────────────────────────── */}
      {programs.length > 0 && (
        <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>Featured Opportunities</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Hand-picked programs from verified organizations</p>
            </div>
            <Link to="/internships" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20
          }}>
            {programs.map((p, i) => {
              const org = p.tenant || p.organization || {};
              const logo = org.logo_url;
              const name = org.name || 'Organization';
              const industry = org.industry || 'Industry';
              const verified = org.is_verified || false;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 14,
                    padding: 20, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {logo
                          ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Building2 size={20} color="var(--color-primary)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {name}
                          {verified && <span style={{ color: '#10B981', fontSize: 11 }}>✔</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {[
                        { label: p.category, color: 'var(--color-primary-light)', text: 'var(--color-primary)', border: 'var(--color-primary-border)' },
                        { label: p.type, color: 'var(--bg-subtle)', text: 'var(--text-secondary)', border: 'var(--border-default)' },
                        { label: p.is_paid ? 'Paid' : 'Unpaid', color: p.is_paid ? 'var(--color-success-light)' : 'var(--bg-subtle)', text: p.is_paid ? 'var(--color-success)' : 'var(--text-muted)', border: p.is_paid ? 'var(--color-success-border)' : 'var(--border-default)' },
                      ].map(b => (
                        <span key={b.label} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: b.color, color: b.text, border: `1px solid ${b.border}`, fontWeight: 600 }}>{b.label}</span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                      {[
                        { icon: MapPin, val: p.location || 'Remote' },
                        { icon: Clock, val: p.duration || '—' },
                      ].map((r, ri) => (
                        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                          <r.icon size={12} />{r.val}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link to={`/program/${p.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 0', borderRadius: 8, background: 'var(--color-primary)',
                    color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 12
                  }}>
                    View Details <ArrowRight size={13} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>How Nextern Works</h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 10 }}>Simple for students. Powerful for organizations.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map((hw, i) => (
              <motion.div
                key={hw.step}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 28 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: hw.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{hw.step}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{hw.label}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {hw.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: hw.color + '20', border: `1px solid ${hw.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: hw.color }}>{j + 1}</span>
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Everything you need</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 10 }}>Built for the complete internship lifecycle</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={20} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Trusted by students & organizations</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, flex: 1, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563EB, #4F46E5)', borderRadius: 20, padding: '56px 32px', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 14 }}>Ready to start your journey?</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Join thousands of students and organizations already using Nextern to manage internship programs.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/student/register" style={{ padding: '12px 24px', borderRadius: 10, background: 'white', color: 'var(--color-primary)', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={16} /> I'm a Student
              </Link>
              <Link to="/register" style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                <Building2 size={16} /> I'm an Organization
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-card)', padding: '40px 24px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 40 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={16} color="white" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Nextern</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>The modern internship management platform for organizations and talent.</p>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { heading: 'Platform', links: [['Browse', '/internships'], ['Sign In', '/login'], ['Register', '/register']] },
                { heading: 'Students', links: [['Create Account', '/student/register'], ['Find Programs', '/internships'], ['Verify Certificate', '/verify']] },
              ].map(col => (
                <div key={col.heading}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{col.heading}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {col.links.map(([label, href]) => (
                      <Link key={label} to={href} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>© {new Date().getFullYear()} Nextern. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Privacy', 'Terms', 'Contact'].map(l => (
                <Link key={l} to="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

export default HomePage
