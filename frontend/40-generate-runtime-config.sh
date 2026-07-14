#!/bin/sh
# Runs automatically at container startup (nginx's official image executes
# every *.sh in /docker-entrypoint.d/ before nginx starts, in filename
# order — this one is numbered 40 to run after nginx's own built-in
# scripts, matching the existing convention).
#
# Generates a small runtime config file so the frontend can read
# SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY from actual container env vars
# at startup, instead of needing them baked in by Vite at build time.
# Render's Docker build has no field for passing build-time arguments
# through render.yaml (same root cause as the BACKEND_URL/nginx fix), so
# this mirrors that same runtime-injection approach for consistency.
#
# These are PUBLISHABLE keys, safe to expose in client-side JS — this is
# not a secret-handling shortcut, it's the same trust boundary Supabase
# itself designs for (the publishable key is meant to be public).
set -e

: "${SUPABASE_URL:=}"
: "${SUPABASE_PUBLISHABLE_KEY:=}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_PUBLISHABLE_KEY: "${SUPABASE_PUBLISHABLE_KEY}"
};
EOF
