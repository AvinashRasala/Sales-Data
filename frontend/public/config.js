// Placeholder for local `npm run dev`. In Docker/Render, this file is
// overwritten at container STARTUP by 40-generate-runtime-config.sh with
// real values from SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY env vars.
// For local dev, supabaseClient.js falls back to VITE_SUPABASE_URL /
// VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env instead — see that file.
window.__ENV__ = {
  SUPABASE_URL: "",
  SUPABASE_PUBLISHABLE_KEY: ""
};
