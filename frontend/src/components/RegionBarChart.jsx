import Plot from 'react-plotly.js'
import { plotlyLayoutBase, plotlyConfig, COLORS } from '../plotlyTheme'

export default function RegionBarChart({ regions, onBarClick }) {
  const sorted = [...regions].sort((a, b) => a.revenue - b.revenue)
  const colors = sorted.map((r) =>
    r.region === 'Unknown' ? '#5B6478' : COLORS.teal
  )

  return (
    <Plot
      data={[{
        x: sorted.map((r) => r.revenue),
        y: sorted.map((r) => r.region),
        type: 'bar',
        orientation: 'h',
        marker: { color: colors },
        hovertemplate: '%{y}: $%{x:,.0f}<br>click to drill in<extra></extra>',
      }]}
      layout={{
        ...plotlyLayoutBase,
        height: Math.max(180, sorted.length * 40),
        showlegend: false,
        margin: { l: 90, r: 16, t: 8, b: 36 },
        xaxis: { ...plotlyLayoutBase.xaxis, type: 'linear' },
        yaxis: { ...plotlyLayoutBase.yaxis, type: 'category' },
      }}
      config={plotlyConfig}
      style={{ width: '100%', cursor: onBarClick ? 'pointer' : 'default' }}
      useResizeHandler
      onClick={(e) => {
        const point = e.points?.[0]
        if (point && onBarClick && point.y !== 'Unknown') onBarClick(point.y)
      }}
    />
  )
}
