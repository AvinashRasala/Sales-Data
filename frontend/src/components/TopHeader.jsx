export default function TopHeader({ title, breadcrumb, anomalyCount, searchValue, onSearchChange }) {
  const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={styles.header}>
      <div>
        <div style={styles.title}>{title}</div>
        {breadcrumb && <div style={styles.breadcrumb}>{breadcrumb}</div>}
      </div>

      <div style={styles.right}>
        {onSearchChange && (
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search datasets…"
            style={styles.search}
          />
        )}

        <div style={styles.dateChip}>{today}</div>

        <div style={styles.iconBtn}>
          🔔
          {anomalyCount > 0 && <span style={styles.badge}>{anomalyCount > 9 ? '9+' : anomalyCount}</span>}
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: {
    height: 'var(--header-height)',
    minHeight: 'var(--header-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    borderBottom: '1px solid var(--border-hairline)',
    background: 'var(--bg-panel)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
  },
  breadcrumb: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    marginTop: 2,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  search: {
    background: 'var(--bg-panel-raised)',
    border: '1px solid var(--border-hairline-bright)',
    borderRadius: 6,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: 13,
    width: 200,
    outline: 'none',
  },
  dateChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-hairline-bright)',
    borderRadius: 6,
    padding: '6px 12px',
  },
  iconBtn: {
    position: 'relative',
    fontSize: 16,
    cursor: 'default',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    background: 'var(--accent-rose)',
    color: 'white',
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 8,
    padding: '1px 5px',
    lineHeight: 1.4,
  },
}
