import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthScreen() {
  const { signIn, signUp, resendVerification, isSupabaseConfigured } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  if (!isSupabaseConfigured) {
    return (
      <div style={styles.wrap}>
        <div style={styles.eyebrow}>PULSE · AI BUSINESS INTELLIGENCE</div>
        <h1 style={styles.title}>Auth isn't configured yet</h1>
        <p style={styles.subtitle}>
          Set <code style={styles.code}>SUPABASE_URL</code> and{' '}
          <code style={styles.code}>SUPABASE_PUBLISHABLE_KEY</code> (see the README) to enable
          login. Until then, there's nothing to sign in to.
        </p>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('Check your email for a confirmation link before logging in.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError(null)
    setMessage(null)
    try {
      await resendVerification(email)
      setMessage('Verification email resent.')
    } catch (err) {
      setError(err.message || 'Could not resend verification email.')
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.eyebrow}>PULSE · AI BUSINESS INTELLIGENCE</div>
      <h1 style={styles.title}>{mode === 'login' ? 'Welcome back.' : 'Create an account.'}</h1>
      <p style={styles.subtitle}>
        {mode === 'login' ? 'Sign in to see your datasets.' : 'Takes about 10 seconds.'}
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>EMAIL</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          placeholder="you@company.com"
        />

        <label style={styles.label}>PASSWORD</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          placeholder="At least 8 characters"
        />

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      {error && <div style={styles.errorBox}>{error}</div>}
      {message && (
        <div style={styles.messageBox}>
          {message}
          {mode === 'register' && (
            <div>
              <button onClick={handleResend} style={styles.linkBtn}>
                Resend email
              </button>
            </div>
          )}
        </div>
      )}

      <div style={styles.switchRow}>
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <button onClick={() => { setMode('register'); setError(null); setMessage(null) }} style={styles.linkBtn}>
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button onClick={() => { setMode('login'); setError(null); setMessage(null) }} style={styles.linkBtn}>
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 420,
    margin: '0 auto',
    padding: '96px 24px 48px',
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.12em',
    color: 'var(--accent-teal)',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 700,
    margin: '0 0 8px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    margin: '0 0 32px',
    lineHeight: 1.5,
  },
  code: {
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-panel-raised)',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: 12,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textAlign: 'left',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--text-tertiary)',
    marginTop: 12,
  },
  input: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-hairline-bright)',
    borderRadius: 4,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-display)',
    outline: 'none',
  },
  submitBtn: {
    marginTop: 24,
    background: 'var(--accent-teal)',
    border: 'none',
    borderRadius: 4,
    padding: '12px 20px',
    color: '#04140f',
    fontWeight: 600,
    fontSize: 14,
  },
  errorBox: {
    marginTop: 20,
    padding: '12px 16px',
    background: 'rgba(244,63,94,0.08)',
    border: '1px solid var(--accent-rose-dim)',
    borderRadius: 4,
    color: 'var(--accent-rose)',
    fontSize: 13,
    textAlign: 'left',
  },
  messageBox: {
    marginTop: 20,
    padding: '12px 16px',
    background: 'rgba(20,184,166,0.08)',
    border: '1px solid var(--accent-teal-dim)',
    borderRadius: 4,
    color: 'var(--accent-teal)',
    fontSize: 13,
    textAlign: 'left',
  },
  switchRow: {
    marginTop: 24,
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-teal)',
    fontSize: 13,
    padding: 0,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}
