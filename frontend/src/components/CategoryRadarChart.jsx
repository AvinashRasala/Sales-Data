import Plot from 'react-plotly.js'
import { plotlyConfig, COLORS } from '../plotlyTheme'

export default function CategoryRadarChart({ categories }) {
  if (!categories || categories.length < 3) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Need at least 3 categories for this view.</div>
  }

  const labels = categories.map((c) => c.category)
  const values = categories.map((c) => c.revenue)
  const closedLabels = [...labels, labels[0]]
  const closedValues = [...values, values[0]]

  return (
    <Plot
      data={[{
        type: 'scatterpolar',
        r: closedValues,
        theta: closedLabels,
        fill: 'toself',
        fillcolor: 'rgba(124,111,239,0.25)',
        line: { color: COLORS.amber, width: 2 },
        marker: { color: COLORS.amber, size: 5 },
      }]}
      layout={{
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'JetBrains Mono, monospace', color: '#8A94A6', size: 10 },
        polar: {
          bgcolor: 'transparent',
          radialaxis: {
            visible: true,
            gridcolor: '#243047',
            linecolor: '#243047',
            tickfont: { color: '#5B6478', size: 9 },
          },
          angularaxis: {
            gridcolor: '#243047',
            linecolor: '#243047',
            tickfont: { color: '#8A94A6', size: 10 },
          },
        },
        showlegend: false,
        margin: { l: 40, r: 40, t: 20, b: 20 },
        height: 280,
      }}
      config={plotlyConfig}
      style={{ width: '100%' }}
      useResizeHandler
    />
  )
}
