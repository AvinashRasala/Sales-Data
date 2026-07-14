import Plot from 'react-plotly.js'
import { plotlyLayoutBase, plotlyConfig, COLORS } from '../plotlyTheme'

export default function RevenueTrendChart({ trend, forecast }) {
  if (!trend || trend.length === 0) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>No trend data available.</div>
  }

  const historicalX = trend.map((d) => d.date)
  const historicalY = trend.map((d) => d.revenue)

  const traces = [
    {
      x: historicalX,
      y: historicalY,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual',
      line: { color: COLORS.teal, width: 2 },
      fill: 'tozeroy',
      fillcolor: COLORS.tealDim,
    },
  ]

  if (forecast?.available && forecast.forecast?.length) {
    const fx = forecast.forecast.map((d) => d.date)
    const fy = forecast.forecast.map((d) => d.predicted_revenue)
    const upper = forecast.forecast.map((d) => d.upper_bound)
    const lower = forecast.forecast.map((d) => d.lower_bound)

    traces.push({
      x: [...fx, ...fx.slice().reverse()],
      y: [...upper, ...lower.slice().reverse()],
      type: 'scatter',
      fill: 'toself',
      fillcolor: 'rgba(245,158,11,0.08)',
      line: { color: 'transparent' },
      name: 'Confidence band',
      hoverinfo: 'skip',
      showlegend: false,
    })
    traces.push({
      x: fx,
      y: fy,
      type: 'scatter',
      mode: 'lines',
      name: 'Forecast',
      line: { color: COLORS.amber, width: 2, dash: 'dot' },
    })
  }

  return (
    <Plot
      data={traces}
      layout={{
        ...plotlyLayoutBase,
        height: 280,
        showlegend: true,
      }}
      config={plotlyConfig}
      style={{ width: '100%' }}
      useResizeHandler
    />
  )
}
