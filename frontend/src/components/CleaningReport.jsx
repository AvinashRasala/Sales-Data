export default function CleaningReport({ report }) {
  if (!report) return null

  const facts = [
    { label: 'Rows ingested', value: report.original_rows },
    { label: 'Duplicates removed', value: report.duplicates_removed },
    { label: 'Anomalies flagged', value: report.anomalies_detected },
    { label: 'Final clean rows', value: report.final_rows },
  ]

  const missingEntries = Object.entries(report.missing_values_filled || {})

  return (
    <div style={styles.wrap}>
      <div style={styles.factRow}>
        {facts.map((f) => (
          <div key={f.label} style={styles.fact}>
            <span style={styles.factValue}>{f.value}</span>
            <span style={styles.factLabel}>{f.label}</span>
          </div>
        ))}
      </div>

      {missingEntries.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>MISSING VALUES HANDLED</div>
          {missingEntries.map(([col, info]) => (
            <div key={col} style={styles.detailLine}>
              <span style={{ color: 'var(--accent-amber)' }}>{col}</span>
              <span style={styles.detailText}>
                {info.count} filled via {info.strategy.replace('_', ' ')}
                {info.value !== undefined ? ` (${info.value})` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {report.warnings?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>NOTES</div>
          {report.warnings.map((w, i) => (
            <div key={i} style={styles.warningLine}>{w}</div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    fontSize: 13,
  },
  factRow: {
    display: 'flex',
    gap: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  fact: {
    display: 'flex',
    flexDirection: 'column',
  },
  factValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--accent-teal)',
  },
  factLabel: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    marginTop: 2,
  },
  section: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: '1px solid var(--border-hairline)',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--text-tertiary)',
    marginBottom: 8,
  },
  detailLine: {
    display: 'flex',
    gap: 8,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    marginBottom: 4,
    color: 'var(--text-secondary)',
  },
  detailText: {
    color: 'var(--text-secondary)',
  },
  warningLine: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    lineHeight: 1.5,
  },
}
