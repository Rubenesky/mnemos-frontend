<template>
  <AppLayout>

    <!-- Loading header skeleton -->
    <div v-if="loading" class="detail-header">
      <div class="sk-back"></div>
      <div class="sk-title"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="!collection" class="empty-state">
      <p class="empty-text">{{ t('common.errorLoading') }}</p>
      <RouterLink to="/collections" class="btn-ghost">
        {{ t('collections.detail.backToCollections') }}
      </RouterLink>
    </div>

    <template v-else>

      <!-- ── Header ── -->
      <div class="detail-header">
        <RouterLink to="/collections" class="back-link">
          {{ t('collections.detail.backToCollections') }}
        </RouterLink>

        <div class="header-row">
          <div class="header-left">
            <div class="header-title-row">
              <h1 class="page-title">{{ collection.name }}</h1>
              <span class="badge" :class="collection.is_public ? 'badge--public' : 'badge--private'">
                {{ collection.is_public ? t('collections.public') : t('collections.private') }}
              </span>
            </div>
            <p v-if="collection.description" class="page-subtitle">{{ collection.description }}</p>
          </div>

          <div class="header-actions">
            <button class="btn-ghost" @click="openEditModal">
              {{ t('collections.edit') }}
            </button>
            <button class="btn-primary" @click="showAddModal = true">
              + {{ t('collections.detail.addAssets') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Asset grid ── -->
      <div v-if="loadingAssets" class="asset-grid">
        <div v-for="n in 8" :key="n" class="skeleton-card">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--sub"></div>
          </div>
        </div>
      </div>

      <div v-else-if="collectionAssets.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="empty-icon">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <p class="empty-text">{{ t('collections.detail.noAssets') }}</p>
        <p class="empty-sub">{{ t('collections.detail.noAssetsSub') }}</p>
        <button class="btn-primary" @click="showAddModal = true">
          + {{ t('collections.detail.addAssets') }}
        </button>
      </div>

      <div v-else class="asset-grid">
        <div v-for="asset in collectionAssets" :key="asset.id" class="asset-card-wrap">
          <RouterLink :to="`/assets/${asset.id}`" class="asset-card">
            <div class="card-thumb">
              <img
                v-if="isImage(asset)"
                :src="asset.cloudinary_url"
                :alt="asset.title || asset.original_name"
                loading="lazy"
                class="card-img"
              />
              <AssetTypeIcon v-else :mime-type="asset.mime_type" :size="40" class="card-type-icon" />
            </div>
            <div class="card-body">
              <p class="card-title">{{ asset.title || asset.original_name }}</p>
              <span
                class="status-badge"
                :class="{
                  'status-badge--processed': asset.status === 'processed',
                  'status-badge--pending':   asset.status === 'pending',
                  'status-badge--failed':    asset.status === 'failed',
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
            </div>
          </RouterLink>
          <button
            class="remove-btn"
            :title="t('collections.detail.removeAsset')"
            @click="confirmRemove(asset)"
          >×</button>
        </div>
      </div>

    </template>

    <!-- ── Edit modal ── -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-card" role="dialog" aria-modal="true">
          <h2 class="modal-title">{{ t('collections.edit') }}</h2>
          <form @submit.prevent="saveEdit" class="modal-form">
            <label class="field-label">
              {{ t('collections.name') }}
              <input
                v-model="editForm.name"
                type="text"
                class="field-input"
                required
                maxlength="120"
                autofocus
              />
            </label>
            <label class="field-label">
              {{ t('collections.description') }}
              <textarea
                v-model="editForm.description"
                class="field-input field-textarea"
                rows="3"
                maxlength="500"
              ></textarea>
            </label>
            <div class="toggle-label">
              <span>{{ t('collections.isPublic') }}</span>
              <div
                class="toggle"
                :class="{ 'toggle--on': editForm.is_public }"
                @click="editForm.is_public = !editForm.is_public"
                role="switch"
                :aria-checked="editForm.is_public"
                tabindex="0"
                @keydown.space.prevent="editForm.is_public = !editForm.is_public"
              >
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showEditModal = false">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? t('collections.saving') : t('collections.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ── Add assets modal ── -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-card modal-card--wide" role="dialog" aria-modal="true">
          <h2 class="modal-title">{{ t('collections.detail.addAssetsTitle') }}</h2>

          <input
            v-model="assetSearch"
            type="text"
            class="field-input"
            :placeholder="t('collections.detail.addAssetsPlaceholder')"
          />

          <div v-if="loadingAllAssets" class="modal-loading">…</div>

          <div v-else-if="filteredAddableAssets.length === 0" class="modal-empty">
            {{ t('collections.detail.noAssetsAvailable') }}
          </div>

          <ul v-else class="asset-pick-list">
            <li
              v-for="asset in filteredAddableAssets"
              :key="asset.id"
              class="asset-pick-item"
              :class="{ 'asset-pick-item--selected': selectedToAdd.includes(asset.id) }"
              @click="toggleAddSelection(asset.id)"
            >
              <div class="pick-thumb">
                <img
                  v-if="isImage(asset)"
                  :src="asset.url"
                  :alt="asset.original_name"
                  class="pick-img"
                />
                <AssetTypeIcon v-else :mime-type="asset.mime_type" :size="24" />
              </div>
              <span class="pick-name">{{ asset.metadata?.title || asset.original_name }}</span>
              <span v-if="selectedToAdd.includes(asset.id)" class="pick-check">✓</span>
            </li>
          </ul>

          <div class="modal-actions">
            <button class="btn-ghost" @click="showAddModal = false">
              {{ t('common.cancel') }}
            </button>
            <button
              class="btn-primary"
              :disabled="!selectedToAdd.length || addingAssets"
              @click="addSelectedAssets"
            >
              {{ addingAssets ? '…' : t('collections.detail.addSelected') }} ({{ selectedToAdd.length }})
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Remove confirm modal ── -->
    <Teleport to="body">
      <div v-if="showRemoveConfirm" class="modal-overlay" @click.self="showRemoveConfirm = false">
        <div class="modal-card modal-card--sm" role="dialog" aria-modal="true">
          <h2 class="modal-title">{{ t('collections.detail.removeAsset') }}</h2>
          <p class="modal-body-text">{{ t('collections.detail.removeAssetConfirm') }}</p>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showRemoveConfirm = false">
              {{ t('common.cancel') }}
            </button>
            <button class="btn-danger" :disabled="removing" @click="removeAsset">
              {{ removing ? '…' : t('collections.removeAsset') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/AppLayout.vue'
import AssetTypeIcon from '@/components/AssetTypeIcon.vue'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const route = useRoute()
const toast = useToastStore()

// ── State ──────────────────────────────────────────────────────────────────
const collection       = ref(null)
const collectionAssets = ref([])
const loading          = ref(true)
const loadingAssets    = ref(false)
const saving           = ref(false)
const removing         = ref(false)
const addingAssets     = ref(false)
const loadingAllAssets = ref(false)

const showEditModal     = ref(false)
const showAddModal      = ref(false)
const showRemoveConfirm = ref(false)
const assetToRemove     = ref(null)

const editForm = ref({ name: '', description: '', is_public: false })

const allAssets     = ref([])
const assetSearch   = ref('')
const selectedToAdd = ref([])

// ── Computed ──────────────────────────────────────────────────────────────
const addableAssets = computed(() =>
  allAssets.value.filter(a => !collectionAssets.value.some(ca => ca.id === a.id))
)

const filteredAddableAssets = computed(() => {
  const q = assetSearch.value.toLowerCase()
  if (!q) return addableAssets.value
  return addableAssets.value.filter(a =>
    (a.metadata?.title || a.original_name).toLowerCase().includes(q)
  )
})

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(fetchCollection)

watch(showAddModal, async (open) => {
  if (open && !allAssets.value.length) await fetchAllAssets()
  if (!open) { assetSearch.value = ''; selectedToAdd.value = [] }
})

// ── API ────────────────────────────────────────────────────────────────────
async function fetchCollection() {
  loading.value = true
  try {
    const { data } = await api.get(`/collections/${route.params.id}`)
    collection.value = data.data
    collectionAssets.value = data.data.assets ?? []
  } catch {
    toast.error(t('collections.loadError'))
    collection.value = null
  } finally {
    loading.value = false
  }
}

async function fetchAllAssets() {
  loadingAllAssets.value = true
  try {
    const { data } = await api.get('/assets', { params: { per_page: 48 } })
    allAssets.value = data.data ?? []
  } catch {
    allAssets.value = []
  } finally {
    loadingAllAssets.value = false
  }
}

async function saveEdit() {
  saving.value = true
  try {
    const { data } = await api.patch(`/collections/${collection.value.id}`, editForm.value)
    collection.value = { ...collection.value, ...data.data }
    showEditModal.value = false
  } catch {
    toast.error(t('collections.saveError'))
  } finally {
    saving.value = false
  }
}

async function addSelectedAssets() {
  addingAssets.value = true
  try {
    for (const assetId of selectedToAdd.value) {
      await api.post(`/collections/${collection.value.id}/assets`, { asset_id: assetId })
      const asset = allAssets.value.find(a => a.id === assetId)
      if (asset) collectionAssets.value.push(mapAsset(asset))
    }
    selectedToAdd.value = []
    showAddModal.value = false
    toast.success(t('collections.addSuccess'))
  } catch {
    toast.error(t('collections.saveError'))
  } finally {
    addingAssets.value = false
  }
}

async function removeAsset() {
  if (!assetToRemove.value) return
  removing.value = true
  try {
    await api.delete(`/collections/${collection.value.id}/assets/${assetToRemove.value.id}`)
    collectionAssets.value = collectionAssets.value.filter(a => a.id !== assetToRemove.value.id)
    showRemoveConfirm.value = false
    assetToRemove.value = null
    toast.success(t('collections.removeSuccess'))
  } catch {
    toast.error(t('collections.saveError'))
  } finally {
    removing.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function openEditModal() {
  editForm.value = {
    name:        collection.value.name,
    description: collection.value.description ?? '',
    is_public:   collection.value.is_public,
  }
  showEditModal.value = true
}

function confirmRemove(asset) {
  assetToRemove.value = asset
  showRemoveConfirm.value = true
}

function toggleAddSelection(id) {
  const idx = selectedToAdd.value.indexOf(id)
  if (idx === -1) selectedToAdd.value.push(id)
  else selectedToAdd.value.splice(idx, 1)
}

function isImage(asset) {
  return asset?.mime_type?.startsWith('image/')
}

function mapAsset(a) {
  return {
    id:             a.id,
    original_name:  a.original_name,
    mime_type:      a.mime_type,
    cloudinary_url: a.cloudinary_url ?? a.url,
    title:          a.metadata?.title ?? null,
    status:         a.status,
  }
}
</script>

<style scoped>
/* ── Header ── */
.detail-header { margin-bottom: 24px; }

.back-link {
  display: inline-block;
  font-size: 12px;
  color: #64748b;
  text-decoration: none;
  margin-bottom: 14px;
  transition: color 0.12s ease;
}

.back-link:hover { color: #0f172a; }

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left { flex: 1; min-width: 0; }

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 6px 0 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* ── Badges ── */
.badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}

.badge--public  { background: #d1fae5; color: #065f46; }
.badge--private { background: #f1f5f9; color: #475569; }

/* ── Asset grid ── */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.asset-card-wrap { position: relative; }

.asset-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  height: 100%;
}

.asset-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.card-thumb {
  width: 100%;
  height: 140px;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-type-icon { color: #94a3b8; }

.card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.card-title {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 9999px;
  align-self: flex-start;
}

.status-badge--processed { background: #d1fae5; color: #065f46; }
.status-badge--pending   { background: #fef3c7; color: #92400e; }
.status-badge--failed    { background: #fee2e2; color: #991b1b; }

/* Remove button — appears on hover */
.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.6);
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.12s ease;
}

.asset-card-wrap:hover .remove-btn { opacity: 1; }
.remove-btn:hover { background: #dc2626; }

/* ── Skeletons ── */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-thumb {
  width: 100%;
  height: 140px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }

.skeleton-line {
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  height: 10px;
}

.skeleton-line--title { width: 75%; }
.skeleton-line--sub   { width: 50%; }

.sk-back, .sk-title {
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.sk-back  { width: 120px; height: 12px; margin-bottom: 14px; }
.sk-title { width: 40%;   height: 22px; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 36vh;
  text-align: center;
}

.empty-icon { width: 44px; height: 44px; color: #cbd5e1; }
.empty-text { font-size: 14px; color: #475569; margin: 0; font-weight: 500; }
.empty-sub  { font-size: 13px; color: #94a3b8; margin: 0; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f59e0b;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: opacity 0.12s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn-primary:hover    { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ghost {
  background: transparent;
  border: 0.5px solid #e2e8f0;
  color: #475569;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background 0.12s ease;
}

.btn-ghost:hover { background: #f8fafc; }

.btn-danger {
  background: #dc2626;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: opacity 0.12s ease;
}

.btn-danger:hover    { opacity: 0.88; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Modals ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 10px;
  width: 100%;
  max-width: 480px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-card--sm   { max-width: 380px; }
.modal-card--wide { max-width: 560px; }

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-body-text {
  font-size: 13px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
}

.modal-form    { display: flex; flex-direction: column; gap: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
.modal-loading { text-align: center; color: #94a3b8; padding: 16px 0; }
.modal-empty   { text-align: center; color: #94a3b8; font-size: 13px; padding: 16px 0; }

/* ── Form ── */
.field-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.field-input {
  font-size: 13px;
  padding: 8px 12px;
  border: 0.5px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  color: #0f172a;
  background: #ffffff;
  font-family: inherit;
  transition: border-color 0.12s ease;
}

.field-input:focus { border-color: #f59e0b; }
.field-textarea    { resize: vertical; min-height: 80px; }

/* ── Toggle ── */
.toggle-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #374151;
}

.toggle {
  width: 40px;
  height: 22px;
  border-radius: 9999px;
  background: #e2e8f0;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.toggle--on { background: #f59e0b; }

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle--on .toggle-thumb { transform: translateX(18px); }

/* ── Asset pick list ── */
.asset-pick-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.asset-pick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 0.5px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
  font-size: 13px;
  color: #0f172a;
}

.asset-pick-item:hover { background: #f8fafc; }

.asset-pick-item--selected {
  background: #fffbeb;
  border-color: #f59e0b;
}

.pick-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pick-img { width: 100%; height: 100%; object-fit: cover; }

.pick-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pick-check { color: #f59e0b; font-weight: 700; flex-shrink: 0; }
</style>
