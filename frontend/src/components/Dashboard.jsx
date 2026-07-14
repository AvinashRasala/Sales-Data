import { useEffect, useState, useCallback } from 'react'
import { getFullDashboard, getRevenueForecast, getInventoryRunway, getInsights } from '../api'
import KpiCards from './KpiCards'
import Panel from './Panel'
import RevenueTrendChart from './RevenueTrendChart'
import RegionBarChart from './RegionBarChart'
import ProductBarChart from './ProductBarChart'
import CategoryRadarChart from './CategoryRadarChart'
import InsightFeed from './InsightFeed'
import InventoryTable from './InventoryTable'
import CleaningReport from './CleaningReport'
import DateRangeFilter from './DateRangeFilter'
import DrillDownModal from './DrillDownModal'
import { DashboardSkeleton } from './Skeleton'

const AUTO_REFRESH_MS = 60_000

function filterTrendByDays(trend, days) {
  if (!days || !trend) return trend
  return trend.slice(-days)
}

function useElapsedLabel(lastUpdated) {
  const [, forceTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  if (!lastUpdated) return ''
  const secs = Math.floor((Date.now() - lastUpdated) / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  return `${mins}m ago`
}

export default function Dashboard({ dataset, onReset }) {
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [insights, setInsights] = useState([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rangeDays, setRangeDays] = useState(null)
  const [drillDown, setDrillDown] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const elapsedLabel = useElapsedLabel(lastUpdated)

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      const res = await getInsights(dataset.dataset_id)
      setInsights(res.insights || [])
    } catch (e) {
      setInsights([{ category: 'system', severity: 'critical', text: 'Could not generate insights right now.' }])
    } finally {
      setInsightsLoading(false)
    }
  }, [dataset.dataset_id])

  const load = useCallback(async ({ silent } = {}) => {
    try {
      const [full, fc, inv] = await Promise.all([
        getFullDashboard(dataset.dataset_id),
        getRevenueForecast(dataset.dataset_id, 30),
        getInventoryRunway(dataset.dataset_id),
      ])
      setData(full)
      setForecast(fc)
      setInventory(inv)
      setLastUpdated(Date.now())
      setError(null)
    } catch (e) {
      if (!silent) setError('Could not load dashboard data.')
    }
  }, [dataset.dataset_id])

  useEffect(() => {
    load()
    loadInsights()
  }, [dataset.dataset_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load({ silent: true })
      }
    }, AUTO_REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  if (error) {
    return <div style={styles.errorWrap}>{error}</div>
  }

  if (!data) {
    return <DashboardSkeleton />
  }

  const filteredTrend = filterTrendByDays(data.trend, rangeDays)

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.liveIndicator}>
          <span style={styles.liveDot} />
          <span>updated {elapsedLabel}</span>
        </div>
        <button onClick={onReset} style={styles.newUploadBtn}>+ new dataset</button>
      </div>

      <KpiCards kpis={data.kpis} trend={data.trend} />

      <div style={styles.grid}>
        <Panel
          title="Revenue trend & 30-day forecast"
          eyebrow="TIME SERIES"
          span={2}
          headerExtra={<DateRangeFilter selected={rangeDays} onChange={setRangeDays} />}
        >
          <RevenueTrendChart trend={filteredTrend} forecast={rangeDays ? null : forecast} />
        </Panel>

        <Panel title="AI insights" eyebrow="GENERATED">
          <InsightFeed insights={insights} loading={insightsLoading} onRefresh={loadInsights} />
        </Panel>

        <Panel title="Revenue by region" eyebrow="BREAKDOWN · CLICK TO DRILL IN">
          {data.regions.length > 0
            ? <RegionBarChart regions={data.regions} onBarClick={(region) => setDrillDown({ type: 'region', value: region })} />
            : <div style={styles.noData}>No region column detected.</div>}
        </Panel>

        <Panel title="Top products" eyebrow="BREAKDOWN · CLICK TO DRILL IN">
          {data.products.length > 0
            ? <ProductBarChart products={data.products} onBarClick={(product) => setDrillDown({ type: 'product', value: product })} />
            : <div style={styles.noData}>No product column detected.</div>}
        </Panel>

        <Panel title="Category mix" eyebrow="BREAKDOWN">
          <CategoryRadarChart categories={data.categories} />
        </Panel>

        <Panel title="Inventory runway" eyebrow="ESTIMATE">
          <InventoryTable inventory={inventory} />
        </Panel>

        <Panel title="Data cleaning report" eyebrow="PIPELINE" span={3}>
          <CleaningReport report={dataset.cleaning_report} />
        </Panel>
      </div>

      {drillDown && (
        <DrillDownModal
          datasetId={dataset.dataset_id}
          type={drillDown.type}
          value={drillDown.value}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  )
}

const styles = {
  page: {
    padding: '20px 24px 64px',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-tertiary)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent-teal)',
    boxShadow: '0 0 6px var(--accent-teal)',
  },
  newUploadBtn: {
    background: 'transparent',
    border: '1px solid var(--border-hairline-bright)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    padding: '8px 14px',
    borderRadius: 6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginTop: 16,
  },
  noData: {
    color: 'var(--text-tertiary)',
    fontSize: 13,
    padding: '24px 0',
    textAlign: 'center',
  },
  errorWrap: {
    textAlign: 'center',
    padding: '120px 24px',
    color: 'var(--accent-rose)',
  },
}
