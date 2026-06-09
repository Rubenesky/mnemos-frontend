<template>
  <AppLayout :title="t('emergencyKit.title')">
    <div class="kit-page">

      <!-- Header row -->
      <div class="kit-header">
        <p class="kit-sub">{{ t('emergencyKit.subtitle') }}</p>
        <button
          v-if="auth.isAdmin"
          @click="downloadZip"
          :disabled="downloading"
          class="btn-download"
        >
          <svg v-if="!downloading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span class="btn-spinner" v-else />
          {{ downloading ? t('emergencyKit.downloading') : t('emergencyKit.download') }}
        </button>
        <p v-else-if="!auth.isAdmin" class="admin-note">{{ t('emergencyKit.adminOnly') }}</p>
      </div>

      <!-- Asset list -->
      <div v-if="loading" class="state-msg">{{ t('emergencyKit.loading') }}</div>
      <div v-else-if="kitAssets.length === 0" class="state-msg empty-msg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        {{ t('emergencyKit.noAssets') }}
      </div>
      <div v-else class="kit-grid">
        <div v-for="asset in kitAssets" :key="asset.id" class="kit-card">
          <div class="card-thumb">
            <img
              v-if="asset.mime_type?.startsWith('image/')"
              :src="asset.url"
              :alt="asset.metadata?.title ?? asset.original_name"
            />
            <div v-else class="card-file">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div class="card-info">
            <RouterLink :to="`/assets/${asset.id}`" class="card-name">
              {{ asset.metadata?.title ?? asset.original_name }}
            </RouterLink>
            <span class="card-type">{{ asset.mime_type }}</span>
          </div>
          <button
            v-if="auth.isAdmin || auth.isEditor"
            @click="removeFromKit(asset)"
            class="btn-remove"
            title="Remove from kit"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t }   = useI18n()
const auth    = useAuthStore()
const toast   = useToastStore()
const loading     = ref(true)
const downloading = ref(false)
const allAssets   = ref([])

const kitAssets = computed(() => allAssets.value.filter(a => a.is_emergency_kit))

onMounted(async () => {
  try {
    const { data } = await api.get('/assets', { params: { per_page: 500 } })
    allAssets.value = data.data
  } catch {
    toast.error(t('assets.loadError'))
  } finally {
    loading.value = false
  }
})

async function removeFromKit(asset) {
  try {
    await api.patch(`/assets/${asset.id}/emergency-kit`, { is_emergency_kit: false })
    asset.is_emergency_kit = false
    toast.success(t('emergencyKit.toggleRemoved'))
  } catch {
    toast.error(t('emergencyKit.toggleError'))
  }
}

async function downloadZip() {
  downloading.value = true
  try {
    const response = await api.get('/emergency-kit/download', { responseType: 'blob' })
    const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
    const link = document.createElement('a')
    link.href  = url
    link.download = `mnemos-emergency-kit-${new Date().toISOString().slice(0, 10)}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(t('emergencyKit.downloaded'))
  } catch {
    toast.error(t('emergencyKit.downloadError'))
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.kit-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.kit-sub {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  max-width: 520px;
}

.admin-note {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: #dc2626;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s ease;
  flex-shrink: 0;
}

.btn-download:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-download:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-download svg {
  width: 15px;
  height: 15px;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.state-msg {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 48px 0;
}

.empty-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-msg svg {
  width: 40px;
  height: 40px;
  color: #cbd5e1;
}

.kit-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kit-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.card-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-file svg {
  width: 22px;
  height: 22px;
  color: #94a3b8;
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-name:hover {
  color: #f59e0b;
}

.card-type {
  font-size: 11px;
  color: #94a3b8;
}

.btn-remove {
  width: 28px;
  height: 28px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s ease;
  line-height: 1;
}

.btn-remove:hover {
  background: #fecaca;
}
</style>
