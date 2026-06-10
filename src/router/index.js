import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * Application router.
 *
 * Uses HTML5 history mode. All routes except `/login` and the 404 catch-all
 * require authentication (`meta.requiresAuth`). The `/login` route is marked
 * as guest-only (`meta.guest`) so authenticated users are redirected straight
 * to the dashboard.
 *
 * Navigation guard (`router.beforeEach`):
 * - Unauthenticated access to a protected route → redirect to `login`.
 * - Authenticated access to a guest-only route → redirect to `dashboard`.
 *
 * @module router
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/assets',
      name: 'assets',
      component: () => import('../views/AssetsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/collections',
      name: 'collections',
      component: () => import('../views/CollectionsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'editor' },
    },
    {
      path: '/collections/:id',
      name: 'collection-detail',
      component: () => import('../views/CollectionDetailView.vue'),
      meta: { requiresAuth: true, requiresRole: 'editor' },
    },
    {
      path: '/assets/upload',
      name: 'asset-upload',
      component: () => import('../views/AssetUploadView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/assets/bulk-upload',
      name: 'asset-bulk-upload',
      component: () => import('../views/BulkUploadView.vue'),
      meta: { requiresAuth: true, requiresRole: 'editor' },
    },
    {
      path: '/assets/:id/edit',
      name: 'asset-edit',
      component: () => import('../views/AssetEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/assets/:id',
      name: 'asset-detail',
      component: () => import('../views/AssetDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/assets/:id/audit',
      name: 'asset-audit',
      component: () => import('../views/AssetAuditView.vue'),
      meta: { requiresAuth: true, requiresRole: 'editor' },
    },
    {
      path: '/rag',
      name: 'rag',
      component: () => import('../views/RAGView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/gallery',
      name: 'public-gallery',
      component: () => import('@/views/PublicGalleryView.vue'),
      // NO meta.requiresAuth — public route
    },
    {
      path: '/embed/:slug',
      name: 'embed-gallery',
      component: () => import('@/views/EmbedGalleryView.vue'),
      // NO meta.requiresAuth — public standalone embed page
    },
    {
      path: '/consents',
      name: 'consents',
      component: () => import('@/views/ConsentPanelView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/welcome',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/consent/:token',
      name: 'public-consent',
      component: () => import('@/views/PublicConsentView.vue'),
      // NO meta.requiresAuth — public route, no login needed
    },
    {
      path: '/press-room',
      name: 'press-room',
      component: () => import('@/views/PressRoomView.vue'),
      // NO meta.requiresAuth — public route
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ImpactReportView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/emergency-kit',
      name: 'emergency-kit',
      component: () => import('@/views/EmergencyKitView.vue'),
      meta: { requiresAuth: true, requiresRole: 'editor' },
    },
    {
      path: '/admin',
      redirect: '/admin/users',
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/AdminUsersView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: () => import('@/views/AdminSettingsView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/admin/system',
      name: 'admin-system',
      component: () => import('@/views/AdminSystemView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/admin/volunteers',
      name: 'admin-volunteers',
      component: () => import('@/views/AdminVolunteersView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/admin/gdpr',
      name: 'admin-gdpr',
      component: () => import('@/views/AdminGdprView.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

/**
 * Global navigation guard.
 * - Unauthenticated access to a protected route → redirect to login.
 * - Authenticated access to a guest-only route → redirect to dashboard.
 * - Insufficient role for a role-gated route → redirect to dashboard.
 *
 * requiresRole values:
 *   'admin'  — admin only
 *   'editor' — admin or editor
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 */
router.beforeEach((to) => {
  const auth = useAuthStore()

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

  return true
})

export default router
