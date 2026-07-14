import { useEffect, useState } from 'react'
import api from '../api'
import RevenueTrendChart from './RevenueTrendChart'

function formatCurrency(val) {
  if (val === null || val === undefined) return '—'
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

export default function DrillDownModal({ datasetId, type, value, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    api.get(`/dashboard/${datasetId}/drilldown`, { params: { [type]: value } })
      .then((res) => { if (!cancelled) setData(res.data) })
      .catch(() => { if (!cancelled) setError('Could not load detail for this item.') })
    return () => { cancelled = true }
  }, [datasetId, type, value])

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>{type === 'region' ? 'REGION DETAIL' : 'PRODUCT DETAIL'}</div>
            <div style={styles.title}>{value}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {!error && !data && <div style={styles.loading}>Loading…</div>}

        {data && (
          <div style={styles.body}>
            <div style={styles.kpiRow}>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>REVENUE</div>
                <div style={styles.kpiValue}>{formatCurrency(data.kpis.total_revenue)}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>PROFIT</div>
                <div style={styles.kpiValue}>{formatCurrency(data.kpis.total_profit)}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>ORDERS</div>
                <div style={styles.kpiValue}>{data.kpis.row_count?.toLocaleString()}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLabel}>MARGIN</div>
                <div style={styles.kpiValue}>{data.kpis.profit_margin_pct ?? '—'}%</div>
              </div>
            </div>

            <div style={styles.chartWrap}>
              <div style={styles.sectionLabel}>REVENUE TREND</div>
              <RevenueTrendChart trend={data.trend} forecast={null} />
            </div>

            {data.products && (
              <div>
                <div style={styles.sectionLabel}>TOP PRODUCTS IN {value.toUpperCase()}</div>
                {data.products.map((p) => (
                  <div key={p.product} style={styles.listRow}>
                    <span>{p.product}</span>
                    <span style={styles.listValue}>{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}

            {data.regions && (
              <div>
                <div style={styles.sectionLabel}>{value.toUpperCase()} BY REGION</div>
                {data.regions.map((r) => (
                  <div key={r.region} style={styles.listRow}>
                    <span>{r.region}</span>
                    <span style={styles.listValue}>{formatCurrency(r.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(4,8,16,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  modal: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-hairline-bright)',
    borderRadius: 6,
    width: '100%',
    maxWidth: 640,
    maxHeight: '85vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-hairline)',
    position: 'sticky',
    top: 0,
    background: 'var(--bg-panel)',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--accent-teal)',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 24,
    lineHeight: 1,
    cursor: 'pointer',
  },
  loading: {
    padding: 40,
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  },
  error: {
    padding: 24,
    color: 'var(--accent-rose)',
    fontSize: 13,
  },
  body: {
    padding: 24,
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  kpi: {
    background: 'var(--bg-panel-raised)',
    padding: '12px 14px',
    borderRadius: 4,
  },
  kpiLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-tertiary)',
    marginBottom: 6,
  },
  kpiValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 17,
    fontWeight: 600,
  },
  chartWrap: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.06em',
    color: 'var(--text-tertiary)',
    marginBottom: 10,
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(36,48,71,0.5)',
    fontSize: 13,
  },
  listValue: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-teal)',
  },
}
