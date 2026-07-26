// apps/web-client/src/components/DashboardLayout.jsx
// Wraps all dashboard pages with Sidebar + Navbar + page container

import { useState } from 'react'
import AppSidebar from './AppSidebar'
import AppNavbar from './AppNavbar'
import { motion } from 'framer-motion'

const DashboardLayout = ({ children, activeTab, onTabChange }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="nx-layout" style={{ background: 'var(--bg-base)' }}>
      <AppSidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div
        className={`nx-main ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          marginLeft: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          paddingTop: 'var(--navbar-height)',
          transition: 'margin-left 0.2s ease',
          minWidth: 0,
          flex: 1,
        }}
      >
        <AppNavbar
          sidebarCollapsed={collapsed}
          onMenuToggle={() => setMobileOpen(o => !o)}
        />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="nx-page nx-page-enter"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardLayout
