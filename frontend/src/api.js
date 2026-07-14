import axios from 'axios'
import { supabase, isSupabaseConfigured } from './supabaseClient'

// Two different deployment shapes need two different mechanisms here:
//
// Docker-based (Render, Railway, docker-compose): nginx proxies /api to
// BACKEND_URL at container STARTUP (see frontend/nginx.conf.template).
// Leave VITE_API_URL unset in these cases — Render's Docker build in
// particular has no field for passing build-time arguments through
// render.yaml, so a Vite env var can't be baked in there anyway.
//
// Non-Docker static builds (Vercel): there's no nginx or Dockerfile in
// play — Vercel runs `npm run build` directly, and Vite bakes
// VITE_API_URL in normally at that point like any other Vite project.
// Set it to the backend's full origin (e.g. https://my-backend.onrender.com)
// in Vercel's project environment variables.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

// Attaches the current Supabase session's access token to every request,
// read fresh each time (not cached at import time) so it stays correct
// across login/logout/token refresh without needing to rebuild the client.
api.interceptors.request.use(async (config) => {
  try {
    if (isSupabaseConfigured) {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch {
    // Auth not configured or unavailable — proceed without a token; the
    // backend treats unauthenticated requests as local-dev/ownerless data.
  }
  return config
})

export async function uploadFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    },
  })
  return res.data
}

export async function listDatasets() {
  const res = await api.get('/datasets')
  return res.data
}

export async function getDataset(id) {
  const res = await api.get(`/datasets/${id}`)
  return res.data
}

export async function deleteDataset(id) {
  const res = await api.delete(`/datasets/${id}`)
  return res.data
}

export async function getFullDashboard(datasetId) {
  const res = await api.get(`/dashboard/${datasetId}/full`)
  return res.data
}

export async function getRevenueForecast(datasetId, horizonDays = 30) {
  const res = await api.get(`/forecast/${datasetId}/revenue`, {
    params: { horizon_days: horizonDays },
  })
  return res.data
}

export async function getInventoryRunway(datasetId) {
  const res = await api.get(`/forecast/${datasetId}/inventory`)
  return res.data
}

export async function getInsights(datasetId) {
  const res = await api.get(`/insights/${datasetId}`)
  return res.data
}

export default api
