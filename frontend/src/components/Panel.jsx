export default function Panel({ title, eyebrow, children, span, headerExtra }) {
  return (
    <div style={{ ...styles.panel, gridColumn: span ? `span ${span}` : undefined }}>
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <div>
            {eyebrow && <div style={styles.eyebrow}>{eyebrow}</div>}
            <div style={styles.title}>{title}</div>
          </div>
          {headerExtra}
        </div>
      </div>
      <div style={styles.body}>{children}</div>
    </div>
  )
}

const styles = {
  panel: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-hairline)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-hairline)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.1em',
    color: 'var(--accent-teal)',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  body: {
    padding: 16,
    flex: 1,
  },
}
