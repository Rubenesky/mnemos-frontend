<template>
  <AppLayout>
    <!-- Page header -->
    <div class="cp-header">
      <div>
        <h1 class="cp-title">GDPR Consent Management</h1>
        <p class="cp-subtitle">Track and document consent for individuals appearing in your assets</p>
      </div>
      <div class="cp-header-actions">
        <button class="btn-secondary" @click="exportCsv" :disabled="exportLoading">
          {{ exportLoading ? 'Exporting...' : 'Export CSV' }}
        </button>
        <button class="btn-primary" @click="openAddModal">Add Consent</button>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="cp-filters">
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
      <input
        v-model="searchQuery"
        type="search"
        class="cp-search"
        placeholder="Search by person name..."
        @input="onSearchInput"
      />
    </div>

    <!-- Consent table card -->
    <div class="cp-table-card">
      <!-- Loading -->
      <div v-if="loading" class="cp-loading">Loading consents...</div>

      <!-- Empty -->
      <div v-else-if="consents.length === 0" class="cp-empty">
        No consent records found.
      </div>

      <!-- Table -->
      <div v-else class="cp-table-wrapper">
        <table class="cp-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Person</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
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
                    {{ consent.asset?.original_name ?? '—' }}
                    <span
                      v-if="consent.status === 'pending'"
                      class="warning-icon"
                      title="This asset cannot be published — pending consents"
                    >&#9888;</span>
                  </span>
                </div>
              </td>
              <td>{{ consent.person_name }}</td>
              <td class="td-date">{{ formatDate(consent.consent_date) }}</td>
              <td class="td-type">{{ capitalize(consent.type) }}</td>
              <td>
                <ConsentBadge :status="consent.status" />
              </td>
              <td class="td-actions">
                <button
                  class="action-btn action-btn--edit"
                  @click="openEditModal(consent)"
                  title="Edit"
                  aria-label="Edit consent"
                >
                  <!-- Pencil icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                  <!-- Trash icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      <div v-if="pagination && pagination.last_page > 1" class="cp-pagination">
        <button
          class="btn-secondary"
          :disabled="pagination.current_page <= 1"
          @click="goToPage(pagination.current_page - 1)"
        >
          Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.current_page }} of {{ pagination.last_page }}
        </span>
        <button
          class="btn-secondary"
          :disabled="pagination.current_page >= pagination.last_page"
          @click="goToPage(pagination.current_page + 1)"
        >
          Next
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
      <div class="modal-card" role="dialog" aria-modal="true" :aria-label="editingConsent ? 'Edit Consent' : 'Add Consent'">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingConsent ? 'Edit Consent' : 'Add Consent' }}</h2>
          <button class="modal-close" @click="closeFormModal" aria-label="Close">&times;</button>
        </div>

        <form @submit.prevent="saveConsent" class="modal-form">
          <!-- Asset -->
          <div class="form-field">
            <label class="form-label" for="c-asset">Asset</label>
            <select id="c-asset" v-model="form.asset_id" class="form-input" required>
              <option value="" disabled>Select an asset...</option>
              <option v-for="a in assets" :key="a.id" :value="a.id">
                {{ a.original_name }}
              </option>
            </select>
            <span v-if="formErrors.asset_id" class="form-error">{{ formErrors.asset_id }}</span>
          </div>

          <!-- Person name -->
          <div class="form-field">
            <label class="form-label" for="c-person">Person Name</label>
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

          <!-- Consent date -->
          <div class="form-field">
            <label class="form-label" for="c-date">Consent Date</label>
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
            <label class="form-label" for="c-type">Type</label>
            <select id="c-type" v-model="form.type" class="form-input" required>
              <option value="" disabled>Select type...</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="general">General</option>
            </select>
            <span v-if="formErrors.type" class="form-error">{{ formErrors.type }}</span>
          </div>

          <!-- Status -->
          <div class="form-field">
            <label class="form-label" for="c-status">Status</label>
            <select id="c-status" v-model="form.status" class="form-input" required>
              <option value="" disabled>Select status...</option>
              <option value="obtained">Obtained</option>
              <option value="pending">Pending</option>
              <option value="denied">Denied</option>
            </select>
            <span v-if="formErrors.status" class="form-error">{{ formErrors.status }}</span>
          </div>

          <!-- Notes -->
          <div class="form-field">
            <label class="form-label" for="c-notes">
              Notes <span class="form-optional">(optional)</span>
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
              Document <span class="form-optional">(optional, PDF/JPG/PNG)</span>
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
            <button type="button" class="btn-secondary" @click="closeFormModal">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="formLoading">
              {{ formLoading ? 'Saving...' : 'Save' }}
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
          <h2 class="modal-title">Delete Consent Record</h2>
          <button class="modal-close" @click="closeDeleteModal" aria-label="Close">&times;</button>
        </div>
        <p class="delete-confirm-text">Delete this consent record? This action cannot be undone.</p>
        <div class="modal-actions modal-actions--delete">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDelete" :disabled="deleteLoading">
            {{ deleteLoading ? 'Deleting...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import ConsentBadge from '@/components/ConsentBadge.vue'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'

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
const editingConsent = ref(null)
const deletingConsent = ref(null)

const statusFilter = ref('')
const searchQuery = ref('')
let searchDebounce = null

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Obtained', value: 'obtained' },
  { label: 'Pending', value: 'pending' },
  { label: 'Denied', value: 'denied' },
]

function emptyForm() {
  return {
    asset_id: '',
    person_name: '',
    consent_date: '',
    type: '',
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
    consents.value = data.data ?? data
    pagination.value = data.meta ?? null
  } catch (e) {
    if (e?.response?.status === 403) {
      toast.error('You do not have permission to manage consents.')
    }
    // Other statuses handled by the global axios interceptor
  } finally {
    loading.value = false
  }
}

async function fetchAssets() {
  try {
    const { data } = await api.get('/assets', { params: { per_page: 200 } })
    assets.value = data.data ?? data
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
    consent_date: consent.consent_date ?? '',
    type: consent.type,
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
    payload.append('consent_date', form.consent_date)
    payload.append('type', form.type)
    payload.append('status', form.status)
    if (form.notes) payload.append('notes', form.notes)
    if (form.document) payload.append('document', form.document)

    if (editingConsent.value) {
      // Laravel requires _method override for multipart PATCH
      payload.append('_method', 'PATCH')
      await api.post(`/consents/${editingConsent.value.id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Consent updated successfully.')
    } else {
      await api.post('/consents', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Consent record created.')
    }

    closeFormModal()
    await fetchConsents()
  } catch (e) {
    if (e?.response?.status === 403) {
      toast.error('You do not have permission to manage consents.')
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
    toast.success('Consent record deleted.')
    closeDeleteModal()
    await fetchConsents()
  } catch (e) {
    if (e?.response?.status === 403) {
      toast.error('You do not have permission to manage consents.')
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

function capitalize(str) {
  if (!str) return '—'
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function isImage(asset) {
  return asset?.mime_type?.startsWith('image/')
}
</script>

<style scoped>
/* ── Page header ── */
.cp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.cp-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-navy, #0f172a);
  margin: 0 0 0.25rem;
}

.cp-subtitle {
  font-size: 0.9rem;
  color: var(--color-muted, #94a3b8);
  margin: 0;
}

.cp-header-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* ── Filter bar ── */
.cp-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-pill {
  background: transparent;
  border: 1px solid var(--color-muted, #94a3b8);
  color: var(--color-navy, #0f172a);
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.filter-pill:hover {
  border-color: var(--color-navy, #0f172a);
}

.filter-pill--active {
  background: var(--color-gold, #f59e0b);
  border-color: var(--color-gold, #f59e0b);
  color: var(--color-navy, #0f172a);
  font-weight: 700;
}

.cp-search {
  border: 1px solid var(--color-form-border, #d1d5db);
  border-radius: 6px;
  padding: 0.4rem 0.875rem;
  font-size: 0.875rem;
  color: var(--color-form-text, #111827);
  font-family: inherit;
  min-width: 200px;
  transition: border-color 0.15s ease;
}

.cp-search:focus {
  outline: none;
  border-color: var(--color-gold, #f59e0b);
}

/* ── Table card ── */
.cp-table-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.cp-loading,
.cp-empty {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-muted, #94a3b8);
  font-size: 0.9375rem;
}

.cp-table-wrapper {
  overflow-x: auto;
}

.cp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.cp-table th {
  background: #f8fafc;
  color: var(--color-muted, #94a3b8);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  white-space: nowrap;
}

.cp-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: var(--color-navy, #0f172a);
  vertical-align: middle;
}

.cp-table tbody tr:last-child td {
  border-bottom: none;
}

.cp-table tbody tr:hover td {
  background: #fafafa;
}

/* ── Asset cell ── */
.td-asset { min-width: 180px; }

.asset-cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.asset-thumb-wrap {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f1f5f9;
  border: 1px solid rgba(0, 0, 0, 0.07);
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
  font-size: 1.1rem;
}

.asset-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-navy, #0f172a);
}

.warning-icon {
  color: var(--color-consent-yellow, #f59e0b);
  margin-left: 0.3rem;
  font-size: 0.85rem;
  cursor: help;
}

.td-type,
.td-date {
  white-space: nowrap;
}

/* ── Row action buttons ── */
.td-actions {
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 4px;
  color: var(--color-muted, #94a3b8);
  transition: color 0.15s ease, background 0.15s ease;
  line-height: 0;
}

.action-btn--edit:hover {
  color: var(--color-navy, #0f172a);
  background: #f1f5f9;
}

.action-btn--delete:hover {
  color: var(--color-consent-red, #ef4444);
  background: #fef2f2;
}

/* ── Pagination ── */
.cp-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--color-muted, #94a3b8);
}

/* ── Shared buttons ── */
.btn-primary {
  background: var(--color-gold, #f59e0b);
  color: var(--color-navy, #0f172a);
  border: none;
  padding: 0.5rem 1.125rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s ease;
}

.btn-primary:hover:not(:disabled) { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-muted, #94a3b8);
  color: var(--color-navy, #0f172a);
  padding: 0.5rem 1.125rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.btn-secondary:hover:not(:disabled) { border-color: var(--color-navy, #0f172a); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger {
  background: var(--color-consent-red, #ef4444);
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.125rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s ease;
}

.btn-danger:hover:not(:disabled) { opacity: 0.88; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-card--sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-navy, #0f172a);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-muted, #94a3b8);
  transition: color 0.15s ease;
  padding: 0;
}

.modal-close:hover { color: var(--color-navy, #0f172a); }

/* ── Form inside modal ── */
.modal-form {
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-navy, #0f172a);
}

.form-optional {
  font-weight: 400;
  color: var(--color-muted, #94a3b8);
}

.form-input {
  border: 1px solid var(--color-form-border, #d1d5db);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-form-text, #111827);
  font-family: inherit;
  background: #ffffff;
  transition: border-color 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-gold, #f59e0b);
}

.form-textarea {
  resize: vertical;
  min-height: 5rem;
}

.form-file {
  padding: 0.35rem 0.75rem;
}

.form-error {
  font-size: 0.75rem;
  color: var(--color-error-text, #b91c1c);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* ── Delete modal specific ── */
.delete-confirm-text {
  padding: 1rem 1.5rem 0;
  font-size: 0.9375rem;
  color: var(--color-navy, #0f172a);
  margin: 0;
}

.modal-actions--delete {
  padding: 1.25rem 1.5rem 1.5rem;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .cp-header {
    flex-direction: column;
  }

  .cp-header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .modal-card {
    max-height: 95vh;
  }
}
</style>
