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
      path: '/assets/upload',
      name: 'asset-upload',
      component: () => import('../views/AssetUploadView.vue'),
      meta: { requiresAuth: true },
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
      path: '/rag',
      name: 'rag',
      component: () => import('../views/RAGView.vue'),
      meta: { requiresAuth: true },
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
 * Redirects unauthenticated users away from protected routes and
 * authenticated users away from guest-only routes.
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
})

export default router
