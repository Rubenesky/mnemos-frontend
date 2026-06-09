<template>
  <AppLayout :title="t('admin.system.title')">
    <div class="admin-system">
      <AdminSubnav />

      <div class="system-header">
        <p class="system-subtitle">{{ t('admin.system.subtitle') }}</p>
        <div class="system-meta">
          <span v-if="checkedAt" class="last-checked">
            {{ t('admin.system.lastChecked') }}: {{ formatTime(checkedAt) }}
          </span>
          <span class="auto-refresh-label">{{ t('admin.system.autoRefresh') }}</span>
          <button class="btn-refresh" :disabled="loading" @click="fetchStatus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {{ t('admin.system.refreshNow') }}
          </button>
        </div>
      </div>

      <div v-if="loading && !checkedAt" class="state-placeholder">
        {{ t('admin.system.loading') }}
      </div>

      <div v-else class="status-grid">
        <div class="status-card card">
          <div class="status-card__icon" :class="iconClass(status.database)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="status-card__body">
            <p class="status-card__label">{{ t('admin.system.database') }}</p>
            <span class="badge" :class="badgeClass(status.database)">
              {{ statusLabel(status.database) }}
            </span>
            <p v-if="status.database?.latency_ms != null" class="status-card__latency">
              {{ t('admin.system.latency') }}: {{ status.database.latency_ms }} {{ t('admin.system.ms') }}
            </p>
            <p v-if="status.database?.error" class="status-card__error">{{ status.database.error }}</p>
          </div>
        </div>

        <div class="status-card card">
          <div class="status-card__icon" :class="iconClass(status.cloudinary)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
          </div>
          <div class="status-card__body">
            <p class="status-card__label">{{ t('admin.system.cloudinary') }}</p>
            <span class="badge" :class="badgeClass(status.cloudinary)">
              {{ statusLabel(status.cloudinary) }}
            </span>
            <p v-if="status.cloudinary?.latency_ms != null" class="status-card__latency">
              {{ t('admin.system.latency') }}: {{ status.cloudinary.latency_ms }} {{ t('admin.system.ms') }}
            </p>
            <p v-if="status.cloudinary?.error" class="status-card__error">{{ status.cloudinary.error }}</p>
          </div>
        </div>

        <div class="status-card card">
          <div class="status-card__icon" :class="iconClass(status.gemini)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div class="status-card__body">
            <p class="status-card__label">{{ t('admin.system.gemini') }}</p>
            <span class="badge" :class="badgeClass(status.gemini)">
              {{ statusLabel(status.gemini) }}
            </span>
            <p v-if="status.gemini?.latency_ms != null" class="status-card__latency">
              {{ t('admin.system.latency') }}: {{ status.gemini.latency_ms }} {{ t('admin.system.ms') }}
            </p>
            <p v-if="status.gemini?.error" class="status-card__error">{{ status.gemini.error }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/AppLayout.vue'
import AdminSubnav from '@/components/AdminSubnav.vue'
import api from '@/api/axios'

const { t } = useI18n({ useScope: 'global' })

const loading   = ref(false)
const checkedAt = ref(null)
const status    = ref({ database: null, cloudinary: null, gemini: null })

let pollTimer = null

async function fetchStatus() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/system/status')
    status.value    = { database: data.database, cloudinary: data.cloudinary, gemini: data.gemini }
    checkedAt.value = data.checked_at
  } catch {
    // Global interceptor handles toast; keep existing status visible
  } finally {
    loading.value = false
  }
}

function iconClass(svc) {
  if (!svc) return 'status-card__icon--unknown'
  return svc.ok ? 'status-card__icon--ok' : 'status-card__icon--error'
}

function badgeClass(svc) {
  if (!svc) return 'badge--gray'
  return svc.ok ? 'badge--green' : 'badge--red'
}

function statusLabel(svc) {
  if (!svc) return t('admin.system.unknown')
  return svc.ok ? t('admin.system.ok') : t('admin.system.error')
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString()
}

onMounted(() => {
  fetchStatus()
  pollTimer = setInterval(fetchStatus, 60_000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})
</script>

<style scoped>
.admin-system {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.system-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.system-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.system-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.last-checked,
.auto-refresh-label {
  font-size: 12px;
  color: #94a3b8;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  color: #0f172a;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.btn-refresh svg {
  width: 14px;
  height: 14px;
}

.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.status-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
}

.status-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-card__icon svg {
  width: 22px;
  height: 22px;
}

.status-card__icon--ok {
  background: #dcfce7;
  color: #16a34a;
}

.status-card__icon--error {
  background: #fee2e2;
  color: #dc2626;
}

.status-card__icon--unknown {
  background: #f1f5f9;
  color: #94a3b8;
}

.status-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.status-card__label {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.status-card__latency {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.status-card__error {
  font-size: 11px;
  color: #991b1b;
  margin: 0;
  word-break: break-word;
}
</style>
