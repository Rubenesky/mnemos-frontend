<template>
  <div class="pressroom-page">
    <header class="pressroom-header">
      <div class="header-inner">
        <span class="header-logo">Mnemos</span>
        <div class="header-text">
          <h1 class="pressroom-title">{{ t('pressRoom.title') }}</h1>
          <p class="pressroom-sub">{{ t('pressRoom.subtitle') }}</p>
        </div>
        <nav class="header-nav">
          <RouterLink to="/gallery" class="nav-btn nav-btn--ghost">{{ t('pressRoom.viewGallery') }}</RouterLink>
          <RouterLink v-if="auth.isAuthenticated" to="/dashboard" class="nav-btn nav-btn--primary">{{ t('pressRoom.goToPanel') }}</RouterLink>
        </nav>
      </div>
    </header>

    <main class="pressroom-main">
      <div v-if="loading" class="state-msg">{{ t('pressRoom.loading') }}</div>
      <div v-else-if="assets.length === 0" class="state-msg">{{ t('pressRoom.empty') }}</div>
      <div v-else class="assets-grid">
        <div v-for="asset in assets" :key="asset.id" class="asset-card">
          <div class="card-media">
            <img
              v-if="asset.mime_type?.startsWith('image/')"
              :src="asset.url"
              :alt="asset.alt_text || asset.title"
              class="card-img"
            />
            <div v-else class="card-file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span class="file-type">{{ asset.mime_type }}</span>
            </div>
          </div>
          <div class="card-body">
            <h2 class="card-title">{{ asset.title }}</h2>
            <p v-if="asset.press_kit_description" class="card-kit-desc">{{ asset.press_kit_description }}</p>
            <p v-if="asset.description" class="card-desc">{{ asset.description }}</p>
            <div v-if="asset.tags?.length" class="card-tags">
              <span v-for="tag in asset.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <a :href="asset.url" target="_blank" rel="noopener" class="card-download">
              ↓ Download
            </a>
          </div>
        </div>
      </div>
    </main>

    <footer class="pressroom-footer">
      <span>Powered by <strong>Mnemos</strong></span>
      <p v-if="!auth.isAuthenticated" class="footer-auth">
        {{ t('pressRoom.loginPrompt') }}
        <RouterLink to="/login" class="footer-link">{{ t('pressRoom.loginLink') }}</RouterLink>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const assets = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/public/press-room`)
    assets.value = data.data
  } catch {
    // silent — empty state shown
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pressroom-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.pressroom-header {
  background: #0f172a;
  color: #ffffff;
  padding: 24px;
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-logo {
  font-size: 22px;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: -0.03em;
  flex-shrink: 0;
}

.header-nav {
  margin-left: auto;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}

.nav-btn--ghost {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid #334155;
}

.nav-btn--ghost:hover {
  background: #1e293b;
  color: #ffffff;
}

.nav-btn--primary {
  background: #f59e0b;
  color: #0f172a;
  border: 1px solid transparent;
}

.nav-btn--primary:hover {
  background: #fbbf24;
}

.pressroom-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #ffffff;
}

.pressroom-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.pressroom-main {
  flex: 1;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 24px;
}

.state-msg {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 48px 0;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.asset-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-media {
  height: 180px;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-file-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
}

.card-file-icon svg {
  width: 40px;
  height: 40px;
}

.file-type {
  font-size: 11px;
  color: #94a3b8;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.card-kit-desc {
  font-size: 13px;
  color: #334155;
  margin: 0;
  font-style: italic;
}

.card-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
}

.card-download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  padding: 8px 16px;
  background: #0f172a;
  color: #f59e0b;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.12s ease;
}

.card-download:hover {
  background: #1e293b;
}

.pressroom-footer {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.footer-auth {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.footer-link {
  color: #94a3b8;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.12s ease;
}

.footer-link:hover {
  color: #64748b;
}

@media (max-width: 768px) {
  .assets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
