export function SkeletonBlock({ width = '100%', height = 16, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 4,
        background: 'linear-gradient(90deg, var(--bg-panel-raised) 25%, var(--border-hairline-bright) 50%, var(--bg-panel-raised) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 24px 64px' }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <SkeletonBlock width={160} height={28} />
        <SkeletonBlock width={100} height={32} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border-hairline)', border: '1px solid var(--border-hairline)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: 'var(--bg-panel)', padding: '20px 24px' }}>
            <SkeletonBlock width="60%" height={11} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="80%" height={28} style={{ marginBottom: 8 }} />
            <SkeletonBlock width="40%" height={12} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
        <div style={{ gridColumn: 'span 2', background: 'var(--bg-panel)', border: '1px solid var(--border-hairline)', padding: 20 }}>
          <SkeletonBlock width={200} height={14} style={{ marginBottom: 20 }} />
          <SkeletonBlock width="100%" height={220} />
        </div>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-hairline)', padding: 20 }}>
          <SkeletonBlock width={140} height={14} style={{ marginBottom: 20 }} />
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} width="100%" height={48} style={{ marginBottom: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
