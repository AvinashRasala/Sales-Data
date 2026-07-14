const SEVERITY_STYLE = {
  critical: { color: 'var(--accent-rose)', glyph: '✕' },
  warning: { color: 'var(--accent-amber)', glyph: '!' },
  positive: { color: 'var(--accent-teal)', glyph: '✓' },
  info: { color: 'var(--text-secondary)', glyph: '·' },
}

const CATEGORY_LABEL = {
  risk: 'RISK',
  opportunity: 'OPPORTUNITY',
  forecast: 'FORECAST',
  inventory: 'INVENTORY',
  system: 'SYSTEM',
}

export default function InsightFeed({ insights, loading, onRefresh }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.feedHeader}>
        <span style={styles.liveDot} />
        <span style={styles.feedLabel}>AI ANALYST FEED</span>
        <button onClick={onRefresh} disabled={loading} style={styles.refreshBtn}>
          {loading ? 'thinking…' : 'regenerate'}
        </button>
      </div>

      <div style={styles.feed}>
        {loading && (
          <div style={styles.loadingLine}>
            <span style={styles.cursor}>▋</span> analyzing dataset…
          </div>
        )}
        {!loading && insights.length === 0 && (
          <div style={styles.emptyLine}>No insights yet. Click regenerate.</div>
        )}
        {!loading && insights.map((ins, i) => {
          const sev = SEVERITY_STYLE[ins.severity] || SEVERITY_STYLE.info
          return (
            <div key={i} style={styles.line}>
              <span style={{ ...styles.glyph, color: sev.color, borderColor: sev.color }}>{sev.glyph}</span>
              <div style={styles.lineBody}>
                <span style={{ ...styles.category, color: sev.color }}>
                  {CATEGORY_LABEL[ins.category] || ins.category?.toUpperCase()}
                </span>
                <span style={styles.text}>{ins.text}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    background: '#070C16',
    border: '1px solid var(--border-hairline)',
    fontFamily: 'var(--font-mono)',
  },
  feedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-hairline)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--accent-teal)',
    boxShadow: '0 0 8px var(--accent-teal)',
  },
  feedLabel: {
    fontSize: 11,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
    flex: 1,
  },
  refreshBtn: {
    background: 'transparent',
    border: '1px solid var(--border-hairline-bright)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 2,
    fontFamily: 'var(--font-mono)',
  },
  feed: {
    padding: '4px 0',
    maxHeight: 420,
    overflowY: 'auto',
  },
  line: {
    display: 'flex',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(36,48,71,0.5)',
    alignItems: 'flex-start',
  },
  glyph: {
    width: 18,
    height: 18,
    minWidth: 18,
    border: '1px solid',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    marginTop: 1,
  },
  lineBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  category: {
    fontSize: 10,
    letterSpacing: '0.08em',
  },
  text: {
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    fontFamily: 'var(--font-display)',
  },
  loadingLine: {
    padding: '14px 16px',
    color: 'var(--text-tertiary)',
    fontSize: 13,
  },
  cursor: {
    color: 'var(--accent-teal)',
  },
  emptyLine: {
    padding: '14px 16px',
    color: 'var(--text-tertiary)',
    fontSize: 13,
  },
}
