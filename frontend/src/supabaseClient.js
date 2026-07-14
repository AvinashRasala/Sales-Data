import { createClient } from '@supabase/supabase-js'

// Two sources, in priority order:
// 1. window.__ENV__ — injected at container STARTUP by
//    40-generate-runtime-config.sh (Docker/Render). See that script's
//    comments for why this can't just be a Vite build-time env var there.
// 2. import.meta.env.VITE_* — local `npm run dev` only, from frontend/.env
const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ : null

export const SUPABASE_URL =
  (runtimeEnv && runtimeEnv.SUPABASE_URL) || import.meta.env.VITE_SUPABASE_URL || ''

export const SUPABASE_PUBLISHABLE_KEY =
  (runtimeEnv && runtimeEnv.SUPABASE_PUBLISHABLE_KEY) ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

// Only construct a real client if configured — avoids a confusing runtime
// crash from supabase-js if someone hasn't set these up yet, in favor of
// a clear "auth not configured" state the UI can show instead.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null
