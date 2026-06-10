<template>
  <AppLayout>
    <!-- Page header -->
    <div class="page-header">
      <h1 class="page-title">{{ t('assets.title') }}</h1>
      <div class="header-actions">
        <input
          v-model="search"
          type="text"
          class="search-input"
          :placeholder="t('assets.searchPlaceholder')"
        />
        <button
          class="btn-filters"
          :class="{ 'btn-filters--active': activeFilterCount > 0 }"
          @click="filtersOpen = !filtersOpen"
        >
          {{ t('assets.filters') }}
          <span v-if="activeFilterCount > 0" class="filter-badge">
            {{ t('assets.activeFilters', { count: activeFilterCount }) }}
          </span>
        </button>
        <RouterLink to="/assets/bulk-upload" class="btn-navy">
          {{ t('bulk.title') }}
        </RouterLink>
        <RouterLink to="/assets/upload" class="btn-primary">
          + {{ t('assets.upload') }}
        </RouterLink>
      </div>
    </div>

    <!-- Collapsible filter panel -->
    <div v-show="filtersOpen" class="filter-panel">
      <div class="filter-panel-body">
        <!-- Type checkboxes -->
        <div class="filter-group">
          <p class="filter-group-label">{{ t('assets.allTypes') }}</p>
          <div class="checkbox-group">
            <label v-for="opt in typeOptions" :key="opt.value" class="checkbox-label">
              <input type="checkbox" v-model="panelTypes" :value="opt.value" class="check-input" />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <!-- Consent status -->
        <div class="filter-group">
          <p class="filter-group-label">{{ t('assets.consentStatus.label') }}</p>
          <div class="radio-group">
            <label v-for="opt in consentStatusOptions" :key="opt.value" class="radio-label">
              <input
                type="radio"
                v-model="panelConsentStatus"
                :value="opt.value"
                class="check-input"
              />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <!-- Date range -->
        <div class="filter-group">
          <p class="filter-group-label">{{ t('assets.dateRange.label') }}</p>
          <div class="date-range">
            <input v-model="panelDateFrom" type="date" class="date-input" />
            <span class="date-sep">–</span>
            <input v-model="panelDateTo" type="date" class="date-input" />
          </div>
        </div>

        <!-- Press kit -->
        <div class="filter-group">
          <p class="filter-group-label">{{ t('assets.pressKitFilter.label') }}</p>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="panelPressKit" value="" class="check-input" />
              {{ t('assets.pressKitFilter.all') }}
            </label>
            <label class="radio-label">
              <input type="radio" v-model="panelPressKit" value="1" class="check-input" />
              {{ t('assets.pressKitFilter.yes') }}
            </label>
            <label class="radio-label">
              <input type="radio" v-model="panelPressKit" value="0" class="check-input" />
              {{ t('assets.pressKitFilter.no') }}
            </label>
          </div>
        </div>

        <!-- Emergency kit -->
        <div class="filter-group">
          <p class="filter-group-label">{{ t('assets.emergencyKitFilter.label') }}</p>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="panelEmergencyKit" value="" class="check-input" />
              {{ t('assets.emergencyKitFilter.all') }}
            </label>
            <label class="radio-label">
              <input type="radio" v-model="panelEmergencyKit" value="1" class="check-input" />
              {{ t('assets.emergencyKitFilter.yes') }}
            </label>
            <label class="radio-label">
              <input type="radio" v-model="panelEmergencyKit" value="0" class="check-input" />
              {{ t('assets.emergencyKitFilter.no') }}
            </label>
          </div>
        </div>
      </div>

      <div class="filter-panel-actions">
        <button class="btn-apply" @click="applyFilters">{{ t('assets.applyFilters') }}</button>
        <button class="btn-clear-panel" @click="clearFilters">{{ t('assets.clearFilters') }}</button>
      </div>
    </div>

    <!-- AI search bar -->
    <div class="ai-bar">
      <span class="ai-bar-label">🧠 {{ t('assets.aiSearch') }}</span>
      <div class="ai-bar-row">
        <input
          v-model="nlQuery"
          type="text"
          class="ai-input"
          :placeholder="t('assets.aiSearchPlaceholder')"
          @keyup.enter="handleNLSearch"
        />
        <button
          class="ai-send-btn"
          :disabled="nlLoading || !nlQuery"
          @click="handleNLSearch"
        >
          {{ nlLoading ? '...' : t('assets.searchBtn') }}
        </button>
      </div>
      <div v-if="nlFilters" class="ai-filters-row">
        <span v-for="(value, key) in nlFilters" :key="key" class="ai-filter-chip">
          {{ key }}: {{ value }}
        </span>
        <button class="ai-clear-btn" @click="clearNLSearch">{{ t('assets.clear') }}</button>
      </div>
    </div>

    <!-- Toolbar: showing info + per-page (hidden during NL search) -->
    <div v-if="!nlFilters" class="toolbar">
      <p v-if="!loading && meta.total > 0" class="showing-info">
        {{ t('assets.showing', { from: showingFrom, to: showingTo, total: meta.total }) }}
      </p>
      <p v-else class="showing-info"></p>
      <div class="per-page-control">
        <label class="per-page-label">{{ t('assets.perPage') }}</label>
        <select v-model.number="perPage" class="per-page-select" @change="fetchAssets(1)">
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="48">48</option>
        </select>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="asset-grid">
      <div v-for="n in perPage" :key="n" class="skeleton-card">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--sub"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="displayedAssets.length === 0" class="empty-state">
      <span class="empty-icon">🗂️</span>
      <p class="empty-text">
        {{ hasActiveFilters ? t('assets.noResultsFiltered') : t('assets.noResults') }}
      </p>
      <button v-if="hasActiveFilters" class="btn-clear-empty" @click="clearFilters">
        {{ t('assets.clearFilters') }}
      </button>
    </div>

    <!-- Asset grid -->
    <div v-else class="asset-grid">
      <RouterLink
        v-for="asset in displayedAssets"
        :key="asset.id"
        :to="`/assets/${asset.id}`"
        class="asset-card"
      >
        <div class="card-thumb">
          <img
            v-if="isImage(asset)"
            :src="asset.url"
            :alt="asset.original_name"
            loading="lazy"
            decoding="async"
            class="card-img"
          />
          <AssetTypeIcon v-else :mime-type="asset.mime_type" :size="40" class="card-type-icon" />
        </div>
        <div class="card-body">
          <p class="card-title">{{ getTitle(asset) }}</p>
          <span
            class="status-badge"
            :class="{
              'status-badge--processed': asset.status === 'processed',
              'status-badge--pending': asset.status === 'pending',
              'status-badge--failed': asset.status === 'failed',
            }"
          >
            {{
              asset.status === 'processed'
                ? t('assets.status.processed')
                : asset.status === 'pending'
                  ? t('assets.status.pending')
                  : t('assets.status.error')
            }}
          </span>
          <div v-if="asset.metadata?.tags?.length" class="card-tags">
            <span v-for="tag in asset.metadata.tags.slice(0, 3)" :key="tag" class="card-tag">
              {{ tag }}
            </span>
          </div>
          <p class="card-meta">{{ asset.uploaded_by }} · {{ formatSize(asset.size_kb) }}</p>
        </div>
      </RouterLink>
    </div>

    <!-- Pagination (hidden during NL search) -->
    <div v-if="!nlFilters && meta.last_page > 1" class="pagination">
      <button
        class="btn-secondary"
        :disabled="meta.current_page === 1"
        @click="changePage(meta.current_page - 1)"
      >
        {{ t('assets.prevPage') }}
      </button>
      <span class="pagination-info">{{ meta.current_page }} / {{ meta.last_page }}</span>
      <button
        class="btn-secondary"
        :disabled="meta.current_page === meta.last_page"
        @click="changePage(meta.current_page + 1)"
      >
        {{ t('assets.nextPage') }}
      </button>
    </div>

    <!-- NL search count -->
    <p v-if="nlFilters" class="count-line">
      {{ displayedAssets.length }} {{ t('assets.foundByAI') }}
    </p>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import AssetTypeIcon from '../components/AssetTypeIcon.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t } = useI18n()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

