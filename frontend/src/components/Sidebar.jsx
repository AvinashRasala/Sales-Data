const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '◧' },
  { key: 'datasets', label: 'Datasets', icon: '☰' },
  { key: 'upload', label: 'Upload New', icon: '↑' },
]

export default function Sidebar({ active, onNavigate, user, onSignOut }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>P</div>
        <span style={styles.brandName}>Pulse</span>
      </div>

      <div style={styles.sectionLabel}>MAIN MENU</div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              ...styles.navItem,
              ...(active === item.key ? styles.navItemActive : {}),
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={styles.spacer} />

      {user && (
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>{user.email?.[0]?.toUpperCase() ?? '?'}</div>
          <div style={styles.userInfo}>
            <div style={styles.userEmail}>{user.email}</div>
            <button onClick={onSignOut} style={styles.signOutLink}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    background: 'var(--bg-panel)',
    borderRight: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 8px 24px',
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'var(--accent-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    color: 'white',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--text-tertiary)',
    padding: '0 8px 8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 6,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 13,
    textAlign: 'left',
  },
  navItemActive: {
    background: 'var(--accent-blue-dim)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  navIcon: {
    width: 16,
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.85,
  },
  spacer: {
    flex: 1,
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 8px',
    borderTop: '1px solid var(--border-hairline)',
    marginTop: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: '50%',
    background: 'var(--accent-purple)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    color: 'white',
  },
  userInfo: {
    overflow: 'hidden',
  },
  userEmail: {
    fontSize: 12,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  signOutLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: 11,
    padding: 0,
    textDecoration: 'underline',
  },
}
