export const plotlyLayoutBase = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {
    family: 'JetBrains Mono, monospace',
    color: '#8A94A6',
    size: 11,
  },
  margin: { l: 48, r: 16, t: 8, b: 36 },
  xaxis: {
    gridcolor: '#243047',
    linecolor: '#243047',
    zerolinecolor: '#243047',
    tickfont: { color: '#5B6478' },
  },
  yaxis: {
    gridcolor: '#243047',
    linecolor: '#243047',
    zerolinecolor: '#243047',
    tickfont: { color: '#5B6478' },
  },
  legend: {
    font: { color: '#8A94A6' },
    orientation: 'h',
    y: -0.25,
  },
  hoverlabel: {
    bgcolor: '#16213B',
    bordercolor: '#34415E',
    font: { color: '#E8EAED', family: 'JetBrains Mono, monospace' },
  },
}

export const plotlyConfig = {
  displayModeBar: false,
  responsive: true,
}

export const COLORS = {
  teal: '#14B8A6',
  amber: '#F59E0B',
  rose: '#F43F5E',
  tealDim: 'rgba(20,184,166,0.15)',
}
