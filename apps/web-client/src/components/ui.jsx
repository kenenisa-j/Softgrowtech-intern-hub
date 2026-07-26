// apps/web-client/src/components/ui.jsx
// Reusable UI components — Nextern Design System
// Usage: import { Button, Card, Badge, Stat, EmptyState, Skeleton, Modal } from '../components/ui'

import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Button ──────────────────────────────────────────── */
export const Button = ({
  children, variant = 'secondary', size = 'md',
  icon: Icon, iconRight, disabled, loading, className = '', onClick, type = 'button', ...props
}) => {
  const variantCls = {
    primary:       'nx-btn-primary',
    secondary:     'nx-btn-secondary',
    ghost:         'nx-btn-ghost',
    danger:        'nx-btn-danger',
    'outline-danger': 'nx-btn-outline-danger',
  }[variant] || 'nx-btn-secondary'

  const sizeCls = { sm: 'nx-btn-sm', md: '', lg: 'nx-btn-lg' }[size] || ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`nx-btn ${variantCls} ${sizeCls} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="nx-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
      ) : Icon && (
        <Icon size={size === 'sm' ? 13 : 15} />
      )}
      {children}
      {iconRight && !loading && <iconRight.type {...iconRight.props} size={size === 'sm' ? 13 : 15} />}
    </button>
  )
}

/* ── IconButton ──────────────────────────────────────── */
export const IconButton = ({ icon: Icon, variant = 'ghost', size = 'md', title, onClick, className = '' }) => {
  const variantCls = {
    primary: 'nx-btn-primary',
    secondary: 'nx-btn-secondary',
    ghost: 'nx-btn-ghost',
    danger: 'nx-btn-outline-danger',
  }[variant] || 'nx-btn-ghost'
  const sizeCls = size === 'sm' ? 'nx-btn-sm' : ''
  return (
    <button
      onClick={onClick}
      title={title}
      className={`nx-btn nx-btn-icon ${variantCls} ${sizeCls} ${className}`}
    >
      <Icon size={size === 'sm' ? 13 : 15} />
    </button>
  )
}

/* ── Card ────────────────────────────────────────────── */
export const Card = ({ children, className = '', hover = false, onClick, style }) => (
  <div
    className={`nx-card ${hover ? 'nx-card-hover' : ''} ${className}`}
    onClick={onClick}
    style={style}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }) => (
  <div className={`nx-card-header ${className}`}>{children}</div>
)

export const CardBody = ({ children, className = '', compact }) => (
  <div className={`${compact ? 'nx-card-body-sm' : 'nx-card-body'} ${className}`}>{children}</div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={`nx-card-footer ${className}`}>{children}</div>
)

/* ── Badge ───────────────────────────────────────────── */
export const Badge = ({ children, variant = 'gray', dot = false, className = '' }) => {
  const variantCls = {
    blue: 'nx-badge-blue', green: 'nx-badge-green', amber: 'nx-badge-amber',
    red: 'nx-badge-red', sky: 'nx-badge-sky', gray: 'nx-badge-gray', purple: 'nx-badge-purple',
  }[variant] || 'nx-badge-gray'

  const dotColor = {
    blue: 'var(--color-primary)', green: 'var(--color-success)', amber: 'var(--color-warning)',
    red: 'var(--color-danger)', sky: 'var(--color-info)', gray: 'var(--text-muted)', purple: '#7c3aed',
  }[variant]

  return (
    <span className={`nx-badge ${variantCls} ${className}`}>
      {dot && <span className="nx-badge-dot" style={{ background: dotColor }} />}
      {children}
    </span>
  )
}

/* Application status badge */
export const StatusBadge = ({ status }) => {
  const map = {
    PENDING:     { label: 'Applied',      variant: 'sky' },
    SHORTLISTED: { label: 'Shortlisted',  variant: 'blue' },
    INTERVIEW:   { label: 'Interview',    variant: 'purple' },
    ACCEPTED:    { label: 'Accepted',     variant: 'green' },
    REJECTED:    { label: 'Rejected',     variant: 'red' },
    ACTIVE:      { label: 'Active',       variant: 'green' },
    COMPLETED:   { label: 'Completed',    variant: 'blue' },
    INACTIVE:    { label: 'Inactive',     variant: 'gray' },
    APPROVED:    { label: 'Approved',     variant: 'green' },
    PENDING_APPROVAL: { label: 'Pending', variant: 'amber' },
    SUSPENDED:   { label: 'Suspended',   variant: 'red' },
    FREE:        { label: 'Free',         variant: 'gray' },
    STANDARD:    { label: 'Standard',    variant: 'blue' },
    ENTERPRISE:  { label: 'Enterprise',  variant: 'purple' },
  }
  const cfg = map[status?.toUpperCase()] || { label: status, variant: 'gray' }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

/* ── Stat Card ───────────────────────────────────────── */
export const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, change, changeLabel, suffix = '' }) => {
  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <div className="nx-stat-card">
      <div className="nx-stat-card-header">
        <div>
          <div className="nx-stat-card-label">{label}</div>
          <div className="nx-stat-card-value">{value}{suffix}</div>
        </div>
        {Icon && (
          <div
            className="nx-stat-card-icon"
            style={{ background: iconBg || 'var(--color-primary-light)', color: iconColor || 'var(--color-primary)' }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`nx-stat-card-change ${isPositive ? 'nx-stat-positive' : isNegative ? 'nx-stat-negative' : 'nx-stat-neutral'}`}>
            {isPositive ? <TrendingUp size={10} /> : isNegative ? <TrendingDown size={10} /> : <Minus size={10} />}
            {Math.abs(change)}%
          </span>
          {changeLabel && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}

/* ── Empty State ─────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="nx-empty">
    <div className="nx-empty-icon">
      {Icon && <Icon size={24} />}
    </div>
    <div className="nx-empty-title">{title}</div>
    {description && <p className="nx-empty-desc">{description}</p>}
    {action}
  </div>
)

/* ── Skeleton ────────────────────────────────────────── */
export const Skeleton = ({ width = '100%', height = 16, className = '', style }) => (
  <div
    className={`nx-skeleton ${className}`}
    style={{ width, height, ...style }}
  />
)

export const SkeletonCard = () => (
  <div className="nx-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Skeleton width={40} height={40} style={{ borderRadius: 8 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
    <Skeleton height={12} />
    <Skeleton height={12} width="80%" />
    <Skeleton height={12} width="60%" />
  </div>
)

/* ── Modal ───────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, size = 'md', footer }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="nx-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          className={`nx-modal nx-modal-${size}`}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          {title && (
            <div className="nx-modal-header">
              <div>
                {typeof title === 'string'
                  ? <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
                  : title
                }
              </div>
              <button
                onClick={onClose}
                className="nx-btn nx-btn-ghost nx-btn-icon nx-btn-sm"
              >
                <X size={15} />
              </button>
            </div>
          )}
          <div className="nx-modal-body">{children}</div>
          {footer && <div className="nx-modal-footer">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

/* ── Input ───────────────────────────────────────────── */
export const Input = ({ label, error, helper, required, icon: Icon, className = '', ...props }) => (
  <div className="nx-form-group">
    {label && (
      <label className={`nx-label ${required ? 'nx-label-required' : ''}`}>{label}</label>
    )}
    <div className={Icon ? 'nx-input-icon-wrapper' : ''}>
      {Icon && <span className="nx-input-icon"><Icon size={14} /></span>}
      <input className={`nx-input ${error ? 'nx-input-error' : ''} ${className}`} {...props} />
    </div>
    {helper && !error && <span className="nx-helper">{helper}</span>}
    {error && <span className="nx-error-text">{error}</span>}
  </div>
)

/* ── Textarea ─────────────────────────────────────────── */
export const Textarea = ({ label, error, helper, required, className = '', ...props }) => (
  <div className="nx-form-group">
    {label && (
      <label className={`nx-label ${required ? 'nx-label-required' : ''}`}>{label}</label>
    )}
    <textarea className={`nx-textarea ${error ? 'nx-input-error' : ''} ${className}`} {...props} />
    {helper && !error && <span className="nx-helper">{helper}</span>}
    {error && <span className="nx-error-text">{error}</span>}
  </div>
)

/* ── Select ───────────────────────────────────────────── */
export const Select = ({ label, error, helper, required, children, className = '', ...props }) => (
  <div className="nx-form-group">
    {label && (
      <label className={`nx-label ${required ? 'nx-label-required' : ''}`}>{label}</label>
    )}
    <select className={`nx-select ${error ? 'nx-input-error' : ''} ${className}`} {...props}>
      {children}
    </select>
    {helper && !error && <span className="nx-helper">{helper}</span>}
    {error && <span className="nx-error-text">{error}</span>}
  </div>
)

/* ── Avatar ───────────────────────────────────────────── */
export const Avatar = ({ name, size = 'md', src, color }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'
  const sizeCls = { sm: 'nx-avatar-sm', md: 'nx-avatar-md', lg: 'nx-avatar-lg', xl: 'nx-avatar-xl', '2xl': 'nx-avatar-2xl' }[size] || 'nx-avatar-md'

  if (src) {
    return <img src={src} alt={name} className={`nx-avatar ${sizeCls}`} style={{ objectFit: 'cover' }} />
  }

  return (
    <span
      className={`nx-avatar ${sizeCls}`}
      style={color ? { background: color, color: 'white' } : undefined}
    >
      {initials}
    </span>
  )
}

/* ── Progress bar ──────────────────────────────────────── */
export const Progress = ({ value = 0, max = 100, color = 'var(--color-primary)' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="nx-progress-track">
      <div className="nx-progress-bar" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

/* ── Tabs ──────────────────────────────────────────────── */
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="nx-tabs">
    {tabs.map(tab => (
      <button
        key={tab.key}
        className={`nx-tab ${activeTab === tab.key ? 'active' : ''}`}
        onClick={() => onChange(tab.key)}
      >
        {tab.icon && <tab.icon size={14} />}
        {tab.label}
        {tab.count !== undefined && (
          <span style={{
            background: activeTab === tab.key ? 'var(--color-primary)' : 'var(--bg-subtle)',
            color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
            fontSize: 10, fontWeight: 600, padding: '1px 6px',
            borderRadius: 'var(--radius-full)', marginLeft: 2
          }}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
)

/* ── Section header ────────────────────────────────────── */
export const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>}
    </div>
    {action && <div style={{ flexShrink: 0 }}>{action}</div>}
  </div>
)

/* ── Page Header ───────────────────────────────────────── */
export const PageHeader = ({ title, subtitle, breadcrumb, actions }) => (
  <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
    <div>
      {breadcrumb && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{breadcrumb}</div>
      )}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
  </div>
)

/* ── Alert ────────────────────────────────────────────── */
export const Alert = ({ variant = 'info', title, children, onClose }) => {
  const cfg = {
    info:    { bg: 'var(--color-info-light)',    border: 'var(--color-info-border)',    color: 'var(--color-info)' },
    success: { bg: 'var(--color-success-light)', border: 'var(--color-success-border)', color: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-light)', border: 'var(--color-warning-border)', color: 'var(--color-warning)' },
    danger:  { bg: 'var(--color-danger-light)',  border: 'var(--color-danger-border)',  color: 'var(--color-danger)' },
  }[variant] || {}

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-md)', padding: '12px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color, marginBottom: 2 }}>{title}</div>}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/* ── Divider ──────────────────────────────────────────── */
export const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
    <div className="nx-divider" />
    {label && <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>{label}</span>}
    {label && <div className="nx-divider" />}
  </div>
)

/* ── Loading Spinner ──────────────────────────────────── */
export const Spinner = ({ size = 20, color = 'var(--color-primary)' }) => (
  <span style={{
    display: 'inline-block',
    width: size, height: size,
    border: `2px solid ${color}33`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'nx-spin 0.7s linear infinite',
  }} />
)

export const FullPageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', flexDirection: 'column', gap: 16
  }}>
    <Spinner size={32} />
    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</span>
  </div>
)
