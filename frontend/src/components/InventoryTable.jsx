export default function InventoryTable({ inventory }) {
  if (!inventory || inventory.length === 0) {
    return <div style={styles.empty}>No inventory signal detected in this dataset.</div>
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>PRODUCT</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>DAILY VELOCITY</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>DAYS REMAINING</th>
        </tr>
      </thead>
      <tbody>
        {inventory.slice(0, 8).map((item) => {
          const days = item.estimated_days_remaining
          const color = days == null ? 'var(--text-secondary)'
            : days < 7 ? 'var(--accent-rose)'
            : days < 21 ? 'var(--accent-amber)'
            : 'var(--accent-teal)'
          return (
            <tr key={item.product} style={styles.tr}>
              <td style={styles.td}>{item.product}</td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {item.avg_daily_units_sold} u/day
              </td>
              <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'var(--font-mono)', color, fontWeight: 600 }}>
                {days != null ? `${days.toFixed(0)}d` : '—'}
                {item.stock_assumed && <span style={styles.assumedFlag}>*</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
      {inventory.some((i) => i.stock_assumed) && (
        <tfoot>
          <tr>
            <td colSpan={3} style={styles.footnote}>
              * starting stock assumed (30 days of run-rate) — connect real inventory levels for precise runway
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.06em',
    color: 'var(--text-tertiary)',
    padding: '0 0 10px',
    borderBottom: '1px solid var(--border-hairline)',
  },
  tr: {
    borderBottom: '1px solid rgba(36,48,71,0.5)',
  },
  td: {
    padding: '10px 0',
    color: 'var(--text-primary)',
  },
  assumedFlag: {
    color: 'var(--text-tertiary)',
    marginLeft: 2,
  },
  footnote: {
    paddingTop: 10,
    fontSize: 11,
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
  },
  empty: {
    color: 'var(--text-tertiary)',
    fontSize: 13,
    padding: '8px 0',
  },
}
