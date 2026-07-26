// apps/web-client/src/components/AppSidebar.jsx
// Premium collapsible Sidebar — Nextern Design System

import { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, Users, ClipboardList, CheckSquare,
  UserCheck, BarChart2, MessageSquare, Bell, Settings, LogOut,
  GraduationCap, ChevronLeft, ChevronRight, Building2, Award,
  BookOpen, FileText, Star, Globe, Search,
  UserPlus, Layers
} from 'lucide-react'

// ── Nav Items per role ────────────────────────────────
const NAV_CONFIG = {
  SUPERADMIN: [
    { section: 'Overview', items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin/dashboard', tab: 'overview' },
      { icon: Building2, label: 'Organizations', path: '/superadmin/dashboard', tab: 'tenants' },
    ]},
    { section: 'Operations', items: [
      { icon: ClipboardList, label: 'Approvals', path: '/superadmin/dashboard', tab: 'approvals', badge: '3' },
      { icon: BarChart2, label: 'Analytics', path: '/superadmin/dashboard', tab: 'analytics' },
    ]},
  ],
  ORG_ADMIN: [
    { section: 'Overview', items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', tab: 'overview' },
      { icon: Briefcase, label: 'Programs', path: '/admin/dashboard', tab: 'programs' },
      { icon: ClipboardList, label: 'Applications', path: '/admin/dashboard', tab: 'applications' },
    ]},
    { section: 'People', items: [
      { icon: UserCheck, label: 'Interns', path: '/admin/dashboard', tab: 'interns' },
      { icon: Users, label: 'Mentors', path: '/admin/dashboard', tab: 'mentors' },
      { icon: UserPlus, label: 'Invite', path: '/admin/dashboard', tab: 'invite' },
    ]},
    { section: 'Insights', items: [
      { icon: BarChart2, label: 'Analytics', path: '/admin/dashboard', tab: 'insights' },
      { icon: Building2, label: 'Org Profile', path: '/admin/dashboard', tab: 'org_profile' },
    ]},
  ],
  MENTOR: [
    { section: 'Overview', items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/mentor/dashboard', tab: 'overview' },
      { icon: Layers, label: 'Programs', path: '/mentor/dashboard', tab: 'programs' },
      { icon: Users, label: 'My Interns', path: '/mentor/dashboard', tab: 'interns' },
    ]},
    { section: 'Work', items: [
      { icon: CheckSquare, label: 'Tasks', path: '/mentor/dashboard', tab: 'tasks' },
      { icon: ClipboardList, label: 'Evaluations', path: '/mentor/dashboard', tab: 'evaluations' },
      { icon: MessageSquare, label: 'Messages', path: '/mentor/dashboard', tab: 'chat' },
    ]},
    { section: 'Reports', items: [
      { icon: BarChart2, label: 'Analytics', path: '/mentor/dashboard', tab: 'analytics' },
    ]},
  ],
  INTERN: [
    { section: 'Overview', items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/intern/dashboard', tab: 'overview' },
      { icon: Layers, label: 'My Program', path: '/intern/dashboard', tab: 'program' },
      { icon: CheckSquare, label: 'Tasks', path: '/intern/dashboard', tab: 'tasks' },
    ]},
    { section: 'Progress', items: [
      { icon: ClipboardList, label: 'Evaluations', path: '/intern/dashboard', tab: 'evaluations' },
      { icon: FileText, label: 'Submissions', path: '/intern/dashboard', tab: 'submissions' },
      { icon: Award, label: 'Certificate', path: '/intern/dashboard', tab: 'certificate' },
      { icon: Star, label: 'Program Review', path: '/intern/dashboard', tab: 'reviews' },
    ]},
    { section: 'Communication', items: [
      { icon: MessageSquare, label: 'Chat', path: '/intern/dashboard', tab: 'chat' },
      { icon: Bell, label: 'Announcements', path: '/intern/dashboard', tab: 'announcements' },
    ]},
  ],
  STUDENT: [
    { section: 'Discover', items: [
      { icon: Search, label: 'Browse', path: '/student/dashboard', tab: 'browse' },
      { icon: BookOpen, label: 'Saved', path: '/student/dashboard', tab: 'saved' },
    ]},
    { section: 'My Journey', items: [
      { icon: ClipboardList, label: 'Applications', path: '/student/dashboard', tab: 'applications' },
      { icon: UserCheck, label: 'My Profile', path: '/student/dashboard', tab: 'profile' },
    ]},
  ],
}

