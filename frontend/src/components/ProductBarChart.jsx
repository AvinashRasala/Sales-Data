import Plot from 'react-plotly.js'
import { plotlyLayoutBase, plotlyConfig, COLORS } from '../plotlyTheme'

export default function ProductBarChart({ products, onBarClick }) {
  const sorted = [...products].sort((a, b) => a.revenue - b.revenue)

  return (
    <Plot
      data={[{
        x: sorted.map((p) => p.revenue),
        y: sorted.map((p) => p.product),
        type: 'bar',
        orientation: 'h',
        marker: { color: COLORS.amber },
        hovertemplate: '%{y}: $%{x:,.0f}<br>click to drill in<extra></extra>',
      }]}
      layout={{
        ...plotlyLayoutBase,
        height: Math.max(180, sorted.length * 36),
        showlegend: false,
        margin: { l: 110, r: 16, t: 8, b: 36 },
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
