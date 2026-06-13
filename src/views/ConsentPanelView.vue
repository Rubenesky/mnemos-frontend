<template>
  <AppLayout :title="t('consent.title')">
    <template #actions>
      <input
        v-model="searchQuery"
        type="search"
        class="search-input"
        :placeholder="t('consent.searchPlaceholder')"
        @input="onSearchInput"
      />
      <button class="btn-secondary" @click="exportCsv" :disabled="exportLoading">
        {{ exportLoading ? t('consent.exporting') : t('consent.exportCsv') }}
      </button>
      <button class="btn-primary" @click="openAddModal">{{ t('consent.add') }}</button>
    </template>

    <!-- Filter pills row -->
    <div class="filter-pills-row">
      <div class="filter-pills" role="group" aria-label="Filter by status">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          class="filter-pill"
          :class="{ 'filter-pill--active': statusFilter === opt.value }"
          @click="setStatusFilter(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Main table card -->
    <div class="table-card">
      <!-- Loading -->
      <div v-if="loading" class="state-message">{{ t('consent.loading') }}</div>

      <!-- Empty -->
      <div v-else-if="consents.length === 0" class="state-message">
        {{ t('consent.noRecords') }}
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('consent.table.asset') }}</th>
              <th>{{ t('consent.table.person') }}</th>
              <th>{{ t('consent.table.date') }}</th>
              <th>{{ t('consent.table.type') }}</th>
              <th>{{ t('consent.table.status') }}</th>
              <th>{{ t('consent.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consent in consents" :key="consent.id">
              <!-- Asset thumbnail + name -->
              <td class="td-asset">
                <div class="asset-cell">
                  <div class="asset-thumb-wrap">
                    <img
                      v-if="consent.asset?.url && isImage(consent.asset)"
                      :src="consent.asset.url"
                      :alt="consent.asset.original_name"
                      class="asset-thumb"
                    />
                    <div v-else class="asset-thumb-placeholder">
                      <span class="asset-thumb-icon">&#128196;</span>
                    </div>
                  </div>
                  <span class="asset-name">
                    {{ consent.asset?.metadata?.title ?? consent.asset?.original_name ?? '—' }}
                    <span
                      v-if="consent.status === 'pending'"
                      class="warning-icon"
                      title="This asset cannot be published — pending consents"
                    >&#9888;</span>
                  </span>
                </div>
              </td>
              <td class="td-person">{{ consent.person_name }}</td>
              <td class="td-date">{{ formatDate(consent.consent_date) }}</td>
              <td class="td-type">
                <span class="type-badge">{{ t(`asset_type.${consent.consent_type}`) }}</span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="`status-badge--${consent.status}`"
                >
                  {{ t(`consent.status.${consent.status}`) }}
                </span>
              </td>
              <td class="td-actions">
                <button
                  v-if="consent.status === 'pending'"
                  class="action-btn action-btn--send"
                  :disabled="linkLoading === consent.id"
                  @click="sendRequest(consent)"
                  title="Enviar solicitud de consentimiento"
                  aria-label="Enviar solicitud"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
                <button
                  class="action-btn action-btn--edit"
                  @click="openEditModal(consent)"
                  title="Edit"
                  aria-label="Edit consent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  class="action-btn action-btn--delete"
                  @click="openDeleteModal(consent)"
                  title="Delete"
                  aria-label="Delete consent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="pagination">
        <button
          class="btn-secondary"
          :disabled="pagination.current_page <= 1"
          @click="goToPage(pagination.current_page - 1)"
        >
          {{ t('consent.pagination.previous') }}
        </button>
        <span class="pagination-info">
          {{ t('consent.pagination.page') }} {{ pagination.current_page }} {{ t('consent.pagination.of') }} {{ pagination.last_page }}
        </span>
        <button
          class="btn-secondary"
          :disabled="pagination.current_page >= pagination.last_page"
          @click="goToPage(pagination.current_page + 1)"
        >
          {{ t('consent.pagination.next') }}
        </button>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="closeFormModal"
      @keydown.escape.window="closeFormModal"
    >
      <div class="modal-card" role="dialog" aria-modal="true" :aria-label="editingConsent ? t('consent.modal.editTitle') : t('consent.modal.addTitle')">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingConsent ? t('consent.modal.editTitle') : t('consent.modal.addTitle') }}</h2>
          <button class="modal-close" @click="closeFormModal" aria-label="Close">&times;</button>
        </div>

        <form @submit.prevent="saveConsent" class="modal-form">
          <!-- Asset -->
          <div class="form-field">
            <label class="form-label" for="c-asset">{{ t('consent.form.asset') }}</label>
            <select id="c-asset" v-model="form.asset_id" class="form-input" required>
              <option value="" disabled>{{ t('consent.form.selectAsset') }}</option>
              <option v-for="a in assets" :key="a.id" :value="a.id">
                {{ a.metadata?.title ?? a.original_name }}
              </option>
            </select>
            <span v-if="formErrors.asset_id" class="form-error">{{ formErrors.asset_id }}</span>
          </div>

          <!-- Person name -->
          <div class="form-field">
            <label class="form-label" for="c-person">{{ t('consent.form.personName') }}</label>
            <input
              id="c-person"
              v-model="form.person_name"
              type="text"
              class="form-input"
              placeholder="e.g. Jane Smith"
              required
            />
            <span v-if="formErrors.person_name" class="form-error">{{ formErrors.person_name }}</span>
          </div>

          <!-- Person email -->
          <div class="form-field">
            <label class="form-label" for="c-email">
              {{ t('consent.form.personEmail') }} <span class="form-optional">{{ t('consent.form.notesOptional') }}</span>
            </label>
            <input
              id="c-email"
              v-model="form.person_email"
              type="email"
              class="form-input"
              :placeholder="t('consent.form.personEmailHint')"
            />
            <span class="form-hint">{{ t('consent.form.personEmailHint') }}</span>
            <span v-if="formErrors.person_email" class="form-error">{{ formErrors.person_email }}</span>
          </div>

          <!-- Consent date -->
          <div class="form-field">
            <label class="form-label" for="c-date">{{ t('consent.form.consentDate') }}</label>
            <input
              id="c-date"
              v-model="form.consent_date"
              type="date"
              class="form-input"
              required
            />
            <span v-if="formErrors.consent_date" class="form-error">{{ formErrors.consent_date }}</span>
          </div>

          <!-- Type -->
          <div class="form-field">
            <label class="form-label" for="c-type">{{ t('consent.form.type') }}</label>
            <select id="c-type" v-model="form.consent_type" class="form-input" required>
              <option value="" disabled>{{ t('consent.form.selectType') }}</option>
              <option value="photo">{{ t('consent.form.typePhoto') }}</option>
              <option value="video">{{ t('consent.form.typeVideo') }}</option>
              <option value="audio">{{ t('consent.form.typeAudio') }}</option>
              <option value="general">{{ t('consent.form.typeGeneral') }}</option>
            </select>
            <span v-if="formErrors.consent_type" class="form-error">{{ formErrors.consent_type }}</span>
          </div>

          <!-- Status -->
          <div class="form-field">
            <label class="form-label" for="c-status">{{ t('consent.form.status') }}</label>
            <select id="c-status" v-model="form.status" class="form-input" required>
              <option value="" disabled>{{ t('consent.form.selectStatus') }}</option>
              <option value="obtained">{{ t('consent.status.obtained') }}</option>
              <option value="pending">{{ t('consent.status.pending') }}</option>
              <option value="denied">{{ t('consent.status.denied') }}</option>
            </select>
            <span v-if="formErrors.status" class="form-error">{{ formErrors.status }}</span>
          </div>

          <!-- Notes -->
          <div class="form-field">
            <label class="form-label" for="c-notes">
              {{ t('consent.form.notes') }} <span class="form-optional">{{ t('consent.form.notesOptional') }}</span>
            </label>
            <textarea
              id="c-notes"
              v-model="form.notes"
              class="form-input form-textarea"
              rows="3"
              placeholder="Any additional notes..."
            ></textarea>
            <span v-if="formErrors.notes" class="form-error">{{ formErrors.notes }}</span>
          </div>

          <!-- Document upload -->
          <div class="form-field">
            <label class="form-label" for="c-document">
              {{ t('consent.form.document') }} <span class="form-optional">{{ t('consent.form.documentOptional') }}</span>
            </label>
            <input
              id="c-document"
              type="file"
              class="form-input form-file"
              accept=".pdf,.jpg,.jpeg,.png"
              @change="onDocumentChange"
            />
            <span v-if="formErrors.document" class="form-error">{{ formErrors.document }}</span>
          </div>

          <!-- Modal actions -->
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeFormModal">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="formLoading">
              {{ formLoading ? t('consent.modal.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
      @keydown.escape.window="closeDeleteModal"
    >
      <div class="modal-card modal-card--sm" role="dialog" aria-modal="true" aria-label="Confirm deletion">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('consent.modal.deleteTitle') }}</h2>
          <button class="modal-close" @click="closeDeleteModal" aria-label="Close">&times;</button>
        </div>
        <p class="delete-confirm-text">{{ t('consent.modal.deleteText') }}</p>
        <div class="modal-actions modal-actions--delete">
          <button class="btn-secondary" @click="closeDeleteModal">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="confirmDelete" :disabled="deleteLoading">
            {{ deleteLoading ? t('consent.modal.deleting') : t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
    <!-- Send-request link modal -->
    <div
      v-if="showLinkModal"
      class="modal-overlay"
      @click.self="showLinkModal = false"
      @keydown.escape.window="showLinkModal = false"
    >
      <div class="modal-card modal-card--sm" role="dialog" aria-modal="true" :aria-label="t('consent.linkModal.ariaLabel')">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('consent.linkModal.title') }}</h2>
          <button class="modal-close" @click="showLinkModal = false" aria-label="Close">&times;</button>
        </div>
        <p class="link-modal-desc">
          {{ t('consent.linkModal.description') }}<br>
          <span class="link-modal-note">{{ t('consent.linkModal.expiry') }}</span>
        </p>
        <div class="link-copy-row">
          <input class="link-input" readonly :value="linkUrl" @focus="$event.target.select()" />
          <button class="btn-copy" @click="copyLink">{{ copied ? t('consent.linkModal.copied') : t('consent.linkModal.copy') }}</button>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLinkModal = false">{{ t('consent.linkModal.close') }}</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const toast = useToastStore()
const route = useRoute()

// ── State ──────────────────────────────────────────────────────────────
const consents = ref([])
const assets = ref([])
const pagination = ref(null)
const loading = ref(true)
const exportLoading = ref(false)
const formLoading = ref(false)
const deleteLoading = ref(false)

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const showLinkModal = ref(false)
const editingConsent = ref(null)
const deletingConsent = ref(null)
const linkLoading = ref(null)
const linkUrl = ref('')
const copied = ref(false)

const statusFilter = ref('')
const searchQuery = ref('')
let searchDebounce = null

const statusOptions = computed(() => [
  { label: t('consent.filter.all'), value: '' },
  { label: t('consent.filter.obtained'), value: 'obtained' },
  { label: t('consent.filter.pending'), value: 'pending' },
  { label: t('consent.filter.denied'), value: 'denied' },
])

function emptyForm() {
  return {
    asset_id: '',
    person_name: '',
    person_email: '',
    consent_date: '',
    consent_type: '',
    status: '',
    notes: '',
    document: null,
  }
}

const form = reactive(emptyForm())
const formErrors = reactive({})

// ── Lifecycle ──────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchConsents(), fetchAssets()])
})
onUnmounted(() => clearTimeout(searchDebounce))

