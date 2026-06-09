<template>
  <AppLayout :title="t('reports.title')">
    <div class="reports-page">
      <div class="report-card">
        <div class="report-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="report-content">
          <h2 class="report-title">{{ t('reports.title') }}</h2>
          <p class="report-subtitle">{{ t('reports.subtitle') }}</p>

          <div v-if="!auth.isAdmin" class="report-warning">
            {{ t('reports.adminOnly') }}
          </div>

          <template v-else>
            <div class="period-field">
              <label class="period-label" for="report-period">{{ t('reports.period') }}</label>
              <select id="report-period" v-model="period" class="period-select">
                <option value="all">{{ t('reports.periods.all') }}</option>
                <option value="month">{{ t('reports.periods.month') }}</option>
                <option value="quarter">{{ t('reports.periods.quarter') }}</option>
                <option value="year">{{ t('reports.periods.year') }}</option>
              </select>
            </div>

            <button
              @click="downloadReport"
              :disabled="loading"
              class="btn-generate"
            >
              <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span class="btn-spinner" v-else />
              {{ loading ? t('reports.generating') : t('reports.generate') }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t, locale } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()
const loading = ref(false)
const period = ref('all')

async function downloadReport() {
  loading.value = true
  try {
    const response = await api.get('/reports/impact', {
      responseType: 'blob',
      params: { period: period.value, locale: locale.value },
    })
    const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href  = url
    link.download = `mnemos-impact-report-${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(t('reports.success'))
  } catch {
    toast.error(t('reports.error'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reports-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 16px;
}

.report-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.report-icon {
  width: 56px;
  height: 56px;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.report-icon svg {
  width: 28px;
  height: 28px;
}

.report-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.report-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.report-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
  max-width: 360px;
}

.report-warning {
  font-size: 13px;
  color: #b45309;
  background: #fef9c3;
  padding: 10px 16px;
  border-radius: 6px;
}

.period-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}

.period-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.period-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  color: #0f172a;
  background: #f8fafc;
  cursor: pointer;
  appearance: auto;
}

.period-select:focus {
  outline: 2px solid #f59e0b;
  outline-offset: 1px;
}

.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #0f172a;
  color: #f59e0b;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s ease, opacity 0.12s ease;
  margin-top: 4px;
}

.btn-generate:hover:not(:disabled) {
  background: #1e293b;
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-generate svg {
  width: 16px;
  height: 16px;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
