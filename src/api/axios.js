import axios from 'axios'
import { useToastStore } from '../stores/toast'

/**
 * Pre-configured Axios instance for the Mnemos API.
 *
 * Base URL is read from the `VITE_API_URL` environment variable (required).
 * Two interceptors are registered:
 *
 * - **Request interceptor** — attaches the JWT bearer token from localStorage
 *   to every outgoing request automatically.
 * - **Response interceptor** — handles common HTTP error statuses globally:
 *   network errors, 401 (session expired → redirect to /login), 403, 404,
 *   422 (validation errors, first message surfaced), and 5xx server errors.
 *   All error messages are shown via the toast store.
 *
 * @module api
 */

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) {
  throw new Error('VITE_API_URL is not defined. Copy .env.example to .env and set the value.')
}

/** @type {import('axios').AxiosInstance} */
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor — attach the Bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const toast = useToastStore()

    if (!error.response) {
      // No network connection
      toast.error('Cannot reach the server. Check your connection.')
    } else if (error.response.status === 401) {
      // Token expired or invalid — clear session and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.error('Your session has expired. Please sign in again.')
      window.location.href = '/login'
    } else if (error.response.status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (error.response.status === 404) {
      toast.error('The requested resource does not exist.')
    } else if (error.response.status === 422) {
      // Validation errors — surface the first message
      const errors = error.response.data.errors
      if (errors) {
        const firstError = Object.values(errors)[0][0]
        toast.error(firstError)
      } else {
        toast.error('Invalid data. Please review the form.')
      }
    } else if (error.response.status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    return Promise.reject(error)
  },
)

export default api