// ── UI state ──────────────────────────────────────────────────────────────────
const loading = ref(true)
const filtersOpen = ref(false)

// ── Assets data ────────────────────────────────────────────────────────────────
const assets = ref([])
const meta = ref({ total: 0, per_page: 12, current_page: 1, last_page: 1 })

// ── Applied (active) filters ──────────────────────────────────────────────────
const search = ref('')
const appliedTypes = ref([])
const appliedConsentStatus = ref('')
const appliedDateFrom = ref('')
const appliedDateTo = ref('')
const appliedPressKit = ref('')
const appliedEmergencyKit = ref('')
const perPage = ref(12)

// ── Panel (uncommitted) filters ───────────────────────────────────────────────
const panelTypes = ref([])
const panelConsentStatus = ref('')
const panelDateFrom = ref('')
const panelDateTo = ref('')
const panelPressKit = ref('')
const panelEmergencyKit = ref('')

// ── AI search ─────────────────────────────────────────────────────────────────
const nlAssets = ref([])
const nlQuery = ref('')
const nlFilters = ref(null)
const nlLoading = ref(false)

// ── Options ───────────────────────────────────────────────────────────────────
const typeOptions = computed(() => [
  { value: 'image', label: t('assets.images') },
  { value: 'video', label: t('assets.videos') },
  { value: 'audio', label: t('assets.audios') },
  { value: 'pdf',   label: t('assets.pdfs') },
  { value: 'word',  label: t('assets.words') },
  { value: 'text',  label: t('assets.texts') },
])