// ── Sidebar Component ────────────────────────────────
const AppSidebar = ({ collapsed, onCollapse, mobileOpen, onMobileClose, activeTab, onTabChange }) => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const role = (user?.role || '').toUpperCase()
  const navConfig = NAV_CONFIG[role] || []

  const handleNavClick = (item) => {
    if (onTabChange) onTabChange(item.tab)
    if (item.path !== location.pathname) {
      navigate(item.path + (item.tab ? `?tab=${item.tab}` : ''))
    }
    if (onMobileClose) onMobileClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (item) => {
    return location.pathname === item.path && activeTab === item.tab
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/50"
            onClick={onMobileClose}
            style={{ display: 'none' }}
            id="sidebar-overlay"
          />
        )}
      </AnimatePresence>

      <aside
        className={`nx-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        id="app-sidebar"
      >
        {/* Logo */}
        <div className="nx-sidebar-logo">
          <div className="nx-sidebar-logo-icon">
            <GraduationCap size={18} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="nx-sidebar-logo-text"
              >
                Nextern
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="nx-sidebar-nav">
          {navConfig.map((section, si) => (
            <div key={si} className="nx-sidebar-section">
              {!collapsed && (
                <div className="nx-sidebar-section-label">{section.section}</div>
              )}
              {section.items.map((item, ii) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <button
                    key={ii}
                    onClick={() => handleNavClick(item)}
                    className={`nx-nav-item ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nx-nav-icon">
                      <Icon size={16} />
                    </span>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                          className="nx-nav-label"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && item.badge && (
                      <span className="nx-nav-badge">{item.badge}</span>
                    )}
                  </button>
                )
              })}
              {si < navConfig.length - 1 && !collapsed && (
                <div style={{ height: 4 }} />
              )}
            </div>
          ))}

          {/* Public browse link */}
          <div style={{ height: 8 }} />
          <div className="nx-divider" />
          <div style={{ height: 8 }} />
          <button
            className="nx-nav-item"
            onClick={() => { navigate('/internships'); if (onMobileClose) onMobileClose() }}
            title={collapsed ? 'Browse Internships' : undefined}
          >
            <span className="nx-nav-icon"><Globe size={16} /></span>
            {!collapsed && <span className="nx-nav-label">Browse Internships</span>}
          </button>
        </nav>

        {/* Footer */}
        <div className="nx-sidebar-footer">
          {/* Logout */}
          <button
            className="nx-nav-item"
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            style={{ color: 'var(--color-danger)', marginBottom: 4 }}
          >
            <span className="nx-nav-icon"><LogOut size={15} /></span>
            {!collapsed && <span className="nx-nav-label">Sign Out</span>}
          </button>

          {/* Collapse toggle — desktop only */}
          <button
            className="nx-sidebar-collapse-btn"
            onClick={onCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : (
              <>
                <ChevronLeft size={14} />
                <AnimatePresence>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: 11 }}
                  >
                    Collapse
                  </motion.span>
                </AnimatePresence>
              </>
            )}
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          #sidebar-overlay { display: block !important; }
          #app-sidebar {
            transform: translateX(-100%) !important;
          }
          #app-sidebar.mobile-open {
            transform: translateX(0) !important;
            box-shadow: var(--shadow-xl) !important;
            z-index: 65 !important;
          }
        }
      `}</style>
    </>
  )
}

export default AppSidebar
