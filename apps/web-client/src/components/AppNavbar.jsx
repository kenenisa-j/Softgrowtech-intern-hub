// apps/web-client/src/components/AppNavbar.jsx
// Premium responsive Navbar — Nextern Design System

import { useState, useContext, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Moon, Sun, ChevronDown, LogOut, Settings,
  User, Menu, X
} from 'lucide-react'

const AppNavbar = ({ sidebarCollapsed, onMenuToggle }) => {
  const { user, logout } = useContext(AuthContext)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const profileRef = useRef()
  const notifRef = useRef()
  const searchRef = useRef()

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (role) => {
    const map = {
      SUPERADMIN: { label: 'Super Admin', cls: 'nx-badge-red' },
      ORG_ADMIN:  { label: 'Admin', cls: 'nx-badge-blue' },
      MENTOR:     { label: 'Mentor', cls: 'nx-badge-purple' },
      INTERN:     { label: 'Intern', cls: 'nx-badge-green' },
      STUDENT:    { label: 'Student', cls: 'nx-badge-sky' },
    }
    return map[(role || '').toUpperCase()] || { label: role, cls: 'nx-badge-gray' }
  }

  const roleBadge = getRoleBadge(user?.role)

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Application reviewed', desc: 'Your application has been shortlisted.', time: '2m ago', unread: true },
    { id: 2, title: 'New task assigned', desc: 'React Dashboard component due Friday.', time: '1h ago', unread: true },
    { id: 3, title: 'Evaluation published', desc: 'Your mid-term evaluation is ready.', time: '2h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      {/* Overlay for mobile search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav
        className={`nx-navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }}
      >
        {/* Left: Mobile menu + brand search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Hamburger (mobile) */}
          <button
            onClick={onMenuToggle}
            className="nx-btn nx-btn-ghost nx-btn-icon"
            style={{ display: 'none', flexShrink: 0 }}
            aria-label="Toggle menu"
            id="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>

          {/* Global search */}
          <div
            ref={searchRef}
            style={{ position: 'relative', maxWidth: 360, flex: 1 }}
          >
            <div className="nx-search" style={{ width: '100%' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search internships, people, tasks..."
                style={{ fontSize: 13 }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nx-btn nx-btn-ghost nx-btn-icon"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          >
            {theme === 'dark'
              ? <Sun size={16} />
              : <Moon size={16} />
            }
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="nx-btn nx-btn-ghost nx-btn-icon"
              style={{ position: 'relative' }}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="nx-notification-dot" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="nx-dropdown"
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    width: 340, maxWidth: 'calc(100vw - 32px)',
                    boxShadow: 'var(--shadow-xl)'
                  }}
                >
                  <div style={{
                    padding: '12px 14px 8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-default)', marginBottom: 4
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="nx-badge nx-badge-blue">{unreadCount} new</span>
                    )}
                  </div>
                  {notifications.map(n => (
                    <button key={n.id} className="nx-dropdown-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
                        <span style={{ fontWeight: n.unread ? 600 : 400, color: 'var(--text-primary)', fontSize: 13 }}>{n.title}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{n.time}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: n.unread ? 14 : 0 }}>{n.desc}</span>
                    </button>
                  ))}
                  <div style={{ padding: '8px 10px 6px', borderTop: '1px solid var(--border-default)', marginTop: 4 }}>
                    <button className="nx-btn nx-btn-ghost" style={{ width: '100%', fontSize: 12 }}>View all notifications</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 4px' }} />

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px',
                borderRadius: 'var(--radius-md)', border: 'none', background: 'none',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span className="nx-avatar nx-avatar-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                {getInitials(user?.name)}
              </span>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1 }} className="hide-mobile">
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'User'}
                </span>
              </div>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} className="hide-mobile" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="nx-dropdown"
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    minWidth: 220, boxShadow: 'var(--shadow-xl)'
                  }}
                >
                  {/* Profile header */}
                  <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-default)', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="nx-avatar nx-avatar-md" style={{ background: 'var(--color-primary)', color: 'white' }}>
                        {getInitials(user?.name)}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                        <span className={`nx-badge ${roleBadge.cls}`} style={{ marginTop: 4, display: 'inline-flex' }}>{roleBadge.label}</span>
                      </div>
                    </div>
                  </div>

                  <button className="nx-dropdown-item">
                    <User size={14} /> My Profile
                  </button>
                  <button className="nx-dropdown-item">
                    <Settings size={14} /> Settings
                  </button>
                  <div className="nx-dropdown-separator" />
                  <button className="nx-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}

export default AppNavbar
