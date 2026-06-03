<template>
  <div class="app-shell">
    <!-- Toast notifications -->
    <ToastNotification />

    <!-- Navbar -->
    <nav class="mnemos-navbar">
      <div class="navbar-inner">
        <!-- Left: logo + wordmark + nav links -->
        <div class="navbar-left">
          <RouterLink to="/dashboard" class="navbar-brand">
            <MnemosLogo />
          </RouterLink>

          <div class="nav-links hidden-mobile">
            <RouterLink
              to="/dashboard"
              class="nav-link"
              :class="{ 'nav-link--active': $route.path.startsWith('/dashboard') }"
            >
              {{ t('nav.dashboard') }}
            </RouterLink>
            <RouterLink
              to="/assets"
              class="nav-link"
              :class="{ 'nav-link--active': $route.path.startsWith('/assets') }"
            >
              {{ t('nav.assets') }}
            </RouterLink>
            <RouterLink
              to="/rag"
              class="nav-link"
              :class="{ 'nav-link--active': $route.path.startsWith('/rag') }"
            >
              {{ t('nav.aiChat') }}
            </RouterLink>
            <RouterLink
              to="/gallery"
              class="nav-link"
              :class="{ 'nav-link--active': $route.path.startsWith('/gallery') }"
            >
              {{ t('nav.publicGallery') }}
            </RouterLink>
            <RouterLink
              v-if="!auth.isVolunteer"
              to="/consents"
              class="nav-link"
              :class="{ 'nav-link--active': $route.path.startsWith('/consents') }"
            >
              {{ t('nav.consents') }}
            </RouterLink>
          </div>
        </div>

        <!-- Right: user info + logout -->
        <div class="navbar-right hidden-mobile">
          <span class="user-name">{{ auth.user?.name }}</span>
          <span class="role-badge" :class="`role-badge--${auth.user?.role}`">
            {{ auth.user?.role }}
          </span>
          <LanguageSelector />
          <button @click="handleLogout" class="btn-secondary">
            {{ t('nav.logout') }}
          </button>
        </div>

        <!-- Mobile hamburger -->
        <div class="mobile-menu-toggle">
          <button
            class="hamburger-btn"
            @click="menuOpen = !menuOpen"
            aria-label="Toggle menu"
          >
            <svg class="hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!menuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile dropdown menu -->
      <div v-if="menuOpen" class="mobile-menu">
        <RouterLink
          to="/dashboard"
          class="mobile-nav-link"
          @click="menuOpen = false"
        >
          {{ t('nav.dashboard') }}
        </RouterLink>
        <RouterLink
          to="/assets"
          class="mobile-nav-link"
          @click="menuOpen = false"
        >
          {{ t('nav.assets') }}
        </RouterLink>
        <RouterLink
          to="/rag"
          class="mobile-nav-link"
          @click="menuOpen = false"
        >
          {{ t('nav.aiChat') }}
        </RouterLink>
        <RouterLink
          to="/gallery"
          class="mobile-nav-link"
          @click="menuOpen = false"
        >
          {{ t('nav.publicGallery') }}
        </RouterLink>
        <RouterLink
          v-if="!auth.isVolunteer"
          to="/consents"
          class="mobile-nav-link"
          @click="menuOpen = false"
        >
          {{ t('nav.consents') }}
        </RouterLink>
        <div class="mobile-menu-user">
          <p class="user-name">{{ auth.user?.name }}</p>
          <span class="role-badge" :class="`role-badge--${auth.user?.role}`">
            {{ auth.user?.role }}
          </span>
          <LanguageSelector />
          <button @click="handleLogout" class="btn-secondary mobile-logout">
            {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mnemos-footer">
      <div class="footer-inner">
        <p class="footer-tagline">Open memory for organizations that matter</p>
        <a
          href="https://github.com/rubenesky/mnemos-frontend"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-github"
        >
          GitHub
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useRouter } from 'vue-router'
import ToastNotification from './ToastNotification.vue'
import MnemosLogo from './MnemosLogo.vue'
import LanguageSelector from './LanguageSelector.vue'

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const menuOpen = ref(false)

async function handleLogout() {
  await auth.logout()
  toast.success('Signed out successfully')
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* ── Shell ── */
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-light-bg);
}

/* ── Navbar ── */
.mnemos-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-navy, #0f172a);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Brand ── */
.navbar-brand {
  text-decoration: none;
  display: flex;
  align-items: center;
}

/* ── Nav links ── */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.15s ease;
}

.nav-link:hover,
.nav-link--active {
  color: var(--color-gold, #f59e0b);
}

/* ── Right side ── */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  color: var(--color-muted, #94a3b8);
  font-size: 0.875rem;
}

/* ── Role badge ── */
.role-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.03em;
}

.role-badge--admin {
  background: var(--color-gold, #f59e0b);
  color: var(--color-navy, #0f172a);
}

.role-badge--editor {
  background: var(--color-editor);
  color: #ffffff;
}

.role-badge--viewer {
  background: var(--color-muted, #94a3b8);
  color: #ffffff;
}

.role-badge--volunteer {
  background: var(--color-volunteer, #8b5cf6);
  color: #ffffff;
}

/* ── Secondary button ── */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-muted, #94a3b8);
  color: #ffffff;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.btn-secondary:hover {
  border-color: #ffffff;
  color: #ffffff;
}

/* ── Mobile ── */
.mobile-menu-toggle {
  display: none;
}

.hamburger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #ffffff;
}

.hamburger-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.mobile-menu {
  background: var(--color-navy, #0f172a);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-nav-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color 0.15s ease;
}

.mobile-nav-link:hover {
  color: var(--color-gold, #f59e0b);
}

.mobile-menu-user {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.mobile-logout {
  align-self: flex-start;
}

/* ── Main content ── */
.main-content {
  flex: 1;
  padding-top: 4rem;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 2rem;
}

/* ── Footer ── */
.mnemos-footer {
  background: var(--color-navy, #0f172a);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-tagline {
  color: var(--color-muted, #94a3b8);
  font-size: 0.8125rem;
}

.footer-github {
  color: var(--color-gold, #f59e0b);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.footer-github:hover {
  opacity: 0.8;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .hidden-mobile {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }
}
</style>
