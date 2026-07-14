import { useState, useRef, useCallback } from 'react'
import { uploadFile } from '../api'

export default function UploadScreen({ onUploaded }) {
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)
  const inputRef = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Use a .csv or .xlsx file.')
      return
    }
    setError(null)
    setFileName(file.name)
    setProgress(0)
    try {
      const result = await uploadFile(file, setProgress)
      setProgress(null)
      onUploaded(result)
    } catch (e) {
      setProgress(null)
      const detail = e?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Upload failed. Check the file and try again.')
    }
  }, [onUploaded])

  return (
    <div style={styles.wrap}>
      <div style={styles.eyebrow}>PULSE · AI BUSINESS INTELLIGENCE</div>
      <h1 style={styles.title}>Drop in a sales file.<br />Get a live read on the business.</h1>
      <p style={styles.subtitle}>
        Cleans messy data, builds the dashboard, forecasts what's next — automatically.
      </p>

      <div
        style={{
          ...styles.dropzone,
          borderColor: dragActive ? 'var(--accent-teal)' : 'var(--border-hairline-bright)',
          background: dragActive ? 'rgba(20,184,166,0.06)' : 'var(--bg-panel)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {progress === null ? (
          <>
            <div style={styles.dropIcon}>↑</div>
            <div style={styles.dropTitle}>Drag a file here, or click to browse</div>
            <div style={styles.dropHint}>CSV or Excel · up to 25MB</div>
          </>
        ) : (
          <>
            <div style={styles.dropTitle}>Uploading {fileName}…</div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <div style={styles.dropHint}>{progress}%</div>
          </>
        )}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.pipeline}>
        {['Clean', 'Analyze', 'Forecast', 'Recommend'].map((step, i) => (
          <div key={step} style={styles.pipelineStep}>
            <span style={styles.pipelineIndex}>{String(i + 1).padStart(2, '0')}</span>
            <span>{step}</span>
            {i < 3 && <span style={styles.pipelineArrow}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '48px 24px 48px',
    textAlign: 'center',
    position: 'relative',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.12em',
    color: 'var(--accent-teal)',
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    lineHeight: 1.15,
    fontWeight: 700,
    margin: '0 0 16px',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 16,
    margin: '0 0 48px',
    lineHeight: 1.5,
  },
  dropzone: {
    border: '1.5px dashed var(--border-hairline-bright)',
    borderRadius: 4,
    padding: '56px 24px',
    cursor: 'pointer',
    transition: 'border-color 120ms, background 120ms',
  },
  dropIcon: {
    fontFamily: 'var(--font-mono)',
    fontSize: 28,
    color: 'var(--accent-teal)',
    marginBottom: 12,
  },
  dropTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 6,
  },
  dropHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-tertiary)',
  },
  progressTrack: {
    height: 4,
    background: 'var(--border-hairline)',
    borderRadius: 2,
    margin: '16px auto',
    maxWidth: 280,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent-teal)',
    transition: 'width 150ms ease',
  },
  errorBox: {
    marginTop: 16,
    padding: '12px 16px',
    background: 'rgba(244,63,94,0.08)',
    border: '1px solid var(--accent-rose-dim)',
    borderRadius: 4,
    color: 'var(--accent-rose)',
    fontSize: 14,
    textAlign: 'left',
  },
  pipeline: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 56,
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text-tertiary)',
    flexWrap: 'wrap',
  },
  pipelineStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pipelineIndex: {
    color: 'var(--accent-amber)',
  },
  pipelineArrow: {
    marginLeft: 12,
    color: 'var(--border-hairline-bright)',
  },
}
