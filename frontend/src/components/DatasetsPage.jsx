import { useEffect, useState } from 'react'
import { listDatasets, deleteDataset } from '../api'

export default function DatasetsPage({ onSelect, searchValue }) {
  const [datasets, setDatasets] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listDatasets()
      .then(setDatasets)
      .catch(() => setError('Could not load datasets.'))
  }, [])

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this dataset? This cannot be undone.')) return
    try {
      await deleteDataset(id)
      setDatasets((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert('Could not delete dataset.')
    }
  }

  if (error) return <div style={styles.empty}>{error}</div>
  if (!datasets) return <div style={styles.empty}>Loading…</div>

  const filtered = searchValue
    ? datasets.filter((d) => d.filename.toLowerCase().includes(searchValue.toLowerCase()))
    : datasets

  if (filtered.length === 0) {
    return <div style={styles.empty}>No datasets uploaded yet. Use "Upload New" to get started.</div>
  }

  return (
    <div style={styles.grid}>
      {filtered.map((d) => (
        <div key={d.id} style={styles.card} onClick={() => onSelect(d.id)}>
          <div style={styles.cardTop}>
            <div style={styles.filename}>{d.filename}</div>
            <button onClick={(e) => handleDelete(e, d.id)} style={styles.deleteBtn}>×</button>
          </div>
          <div style={styles.meta}>
            <span>{d.row_count.toLocaleString()} rows</span>
            <span>·</span>
            <span>{d.column_count} columns</span>
          </div>
          <div style={styles.date}>{new Date(d.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
    padding: 24,
  },
  card: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-hairline)',
    borderRadius: 8,
    padding: 18,
    cursor: 'pointer',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  filename: {
    fontSize: 14,
    fontWeight: 600,
    wordBreak: 'break-word',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: 18,
    lineHeight: 1,
    padding: '0 4px',
  },
  meta: {
    display: 'flex',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-tertiary)',
  },
  empty: {
    padding: 60,
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    fontSize: 13,
  },
}