// ── Data fetching ──────────────────────────────────────────────────────
async function fetchConsents(page = 1) {
  loading.value = true
  try {
    const params = { page }
    if (statusFilter.value) params.status = statusFilter.value
    if (searchQuery.value.trim()) params.person_name = searchQuery.value.trim()
    // Support ?asset_id= query param coming from AssetDetailView
    if (route.query.asset_id) params.asset_id = route.query.asset_id

    const { data } = await api.get('/consents', { params })
    consents.value = data.data?.data ?? []
    pagination.value = data.data ?? null
  } catch (e) {
    if (e?.response?.status === 403) {
      toast.error(t('consent.permissionError'))
    }
    // Other statuses handled by the global axios interceptor
  } finally {
    loading.value = false
  }
}

async function fetchAssets() {
  try {
    const { data } = await api.get('/assets', { params: { per_page: 200 } })
    assets.value = data.data?.data ?? data.data ?? []
  } catch {
    // Non-critical — asset dropdown falls back to empty list
  }
}

// ── Filters ────────────────────────────────────────────────────────────
function setStatusFilter(value) {
  statusFilter.value = value
  fetchConsents()
}

function onSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => fetchConsents(), 350)
}

function goToPage(page) {
  fetchConsents(page)
}

// ── CSV export ─────────────────────────────────────────────────────────
async function exportCsv() {
  exportLoading.value = true
  try {
    const response = await api.get('/consents/export/csv', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'consents.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // Handled by global interceptor
  } finally {
    exportLoading.value = false
  }
}

// ── Send consent request ───────────────────────────────────────────────
async function sendRequest(consent) {
  linkLoading.value = consent.id
  try {
    const { data } = await api.post(`/consents/${consent.id}/send-request`)
    linkUrl.value = data.data.url
    copied.value = false
    showLinkModal.value = true
  } catch {
    toast.error(t('consent.linkError'))
  } finally {
    linkLoading.value = null
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(linkUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard not available — user can copy manually
  }
}

// ── Add / Edit modal ───────────────────────────────────────────────────
function openAddModal() {
  editingConsent.value = null
  Object.assign(form, emptyForm())
  clearFormErrors()
  showFormModal.value = true
}

function openEditModal(consent) {
  editingConsent.value = consent
  Object.assign(form, {
    asset_id: consent.asset_id ?? consent.asset?.id ?? '',
    person_name: consent.person_name,
    person_email: consent.person_email || '',
    consent_date: consent.consent_date ?? '',
    consent_type: consent.consent_type,
    status: consent.status,
    notes: consent.notes ?? '',
    document: null,
  })
  clearFormErrors()
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingConsent.value = null
}

function clearFormErrors() {
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
}

function onDocumentChange(e) {
  form.document = e.target.files[0] ?? null
}

async function saveConsent() {
  clearFormErrors()
  formLoading.value = true

  try {
    const payload = new FormData()
    payload.append('asset_id', form.asset_id)
    payload.append('person_name', form.person_name)
    if (form.person_email) payload.append('person_email', form.person_email)
    payload.append('consent_date', form.consent_date)
    payload.append('consent_type', form.consent_type)
    payload.append('status', form.status)
    if (form.notes) payload.append('notes', form.notes)
    if (form.document) payload.append('document', form.document)

    if (editingConsent.value) {
      // Laravel requires _method override for multipart PATCH
      payload.append('_method', 'PATCH')
      await api.post(`/consents/${editingConsent.value.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(t('consent.updateSuccess'))
    } else {
      await api.post('/consents', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(t('consent.createSuccess'))
    }

    closeFormModal()
    await fetchConsents()
  } catch (e) {
    if (e?.response?.status === 403) {
      toast.error(t('consent.permissionError'))
    } else if (e?.response?.status === 422) {
      const errors = e.response.data?.errors ?? {}
      Object.assign(
        formErrors,
        Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]])),
      )
    }
    // Other errors handled by global interceptor
  } finally {
    formLoading.value = false
  }
}

// ── Delete modal ───────────────────────────────────────────────────────
function openDeleteModal(consent) {
  deletingConsent.value = consent
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingConsent.value = null
}

async function confirmDelete() {
  if (!deletingConsent.value) return
  deleteLoading.value = true
  try {
    await api.delete(`/consents/${deletingConsent.value.id}`)
    toast.success(t('consent.deleteSuccess'))
    closeDeleteModal()
    await fetchConsents()
  } catch (e) {
    if (e?.response?.status === 403) {
      toast.error(t('consent.permissionError'))
    }
  } finally {
    deleteLoading.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function isImage(asset) {
  return asset?.mime_type?.startsWith('image/')
}
</script>

<style scoped>
/* ── Filter pills row ── */
.filter-pills-row {
  margin-bottom: 12px;
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-pill {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #64748b;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 400;
  padding: 3px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  line-height: 1.6;
}

.filter-pill:hover {
  border-color: #94a3b8;
  color: #0f172a;
}

.filter-pill--active {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

/* ── Search input (rendered inside #actions slot) ── */
.search-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 13px;
  color: #0f172a;
  background: white;
  font-family: inherit;
  min-width: 200px;
  height: 32px;
  box-sizing: border-box;
  transition: border-color 0.12s ease;
}

.search-input:focus {
  outline: none;
  border-color: #0f172a;
}

.search-input::placeholder {
  color: #94a3b8;
}

/* ── Main table card ── */
.table-card {
  background: white;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 640px) {
  .table-card {
    box-shadow: inset -10px 0 10px -8px rgba(0, 0, 0, 0.08);
  }
}

.state-message {
  padding: 48px 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ── Table ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: #f8fafc;
}

.data-table th {
  padding: 8px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table tbody tr {
  border-bottom: 0.5px solid #f1f5f9;
  transition: background 0.1s ease;
}

.data-table tbody tr:last-child {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: rgba(248, 250, 252, 0.5);
}

.data-table td {
  padding: 10px 16px;
  color: #0f172a;
  vertical-align: middle;
}

/* ── Asset cell ── */
.td-asset {
  min-width: 180px;
}

.asset-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.asset-thumb-wrap {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f8fafc;
  border: 0.5px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.asset-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.asset-thumb-icon {
  font-size: 14px;
  line-height: 1;
}

.asset-name {
  font-size: 13px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.warning-icon {
  color: #f59e0b;
  margin-left: 4px;
  font-size: 12px;
  cursor: help;
}

.td-person,
.td-date {
  white-space: nowrap;
}

/* ── Status badge ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  white-space: nowrap;
}

.status-badge--obtained {
  background: #dcfce7;
  color: #166534;
}

.status-badge--pending {
  background: #fef9c3;
  color: #854d0e;
}

.status-badge--denied {
  background: #fee2e2;
  color: #991b1b;
}

/* ── Type badge ── */
.type-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 8px;
  white-space: nowrap;
}

/* ── Action buttons ── */
.td-actions {
  white-space: nowrap;
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  flex-shrink: 0;
}

.action-btn--send:hover {
  background: #fef9c3;
  color: #854d0e;
}

.action-btn--edit:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.action-btn--delete:hover {
  background: #fee2e2;
  color: #991b1b;
}

/* ── Pagination ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 0.5px solid #e2e8f0;
  padding: 12px;
}

.pagination-info {
  font-size: 12px;
  color: #64748b;
}

/* ── Shared button classes ── */
.btn-primary {
  background: #0f172a;
  color: #f59e0b;
  border: none;
  border-radius: 6px;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.12s ease;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.12s ease;
  white-space: nowrap;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  background: white;
  border-radius: 8px;
  border: 0.5px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
  padding: 24px;
  max-height: 92vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.modal-card--sm {
  max-width: 400px;
}

/* ── Modal header ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.12s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #0f172a;
}

/* ── Form inside modal ── */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.form-optional {
  font-weight: 400;
  color: #94a3b8;
  text-transform: none;
  letter-spacing: 0;
}

.form-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 13px;
  color: #0f172a;
  background: white;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.12s ease;
  appearance: auto;
}

.form-input:focus {
  outline: none;
  border-color: #0f172a;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  padding: 7px 10px;
}

.form-file {
  padding: 6px 10px;
  color: #64748b;
}

.form-error {
  font-size: 11px;
  color: #991b1b;
  margin-top: 2px;
}

/* ── Modal actions ── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}

/* ── Delete modal specific ── */
.delete-confirm-text {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 20px;
  line-height: 1.5;
}

.modal-actions--delete {
  padding-top: 0;
}

/* ── Link modal ── */
.link-modal-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px;
  line-height: 1.6;
}

.link-modal-note {
  font-size: 11px;
  color: #94a3b8;
}

.link-copy-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.link-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
  color: #0f172a;
  background: #f8fafc;
  font-family: monospace;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-copy {
  height: 32px;
  padding: 0 12px;
  background: #0f172a;
  color: #f59e0b;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: opacity 0.12s;
  flex-shrink: 0;
}

.btn-copy:hover {
  opacity: 0.88;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 16px;
    align-items: flex-end;
  }

  .modal-card {
    max-height: 95vh;
    border-radius: 8px 8px 0 0;
    max-width: 100%;
  }

  .asset-name {
    max-width: 120px;
  }
}
</style>
