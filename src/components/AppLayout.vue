<template>
  <div class="app-shell">
    <ToastNotification />

    <!-- Mobile overlay -->
    <Transition name="overlay">
      <div v-if="menuOpen" class="sidebar-overlay" @click="menuOpen = false" />
    </Transition>

    <!-- Sidebar -->
    <aside class="mnemos-sidebar" :class="{ 'sidebar--open': menuOpen }">
      <RouterLink to="/dashboard" class="sidebar-brand" @click="menuOpen = false">
        <MnemosLogo />
      </RouterLink>

      <nav class="sidebar-nav">
        <RouterLink
          to="/dashboard"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/dashboard') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          <span>{{ t('nav.dashboard') }}</span>
        </RouterLink>

        <RouterLink
          to="/assets"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/assets') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span>{{ t('nav.assets') }}</span>
        </RouterLink>

        <RouterLink
          v-if="auth.isAdmin || auth.isEditor"
          to="/collections"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/collections') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>{{ t('nav.collections') }}</span>
        </RouterLink>

        <RouterLink
          to="/rag"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/rag') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span>{{ t('nav.aiChat') }}</span>
        </RouterLink>

        <RouterLink
          to="/gallery"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/gallery') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>{{ t('nav.publicGallery') }}</span>
        </RouterLink>

        <RouterLink
          to="/press-room"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/press-room') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z"/>
            <path d="M17 20V14H7v6"/>
            <path d="M7 4v4h6"/>
          </svg>
          <span>{{ t('nav.pressRoom') }}</span>
        </RouterLink>

        <RouterLink
          v-if="auth.isAdmin"
          to="/reports"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/reports') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>{{ t('nav.reports') }}</span>
        </RouterLink>

        <RouterLink
          v-if="auth.isAdmin"
          to="/admin"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/admin') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          <span>{{ t('nav.admin') }}</span>
        </RouterLink>

        <RouterLink
          v-if="!auth.isVolunteer"
          to="/emergency-kit"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/emergency-kit') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span>{{ t('nav.emergencyKit') }}</span>
        </RouterLink>

        <RouterLink
          v-if="!auth.isVolunteer"
          to="/consents"
          class="nav-item"
          :class="{ 'nav-item--active': $route.path.startsWith('/consents') }"
          @click="menuOpen = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>{{ t('nav.consents') }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-row">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-meta">
            <p class="user-name">{{ auth.user?.name }}</p>
            <span class="role-badge" :class="`role-badge--${auth.user?.role}`">{{ auth.user?.role }}</span>
          </div>
        </div>
        <div class="footer-actions">
          <LanguageSelector />
          <button @click="handleLogout" class="btn-logout">{{ t('nav.logout') }}</button>
        </div>
      </div>
    </aside>

    <!-- Main body -->
    <div class="app-body">
      <!-- Topbar -->
      <header class="app-topbar">
        <button class="hamburger-btn" @click="menuOpen = !menuOpen" aria-label="Toggle menu">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <h1 class="topbar-title">{{ title }}</h1>
        <div class="topbar-actions">
          <NotificationBell />
          <slot name="actions" />
        </div>
      </header>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useRouter } from 'vue-router'
import ToastNotification from './ToastNotification.vue'
import MnemosLogo from './MnemosLogo.vue'
import LanguageSelector from './LanguageSelector.vue'
import NotificationBell from './NotificationBell.vue'

defineProps({
  title: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const menuOpen = ref(false)

const userInitial = computed(() => auth.user?.name?.charAt(0)?.toUpperCase() || '?')

async function handleLogout() {
  await auth.logout()
  toast.success(t('auth.signedOut'))
  router.push({ name: 'public-gallery' })
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

/* ── Sidebar ── */
.mnemos-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 200px;
  z-index: 200;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-brand {
  height: 136px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.sidebar-brand :deep(.logo-img) {
  height: 104px;
  border-radius: 14px;
}

.sidebar-brand :deep(.logo-wordmark) {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.05em;
}

/* ── Nav ── */
.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px 8px 8px;
  border-radius: 6px;
  border-left: 2px solid transparent;
  font-size: 13px;
  font-weight: 400;
  color: #94a3b8;
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #334155;
  border-left-color: #cbd5e1;
}

.nav-item--active {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 500;
  border-left-color: #f59e0b;
}

.nav-item--active .nav-icon {
  color: #f59e0b;
}

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ── Sidebar footer ── */
.sidebar-footer {
  border-top: 1px solid #e2e8f0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0f172a;
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 500;
  width: fit-content;
}

.role-badge--admin    { background: #fef9c3; color: #854d0e; }
.role-badge--editor   { background: #dbeafe; color: #1e40af; }
.role-badge--viewer   { background: #f1f5f9; color: #64748b; }
.role-badge--volunteer{ background: #f3e8ff; color: #6b21a8; }

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.btn-logout:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

/* ── Overlay ── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 199;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
}

.overlay-enter-active,
.overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from,
.overlay-leave-to { opacity: 0; }

/* ── App body ── */
.app-body {
  margin-left: 200px;
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Topbar ── */
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 52px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  flex-shrink: 0;
}

.hamburger-btn {
  display: none;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  padding: 5px;
  color: #64748b;
  line-height: 0;
  flex-shrink: 0;
}

.hamburger-btn svg {
  width: 16px;
  height: 16px;
  display: block;
}

.topbar-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Main content ── */
.main-content {
  flex: 1;
  padding: 24px;
  background: #f8fafc;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .mnemos-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mnemos-sidebar.sidebar--open {
    transform: translateX(0);
  }

  .hamburger-btn {
    display: flex;
  }

  .app-body {
    margin-left: 0;
  }
}
</style>
