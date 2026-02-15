'use client'

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from './config'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Use axios directly to avoid interceptor loop
        const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        // Save new tokens
        setTokens(access, response.data.refresh || refreshToken)

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`
        }

        // Retry original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed (token expired or invalid)
        clearTokens()
        // Optional: Redirect to login or handle session expiry
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
// ... existing code ...

export interface AnalysisResult {
  id: number
  match_score: number
  job_title: string
  company: string
  created_at: string
}

export const getAnalysisResults = async (): Promise<AnalysisResult[]> => {
  const response = await api.get('/api/analysis-results/')
  return response.data
}

// Update MatchResponse type if it exists, or just ensure the call site handles it
// Ideally we should export the types from a shared file or here
