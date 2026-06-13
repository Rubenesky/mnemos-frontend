<!-- AdminGdprView.vue — RJC -->
<template>
  <AppLayout :title="t('admin.gdpr.title')">
    <div class="admin-gdpr">
      <AdminSubnav />

      <!-- Header -->
      <div class="page-header">
        <p class="page-subtitle">{{ t('admin.gdpr.subtitle') }}</p>
        <div class="header-actions">
          <span v-if="checkedAt" class="last-checked">
            {{ t('admin.gdpr.lastChecked') }}: {{ checkedAt }}
          </span>
          <span class="auto-refresh-label">{{ t('admin.gdpr.autoRefresh') }}</span>
          <button class="btn-refresh" :disabled="loading" @click="fetchData">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {{ t('admin.gdpr.refreshNow') }}
          </button>
        </div>
      </div>

      <!-- Loading state (first load only) -->
      <div v-if="loading && !data" class="state-placeholder">
        {{ t('admin.gdpr.loading') }}
      </div>

      <template v-else-if="data">
        <!-- Risk widget -->
        <div class="risk-widget" :class="riskWidgetClass">
          <span class="risk-shield">🛡</span>
          <div class="risk-body">
            <p class="risk-label">{{ t('admin.gdpr.riskLevel.label') }}</p>
            <p class="risk-value">{{ t('admin.gdpr.riskLevel.' + data.risk_level) }}</p>
          </div>
          <div class="risk-meta">
            <span class="risk-pct">{{ data.blocked_percentage }}%</span>
            <span class="risk-pct-label">{{ t('admin.gdpr.kpi.blocked') }}</span>
          </div>
        </div>

        <!-- 4 KPI cards -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-card--warning">
            <p class="kpi-value">{{ data.pending_consents }}</p>
            <p class="kpi-label">{{ t('admin.gdpr.kpi.pending') }}</p>
          </div>
          <div class="kpi-card kpi-card--success">
            <p class="kpi-value">{{ data.accepted_consents }}</p>
            <p class="kpi-label">{{ t('admin.gdpr.kpi.accepted') }}</p>
          </div>
          <div class="kpi-card kpi-card--danger">
            <p class="kpi-value">{{ data.rejected_consents }}</p>
            <p class="kpi-label">{{ t('admin.gdpr.kpi.rejected') }}</p>
          </div>
          <div class="kpi-card" :class="data.blocked_assets > 0 ? 'kpi-card--danger' : 'kpi-card--neutral'">
            <p class="kpi-value">{{ data.blocked_assets }}</p>
            <p class="kpi-label">{{ t('admin.gdpr.kpi.blocked') }}</p>
          </div>
        </div>

        <!-- Actionable alerts -->
        <div class="alerts-panel">
          <h3 class="alerts-title">{{ t('admin.gdpr.alerts.title') }}</h3>
          <div v-if="data.alerts.length === 0" class="alert-none">
            {{ t('admin.gdpr.alerts.none') }}
          </div>
          <div v-else class="alert-list">
            <div v-for="(alert, i) in data.alerts" :key="i" class="alert-item">
              <span class="alert-icon">⚠</span>
              <span class="alert-text">{{ t('admin.gdpr.alerts.' + alert.key, alert.count !== undefined ? { count: alert.count } : {}) }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="gdpr-actions">
          <button class="btn-export" @click="exportCsv">
            {{ t('admin.gdpr.exportCsv') }}
          </button>
          <RouterLink to="/consents" class="btn-consents">
            {{ t('admin.gdpr.goToConsents') }}
          </RouterLink>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
// RJC — GDPR Intelligence Panel
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import AdminSubnav from '../components/AdminSubnav.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t } = useI18n()
const toast = useToastStore()

const data      = ref(null)
const loading   = ref(false)
const checkedAt = ref('')

let refreshInterval = null

const riskWidgetClass = computed(() => ({
  'risk-widget--low':    data.value?.risk_level === 'low',
  'risk-widget--medium': data.value?.risk_level === 'medium',
  'risk-widget--high':   data.value?.risk_level === 'high',
}))

async function fetchData() {
  loading.value = true
  try {
    const res   = await api.get('/admin/gdpr/dashboard')
    data.value      = res.data.data
    checkedAt.value = new Date().toLocaleTimeString()
  } catch {
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function exportCsv() {
  try {
    const res = await api.get('/admin/gdpr/audit/export', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a   = document.createElement('a')
    a.href     = url
    a.download = `gdpr_audit_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error(t('common.error'))
  }
}

onMounted(() => {
  fetchData()
  refreshInterval = setInterval(fetchData, 60_000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>

<style scoped>
.admin-gdpr {
  max-width: 960px;
}

/* ── Page header ──────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.last-checked,
.auto-refresh-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-refresh:hover:not(:disabled) { background: #f8fafc; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Loading ──────────────────────────────────────────────────────────────── */
.state-placeholder {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* ── Risk widget ──────────────────────────────────────────────────────────── */
.risk-widget {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.25rem;
  border: 1px solid transparent;
}

.risk-widget--low    { background: #f0fdf4; border-color: #86efac; }
.risk-widget--medium { background: #fefce8; border-color: #fde047; }
.risk-widget--high   { background: #fef2f2; border-color: #fca5a5; }

.risk-shield { font-size: 2rem; flex-shrink: 0; }

.risk-body { flex: 1; }

.risk-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.risk-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: #0f172a;
}

.risk-widget--high   .risk-value { color: #b91c1c; }
.risk-widget--medium .risk-value { color: #92400e; }
.risk-widget--low    .risk-value { color: #166534; }

.risk-meta { text-align: right; }

.risk-pct {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.risk-pct-label {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* ── KPI grid ─────────────────────────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

.kpi-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 1rem;
  text-align: center;
}

.kpi-card--warning { border-top: 3px solid #f59e0b; }
.kpi-card--success { border-top: 3px solid #22c55e; }
.kpi-card--danger  { border-top: 3px solid #ef4444; }
.kpi-card--neutral { border-top: 3px solid #cbd5e1; }

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 0.35rem;
}

.kpi-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* ── Alerts panel ─────────────────────────────────────────────────────────── */
.alerts-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.alerts-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.alert-none {
  font-size: 0.875rem;
  color: #16a34a;
  font-weight: 500;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 0.6rem 0.875rem;
}

.alert-icon { flex-shrink: 0; font-size: 0.9rem; }
.alert-text { line-height: 1.4; }

/* ── Action buttons ───────────────────────────────────────────────────────── */
.gdpr-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-export {
  background: #f59e0b;
  color: #0f172a;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  display: inline-flex;
  align-items: center;
}
.btn-export:hover { background: #d97706; }

.btn-consents {
  background: #0f172a;
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: opacity 0.12s;
}
.btn-consents:hover { opacity: 0.85; }
</style>
