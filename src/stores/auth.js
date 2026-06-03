import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/axios'

/**
 * Authentication store.
 *
 * Manages the current user session: JWT token and user profile are persisted
 * in localStorage so the session survives page reloads. Exposes computed
 * helpers for role-based access control and login/logout actions that
 * communicate with the Mnemos API.
 *
 * @returns {{ token: import('vue').Ref<string|null>, user: import('vue').Ref<object|null>, isAuthenticated: import('vue').ComputedRef<boolean>, isAdmin: import('vue').ComputedRef<boolean>, isEditor: import('vue').ComputedRef<boolean>, isVolunteer: import('vue').ComputedRef<boolean>, isExpired: import('vue').ComputedRef<boolean>, login: Function, logout: Function }}
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  /** @type {import('vue').ComputedRef<boolean>} True when a valid token is present. */
  const isAuthenticated = computed(() => !!token.value)

  /** @type {import('vue').ComputedRef<boolean>} True when the current user has the admin role. */
  const isAdmin = computed(() => user.value?.role === 'admin')

  /** @type {import('vue').ComputedRef<boolean>} True when the current user has the editor role. */
  const isEditor = computed(() => user.value?.role === 'editor')

  /** @type {import('vue').ComputedRef<boolean>} True when the current user has the volunteer role (and has not expired). */
  const isVolunteer = computed(() => {
    if (user.value?.role !== 'volunteer') return false
    if (user.value?.expires_at != null && new Date(user.value.expires_at) < new Date()) return false
    return true
  })

  /** @type {import('vue').ComputedRef<boolean>} True when the user is a volunteer whose expires_at is in the past. */
  const isExpired = computed(
    () =>
      user.value?.role === 'volunteer' &&
      user.value?.expires_at != null &&
      new Date(user.value.expires_at) < new Date(),
  )

  /**
   * Authenticate with email and password.
   * Persists the returned token and user object to localStorage.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<void>}
   */
  async function login(email, password) {
    const response = await api.post('/login', { email, password })

    token.value = response.data.token
    user.value = response.data.user

    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  /**
   * End the current session.
   * Calls the server logout endpoint (best-effort) then clears local state
   * regardless of whether the server call succeeded.
   *
   * @returns {Promise<void>}
   */
  async function logout() {
    try {
      await api.post('/logout')
    } catch (e) {
      // Clear local state even if the server call fails
    }

    token.value = null
    user.value = null

    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, isAdmin, isEditor, isVolunteer, isExpired, login, logout }
})
