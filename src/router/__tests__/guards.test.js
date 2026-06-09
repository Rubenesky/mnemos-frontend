import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

function runGuard(to, authToken, user = null) {
  const auth = useAuthStore()
  auth.token = authToken
  auth.user = user

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  const requiredRole = to.meta.requiresRole
  if (requiredRole) {
    const userRole = auth.user?.role
    const allowed = {
      admin: ['admin'],
      editor: ['admin', 'editor'],
    }
    if (!allowed[requiredRole]?.includes(userRole)) {
      return { name: 'dashboard' }
    }
  }
  return undefined
}

describe('Router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('ruta protegida sin token redirige a /login', () => {
    const result = runGuard({ meta: { requiresAuth: true } }, null)
    expect(result).toEqual({ name: 'login' })
  })

  it('ruta protegida con token permite el acceso', () => {
    const result = runGuard({ meta: { requiresAuth: true } }, 'valid-token', { role: 'viewer' })
    expect(result).toBeUndefined()
  })

  it('ruta guest con token redirige a /dashboard', () => {
    const result = runGuard({ meta: { guest: true } }, 'valid-token', { role: 'viewer' })
    expect(result).toEqual({ name: 'dashboard' })
  })

  describe('requiresRole: editor (admin y editor tienen acceso)', () => {
    const to = { meta: { requiresAuth: true, requiresRole: 'editor' } }

    it('viewer redirige a /dashboard', () => {
      expect(runGuard(to, 'tok', { role: 'viewer' })).toEqual({ name: 'dashboard' })
    })

    it('volunteer redirige a /dashboard', () => {
      expect(runGuard(to, 'tok', { role: 'volunteer' })).toEqual({ name: 'dashboard' })
    })

    it('editor permite el acceso', () => {
      expect(runGuard(to, 'tok', { role: 'editor' })).toBeUndefined()
    })

    it('admin permite el acceso', () => {
      expect(runGuard(to, 'tok', { role: 'admin' })).toBeUndefined()
    })
  })

  describe('requiresRole: admin (solo admin tiene acceso)', () => {
    const to = { meta: { requiresAuth: true, requiresRole: 'admin' } }

    it('viewer redirige a /dashboard', () => {
      expect(runGuard(to, 'tok', { role: 'viewer' })).toEqual({ name: 'dashboard' })
    })

    it('editor redirige a /dashboard', () => {
      expect(runGuard(to, 'tok', { role: 'editor' })).toEqual({ name: 'dashboard' })
    })

    it('admin permite el acceso', () => {
      expect(runGuard(to, 'tok', { role: 'admin' })).toBeUndefined()
    })
  })
})
