<!-- ImpactDashboardView.vue — RJC -->
<template>
  <AppLayout :title="t('reports.dashboard.title')">
    <div class="impact-dashboard">

      <!-- Header -->
      <div class="dash-header">
        <p class="dash-subtitle">{{ t('reports.dashboard.subtitle') }}</p>
        <div class="dash-header-actions">
          <span v-if="checkedAt" class="dash-meta-text">
            {{ t('reports.dashboard.lastChecked') }}: {{ checkedAt }}
          </span>
          <span class="dash-meta-text">{{ t('reports.dashboard.autoRefresh') }}</span>
          <button class="btn-refresh" :disabled="loading" @click="fetchData">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {{ t('reports.dashboard.refreshNow') }}
          </button>
          <RouterLink to="/reports" class="btn-pdf">
            {{ t('reports.dashboard.viewPdfReport') }}
          </RouterLink>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading && !data" class="dash-loading">
        {{ t('reports.dashboard.loading') }}
      </div>

      <template v-else-if="data">

        <!-- 6 KPI cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <p class="kpi-value">{{ data.summary.total_assets }}</p>
            <p class="kpi-label">{{ t('reports.dashboard.kpi.totalAssets') }}</p>
            <div class="kpi-bar kpi-bar--navy" />
          </div>
          <div class="kpi-card">
            <p class="kpi-value">{{ data.summary.public_assets }}</p>
            <p class="kpi-label">{{ t('reports.dashboard.kpi.publicAssets') }}</p>
            <div class="kpi-bar kpi-bar--blue" />
          </div>
          <div class="kpi-card">
            <p class="kpi-value">{{ data.summary.consents_granted }}</p>
            <p class="kpi-label">{{ t('reports.dashboard.kpi.consentsGranted') }}</p>
            <div class="kpi-bar kpi-bar--green" />
          </div>
          <div class="kpi-card">
            <p class="kpi-value">{{ data.summary.alt_texts_generated }}</p>
            <p class="kpi-label">{{ t('reports.dashboard.kpi.altTextsGenerated') }}</p>
            <div class="kpi-bar kpi-bar--purple" />
          </div>
          <div class="kpi-card">
            <p class="kpi-value">{{ data.summary.hours_saved }}<span class="kpi-unit">h</span></p>
            <p class="kpi-label">{{ t('reports.dashboard.kpi.hoursSaved') }}</p>
            <div class="kpi-bar kpi-bar--gold" />
          </div>
          <div class="kpi-card">
            <p class="kpi-value">{{ data.trends.assets_last_30_days }}</p>
            <p class="kpi-label">{{ t('reports.dashboard.kpi.assetsLast30') }}</p>
            <div class="kpi-bar kpi-bar--gold" />
          </div>
        </div>

        <!-- Line + Bar charts -->
        <div class="charts-row">
          <div class="chart-card">
            <h3 class="chart-title">{{ t('reports.dashboard.charts.assetsPerMonth') }}</h3>
            <div class="chart-wrap">
              <canvas ref="assetsChartRef" />
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">{{ t('reports.dashboard.charts.consentsPerMonth') }}</h3>
            <div class="chart-wrap">
              <canvas ref="consentsChartRef" />
            </div>
          </div>
        </div>

        <!-- Top 5 most viewed assets -->
        <div class="top-assets-card">
          <h3 class="chart-title">{{ t('reports.dashboard.charts.topAssets') }}</h3>
          <div v-if="!data.top_assets.length" class="no-data">
            {{ t('reports.dashboard.charts.noData') }}
          </div>
          <div v-else class="top-assets-list">
            <div
              v-for="(asset, i) in data.top_assets"
              :key="asset.id"
              class="top-asset-row"
            >
              <span class="top-asset-rank">{{ i + 1 }}</span>
              <img
                v-if="asset.thumbnail"
                :src="asset.thumbnail"
                :alt="asset.title"
                class="top-asset-thumb"
              />
              <div v-else class="top-asset-thumb-placeholder">📄</div>
              <div class="top-asset-info">
                <RouterLink :to="`/assets/${asset.id}`" class="top-asset-title">
                  {{ asset.title }}
                </RouterLink>
              </div>
              <span class="top-asset-views">
                {{ asset.view_count }} {{ t('reports.dashboard.charts.views') }}
              </span>
            </div>
          </div>
        </div>

      </template>
    </div>
  </AppLayout>
