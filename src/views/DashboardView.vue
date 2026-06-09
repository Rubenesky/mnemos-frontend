<template>
  <AppLayout :title="t('dashboard.title')">
    <div class="dashboard">
      <p class="page-subtitle">{{ currentDate }}</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon--total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-label">{{ t('dashboard.totalAssets') }}</p>
            <p class="stat-value">{{ stats.total }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--processed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-label">{{ t('dashboard.processed') }}</p>
            <p class="stat-value">{{ stats.processed }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-body">
            <p class="stat-label">{{ t('dashboard.pending') }}</p>
            <p class="stat-value">{{ stats.pending }}</p>
          </div>
        </div>
      </div>

      <div class="card recent-card">
        <h2 class="recent-title">{{ t('dashboard.recentAssets') }}</h2>
        <div v-if="loading" class="recent-empty">{{ t('dashboard.loading') }}</div>
        <div v-else-if="recentAssets.length === 0" class="recent-empty">{{ t('dashboard.noAssets') }}</div>
        <ul v-else class="recent-list">
          <li v-for="asset in recentAssets" :key="asset.id" class="recent-item">
            <div class="recent-info">
              <span class="recent-name">{{ asset.metadata?.title ?? asset.original_name }}</span>
              <span class="recent-by">{{ asset.uploaded_by }}</span>
            </div>
            <div class="recent-right">
              <span class="recent-status" :class="`recent-status--${asset.status}`">{{ asset.status }}</span>
              <span class="recent-size">{{ asset.size_kb }} KB</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <OnboardingModal v-if="showOnboarding" @done="showOnboarding = false" />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import OnboardingModal from '../components/OnboardingModal.vue'
import api from '../api/axios'

const { t, locale } = useI18n()

const showOnboarding = ref(false)

const loading = ref(true)
const recentAssets = ref([])
const stats = ref({ total: 0, processed: 0, pending: 0 })

const currentDate = computed(() =>
  new Date().toLocaleDateString(locale.value, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

onMounted(async () => {
  if (!localStorage.getItem('mnemos_onboarding_completed')) {
    showOnboarding.value = true
  }
  try {
    const [assetsRes, statsRes] = await Promise.all([
      api.get('/assets'),
      api.get('/dashboard/stats'),
    ])
    recentAssets.value = assetsRes.data.data.slice(0, 5)
    stats.value = statsRes.data
  } catch (e) {
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 4px;
  text-transform: capitalize;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 18px;
  height: 18px;
}

.stat-icon--total {
  background: #f1f5f9;
  color: #64748b;
}

.stat-icon--processed {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon--pending {
  background: #fef9c3;
  color: #b45309;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1;
  letter-spacing: -0.02em;
}

.recent-card {
  padding: 16px;
}

.recent-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  margin: 0 0 12px;
}

.recent-empty {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.recent-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-by {
  font-size: 11px;
  color: #94a3b8;
}

.recent-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.recent-status {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 9999px;
}

.recent-status--processed {
  background: #dcfce7;
  color: #166534;
}

.recent-status--pending {
  background: #fef9c3;
  color: #854d0e;
}

.recent-status--failed {
  background: #fee2e2;
  color: #991b1b;
}

.recent-size {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
