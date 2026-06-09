import axios from 'axios'
import { useToastStore } from '../stores/toast'
import { i18n } from '../i18n/index.js'

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
    const t = (key) => i18n.global.t(key)

    if (!error.response) {
      toast.error(t('api.networkError'))
    } else if (error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.error(t('api.sessionExpired'))
      window.location.href = '/login'
    } else if (error.response.status === 403) {
      toast.error(t('api.forbidden'))
    } else if (error.response.status === 404) {
      toast.error(t('api.notFound'))
    } else if (error.response.status === 422) {
      const { errors, error: errCode } = error.response.data
      if (errCode === 'consent_required') {
        toast.error(t('api.consentRequired'))
      } else if (errors) {
        const firstError = Object.values(errors)[0][0]
        toast.error(firstError)
      } else {
        toast.error(t('api.invalidData'))
      }
    } else if (error.response.status >= 500) {
      toast.error(t('api.serverError'))
    }

    return Promise.reject(error)
  },
)

export default api
