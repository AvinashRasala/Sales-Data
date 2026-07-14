import Sparkline from './Sparkline'

function formatCurrency(val) {
  if (val === null || val === undefined) return '—'
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

function formatNumber(val) {
  if (val === null || val === undefined) return '—'
  return val.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function KpiCards({ kpis, trend }) {
  if (!kpis) return null

  const change = kpis.revenue_change_pct_30d
  const changeColor = change == null ? 'var(--text-tertiary)'
    : change >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)'
  const changeSign = change == null ? '' : change >= 0 ? '▲' : '▼'
  const sparklineColor = change == null ? 'var(--accent-blue)' : change >= 0 ? 'var(--accent-teal)' : 'var(--accent-rose)'

  const cards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(kpis.total_revenue),
      sub: change != null ? (
        <span style={{ color: changeColor }}>{changeSign} {Math.abs(change)}% vs prior 30d</span>
      ) : null,
      sparkline: trend && trend.length > 1 ? <Sparkline data={trend} color={sparklineColor} /> : null,
      accentBar: 'var(--accent-blue)',
    },
    {
      label: 'Total Profit',
      value: formatCurrency(kpis.total_profit),
      sub: kpis.profit_margin_pct != null ? `${kpis.profit_margin_pct}% margin` : null,
      accentBar: 'var(--accent-purple)',
    },
    {
      label: 'Units Sold',
      value: formatNumber(kpis.total_units_sold),
      sub: `${formatNumber(kpis.row_count)} transactions`,
      accentBar: 'var(--accent-teal)',
    },
    {
      label: 'Anomalies Flagged',
      value: formatNumber(kpis.anomaly_count),
      sub: kpis.anomaly_count > 0 ? 'review recommended' : 'none detected',
      valueColor: kpis.anomaly_count > 0 ? 'var(--accent-amber)' : 'var(--text-primary)',
      accentBar: kpis.anomaly_count > 0 ? 'var(--accent-amber)' : 'var(--accent-teal)',
    },
  ]

  return (
    <div style={styles.grid}>
      {cards.map((c) => (
        <div key={c.label} style={styles.card}>
          <div style={{ ...styles.accentBar, background: c.accentBar }} />
          <div style={styles.cardBody}>
            <div style={styles.left}>
              <div style={{ ...styles.value, color: c.valueColor || 'var(--text-primary)' }}>{c.value}</div>
              <div style={styles.label}>{c.label}</div>
              {c.sub && <div style={styles.sub}>{c.sub}</div>}
            </div>
            {c.sparkline && <div style={styles.sparklineWrap}>{c.sparkline}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  card: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-hairline)',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    minHeight: 100,
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    gap: 12,
  },
  left: {
    minWidth: 0,
  },
  value: {
    fontFamily: 'var(--font-mono)',
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4,
  },
  sub: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
  },
  sparklineWrap: {
    flexShrink: 0,
    opacity: 0.9,
  },
}