const consentStatusOptions = computed(() => [
  { value: '',         label: t('assets.consentStatus.all') },
  { value: 'obtained', label: t('assets.consentStatus.obtained') },
  { value: 'pending',  label: t('assets.consentStatus.pending') },
  { value: 'denied',   label: t('assets.consentStatus.denied') },
  { value: 'none',     label: t('assets.consentStatus.none') },
])

// ── Computed ──────────────────────────────────────────────────────────────────
const displayedAssets = computed(() => (nlFilters.value ? nlAssets.value : assets.value))

const activeFilterCount = computed(() => {
  let n = 0
  if (appliedTypes.value.length) n++
  if (appliedConsentStatus.value) n++
  if (appliedDateFrom.value) n++
  if (appliedDateTo.value) n++
  if (appliedPressKit.value !== '') n++
  if (appliedEmergencyKit.value !== '') n++
  return n
})

const hasActiveFilters = computed(() => search.value !== '' || activeFilterCount.value > 0)

const showingFrom = computed(() => {
  if (meta.value.total === 0) return 0
  return (meta.value.current_page - 1) * meta.value.per_page + 1
})

const showingTo = computed(() =>
  Math.min(meta.value.current_page * meta.value.per_page, meta.value.total),
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function isImage(asset) {
  return asset.mime_type?.startsWith('image/')
}

function formatSize(kb) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function getTitle(asset) {
  return asset.metadata?.title || asset.original_name
}

// ── URL sync ──────────────────────────────────────────────────────────────────
function buildParams(page = 1) {
  const p = {}
  if (search.value) p.search = search.value
  if (appliedTypes.value.length) p.type = appliedTypes.value
  if (appliedConsentStatus.value) p.consent_status = appliedConsentStatus.value
  if (appliedDateFrom.value) p.date_from = appliedDateFrom.value
  if (appliedDateTo.value) p.date_to = appliedDateTo.value
  if (appliedPressKit.value !== '') p.press_kit = appliedPressKit.value
  if (appliedEmergencyKit.value !== '') p.emergency_kit = appliedEmergencyKit.value
  if (perPage.value !== 12) p.per_page = perPage.value
  if (page > 1) p.page = page
  return p
}

function syncUrl(page) {
  router.replace({ query: buildParams(page) })
}

function restoreFromUrl() {
  const q = route.query
  if (q.search) search.value = q.search
  if (q.type) {
    const types = Array.isArray(q.type) ? q.type : [q.type]
    appliedTypes.value = types
    panelTypes.value = [...types]
  }
  if (q.consent_status) {
    appliedConsentStatus.value = q.consent_status
    panelConsentStatus.value = q.consent_status
  }
  if (q.date_from) {
    appliedDateFrom.value = q.date_from
    panelDateFrom.value = q.date_from
  }
  if (q.date_to) {
    appliedDateTo.value = q.date_to
    panelDateTo.value = q.date_to
  }
  if (q.press_kit !== undefined) {
    appliedPressKit.value = q.press_kit
    panelPressKit.value = q.press_kit
  }
  if (q.emergency_kit !== undefined) {
    appliedEmergencyKit.value = q.emergency_kit
    panelEmergencyKit.value = q.emergency_kit
  }
  if (q.per_page) perPage.value = Number(q.per_page)
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchAssets(page = 1) {
  loading.value = true
  try {
    const response = await api.get('/assets', { params: buildParams(page) })
    assets.value = response.data.data
    meta.value = response.data.meta
    syncUrl(page)
  } catch {
    // handled by axios interceptor
  } finally {
    loading.value = false
  }
}

// ── Filter actions ────────────────────────────────────────────────────────────
function applyFilters() {
  appliedTypes.value = [...panelTypes.value]
  appliedConsentStatus.value = panelConsentStatus.value
  appliedDateFrom.value = panelDateFrom.value
  appliedDateTo.value = panelDateTo.value
  appliedPressKit.value = panelPressKit.value
  appliedEmergencyKit.value = panelEmergencyKit.value
  fetchAssets(1)
}

function clearFilters() {
  search.value = ''
  panelTypes.value = []
  panelConsentStatus.value = ''
  panelDateFrom.value = ''
  panelDateTo.value = ''
  panelPressKit.value = ''
  panelEmergencyKit.value = ''
  appliedTypes.value = []
  appliedConsentStatus.value = ''
  appliedDateFrom.value = ''
  appliedDateTo.value = ''
  appliedPressKit.value = ''
  appliedEmergencyKit.value = ''
  fetchAssets(1)
}

// ── AI search ─────────────────────────────────────────────────────────────────
async function handleNLSearch() {
  if (!nlQuery.value) return
  nlLoading.value = true
  try {
    const response = await api.post('/rag/nl-search', { query: nlQuery.value })
    nlAssets.value = response.data.data
    nlFilters.value = response.data.filters
    toast.success(t('assets.aiFound', { count: response.data.total }))
  } catch (e) {
    if (e.response?.status === 503) {
      toast.error(t('assets.aiBusy'))
    } else {
      toast.error(t('assets.aiError'))
    }
    nlFilters.value = null
    nlAssets.value = []
  } finally {
    nlLoading.value = false
  }
}

function clearNLSearch() {
  nlQuery.value = ''
  nlFilters.value = null
  nlAssets.value = []
  fetchAssets(1)
}

function changePage(page) {
  if (page < 1 || page > meta.value.last_page) return
  fetchAssets(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Watchers ──────────────────────────────────────────────────────────────────
let debounceTimer = null
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchAssets(1), 300)
})
onUnmounted(() => clearTimeout(debounceTimer))

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  restoreFromUrl()
  fetchAssets(Number(route.query.page) || 1)
})
</script>