</template>

<script setup>
// RJC — Impact Dashboard View
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables } from 'chart.js'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

Chart.register(...registerables)

const { t } = useI18n()
const toast = useToastStore()

const data      = ref(null)
const loading   = ref(false)
const checkedAt = ref('')

const assetsChartRef   = ref(null)
const consentsChartRef = ref(null)
let assetsChart   = null
let consentsChart = null
let refreshInterval = null

async function fetchData() {
  loading.value = true
  try {
    const res   = await api.get('/reports/impact-dashboard')
    data.value      = res.data.data
    checkedAt.value = new Date().toLocaleTimeString()
  } catch {
    toast.error(t('reports.error'))
  } finally {
    loading.value = false
  }
}

function buildCharts() {
  if (!data.value) return

  const months        = data.value.trends.assets_by_month.map(m => m.month)
  const assetCounts   = data.value.trends.assets_by_month.map(m => m.count)
  const consentCounts = (data.value.trends.consents_by_month ?? []).map(m => m.count)

  if (assetsChart)   { assetsChart.destroy();   assetsChart   = null }
  if (consentsChart) { consentsChart.destroy(); consentsChart = null }

  if (assetsChartRef.value) {
    assetsChart = new Chart(assetsChartRef.value, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: t('reports.dashboard.charts.assetsPerMonth'),
          data: assetCounts,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.10)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
          x: { grid: { display: false } },
        },
      },
    })
  }

  if (consentsChartRef.value) {
    consentsChart = new Chart(consentsChartRef.value, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: t('reports.dashboard.charts.consentsPerMonth'),
          data: consentCounts,
          backgroundColor: 'rgba(15,23,42,0.75)',
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
          x: { grid: { display: false } },
        },
      },
    })
  }
}

// Re-build charts after data loads and DOM has updated
watch(data, async () => {
  await nextTick()
  buildCharts()
})

onMounted(() => {
  fetchData()
  refreshInterval = setInterval(fetchData, 5 * 60 * 1000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  if (assetsChart)   assetsChart.destroy()
  if (consentsChart) consentsChart.destroy()
})
</script>

<style scoped>
.impact-dashboard {
  max-width: 1000px;
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dash-subtitle { font-size: 0.875rem; color: #64748b; }

.dash-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dash-meta-text { font-size: 0.75rem; color: #94a3b8; }

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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

.btn-pdf {
  height: 30px;
  padding: 0 14px;
  background: #0f172a;
  color: #f59e0b;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: opacity 0.12s;
}
.btn-pdf:hover { opacity: 0.85; }

/* ── Loading ─────────────────────────────────────────────────────────────────── */
.dash-loading {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* ── KPI grid ────────────────────────────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 1rem 1rem 0;
  overflow: hidden;
}

.kpi-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 0.3rem;
}

.kpi-unit { font-size: 1rem; font-weight: 500; color: #64748b; margin-left: 2px; }

.kpi-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.kpi-bar { height: 3px; border-radius: 999px; margin: 0 -1rem; }

.kpi-bar--navy   { background: #0f172a; }
.kpi-bar--blue   { background: #3b82f6; }
.kpi-bar--green  { background: #22c55e; }
.kpi-bar--purple { background: #a855f7; }
.kpi-bar--gold   { background: #f59e0b; }

/* ── Charts ──────────────────────────────────────────────────────────────────── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 700px) { .charts-row { grid-template-columns: 1fr; } }

.chart-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 1rem;
}

.chart-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.chart-wrap { height: 180px; position: relative; }

/* ── Top assets ──────────────────────────────────────────────────────────────── */
.top-assets-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 1rem;
}

.no-data {
  font-size: 0.875rem;
  color: #94a3b8;
  text-align: center;
  padding: 1.5rem 0;
}

.top-assets-list { display: flex; flex-direction: column; gap: 0; }

.top-asset-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.top-asset-row:last-child { border-bottom: none; }

.top-asset-rank {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.top-asset-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f1f5f9;
}

.top-asset-thumb-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.top-asset-info { flex: 1; min-width: 0; }

.top-asset-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #0f172a;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.top-asset-title:hover { text-decoration: underline; }

.top-asset-views {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
