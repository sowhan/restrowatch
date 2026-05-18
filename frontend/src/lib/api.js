import axios from 'axios'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken = null

supabase.auth.getSession().then(({ data }) => {
  accessToken = data.session?.access_token || null
})

supabase.auth.onAuthStateChange((_event, session) => {
  accessToken = session?.access_token || null
})

api.interceptors.request.use(async (config) => {
  try {
    if (!accessToken) {
      const { data } = await supabase.auth.getSession()
      accessToken = data.session?.access_token || null
    }
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
  } catch {
    // No session, continue without auth
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      supabase.auth.signOut()
    }
    return Promise.reject(error)
  }
)

export const reviewsApi = {
  list: (params = {}) => api.get('/reviews', { params }),
  get: (id) => api.get(`/reviews/${id}`),
  updateStatus: (id, status) => api.patch(`/reviews/${id}/status?status=${status}`),
  logAction: (id, action) => api.post(`/reviews/${id}/actions`, action),
  getTimeline: (id) => api.get(`/reviews/${id}/timeline`),
}

export const settingsApi = {
  getRestaurants: () => api.get('/restaurants'),
  getOverview: () => api.get('/dashboard/overview'),
  getUnmatchedEmails: () => api.get('/settings/unmatched-emails'),
  assignUnmatchedEmail: (id, restaurantId) =>
    api.post(`/settings/unmatched-emails/${id}/assign?restaurant_id=${restaurantId}`),
  getSLAConfig: () => api.get('/settings/sla-config'),
  updateSLAConfig: (config) => api.patch('/settings/sla-config', config),
}

export const gmailApi = {
  getAuthUrl: () => api.get('/gmail/auth-url'),
  getStatus: () => api.get('/gmail/status'),
  triggerPoll: () => api.get('/gmail/poll'),
}

export const authApi = {
  verify: () => api.get('/auth/verify'),
}

export default api