<style scoped>
/* ── Page header ─────────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-input {
  width: 240px;
  height: 32px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input::placeholder { color: #94a3b8; }

.search-input:focus {
  border-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06);
}

.btn-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
}

.btn-filters:hover { background: #f8fafc; border-color: #cbd5e1; }

.btn-filters--active {
  border-color: #0f172a;
  color: #0f172a;
  font-weight: 500;
}

.filter-badge {
  background: #0f172a;
  color: #f59e0b;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9999px;
  padding: 1px 6px;
  line-height: 1.4;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  background: #0f172a;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.btn-primary:hover { background: #1e293b; }

.btn-navy {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  background: #0f172a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.btn-navy:hover { opacity: 0.85; }

/* ── Filter panel ────────────────────────────────────────────────────────────── */
.filter-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.filter-panel-body {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  padding: 16px 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.filter-group-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.checkbox-group,
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.check-input {
  width: 14px;
  height: 14px;
  accent-color: #0f172a;
  cursor: pointer;
  flex-shrink: 0;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input {
  height: 30px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  color: #374151;
  outline: none;
  transition: border-color 0.15s ease;
  max-width: 130px;
}

.date-input:focus { border-color: #cbd5e1; }

.date-sep {
  font-size: 13px;
  color: #94a3b8;
}

.filter-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.btn-apply {
  height: 30px;
  padding: 0 16px;
  background: #0f172a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-apply:hover { background: #1e293b; }

.btn-clear-panel {
  height: 30px;
  padding: 0 12px;
  background: none;
  color: #64748b;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.btn-clear-panel:hover { color: #374151; }

/* ── AI search bar ───────────────────────────────────────────────────────────── */
.ai-bar {
  background: #0f172a;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-bar-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: 500;
}

.ai-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 13px;
}

.ai-input::placeholder { color: rgba(255, 255, 255, 0.4); }

.ai-send-btn {
  background: #f59e0b;
  color: #0f172a;
  font-weight: 500;
  font-size: 13px;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.ai-send-btn:hover:not(:disabled) { background: #fbbf24; }
.ai-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.ai-filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.ai-filter-chip {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  border-radius: 9999px;
  padding: 2px 8px;
}

.ai-clear-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color 0.15s ease;
}

.ai-clear-btn:hover { color: rgba(255, 255, 255, 0.85); }

/* ── Toolbar ─────────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  min-height: 28px;
}

.showing-info {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.per-page-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.per-page-label {
  font-size: 12px;
  color: #94a3b8;
}

.per-page-select {
  height: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
  background: #ffffff;
  transition: border-color 0.15s ease;
}

.per-page-select:focus { border-color: #cbd5e1; }

/* ── Asset grid ──────────────────────────────────────────────────────────────── */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* ── Asset card ──────────────────────────────────────────────────────────────── */
.asset-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  display: block;
  transition: box-shadow 0.18s ease;
}

.asset-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }

.card-thumb {
  height: 140px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-type-icon { opacity: 0.85; }

.card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

/* ── Status badges ───────────────────────────────────────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  width: fit-content;
}

.status-badge--processed { background: #dcfce7; color: #166534; }
.status-badge--pending   { background: #fef9c3; color: #854d0e; }
.status-badge--failed    { background: #fee2e2; color: #991b1b; }

/* ── Card tags ───────────────────────────────────────────────────────────────── */
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; }

.card-tag {
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 6px;
}

.card-meta {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Skeleton cards ──────────────────────────────────────────────────────────── */
.skeleton-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-thumb {
  height: 140px;
  background: #f1f5f9;
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  border-radius: 4px;
  background: #f1f5f9;
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-line--title { height: 12px; width: 70%; }
.skeleton-line--sub   { height: 10px; width: 45%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 10px;
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 2.5rem;
  line-height: 1;
  opacity: 0.4;
}

.empty-text {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.btn-clear-empty {
  height: 30px;
  padding: 0 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  margin-top: 4px;
}

.btn-clear-empty:hover { background: #f8fafc; border-color: #cbd5e1; }

/* ── Pagination ──────────────────────────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-secondary:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

.pagination-info { font-size: 13px; color: #64748b; }

/* ── NL count line ───────────────────────────────────────────────────────────── */
.count-line {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 8px;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
    flex: 1;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .filter-panel-body {
    flex-direction: column;
    gap: 16px;
  }

  .date-range {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .date-input { max-width: 100%; width: 100%; }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
