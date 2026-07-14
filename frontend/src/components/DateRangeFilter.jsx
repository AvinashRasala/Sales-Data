const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: null },
]

export default function DateRangeFilter({ selected, onChange }) {
  return (
    <div style={styles.wrap}>
      {RANGES.map((r) => (
        <button
          key={r.label}
          onClick={() => onChange(r.days)}
          style={{
            ...styles.btn,
            ...(selected === r.days ? styles.btnActive : {}),
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    gap: 4,
  },
  btn: {
    background: 'transparent',
    border: '1px solid var(--border-hairline-bright)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 3,
  },
  btnActive: {
    background: 'var(--accent-teal)',
    borderColor: 'var(--accent-teal)',
    color: '#04140f',
    fontWeight: 600,
  },
}
