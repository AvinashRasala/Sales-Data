FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# nginx's official image auto-processes /etc/nginx/templates/*.template
# through envsubst into /etc/nginx/conf.d/ at container startup — this is
# a built-in feature, not custom code. BACKEND_URL is resolved at runtime
# this way because Render's Docker build doesn't support passing build-time
# arguments through render.yaml, so baking it in during `npm run build`
# (the old approach) isn't an option there.
#
# NGINX_ENVSUBST_FILTER restricts substitution to just $BACKEND_URL —
# without it, envsubst would also try to replace nginx's own $host and
# $remote_addr variables in the config, since they look like the same
# shell-variable syntax.
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL
ENV BACKEND_URL=http://backend:8000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Generates /usr/share/nginx/html/config.js from SUPABASE_URL /
# SUPABASE_PUBLISHABLE_KEY at container startup — see the script's own
# comments for why this mirrors the BACKEND_URL approach above rather than
# using Vite build-time env vars.
COPY 40-generate-runtime-config.sh /docker-entrypoint.d/40-generate-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-generate-runtime-config.sh

EXPOSE 80
