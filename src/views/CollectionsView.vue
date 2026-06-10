<template>
  <AppLayout>
    <!-- Page header -->
    <div class="collections-header">
      <div>
        <h1 class="page-title">{{ t('collections.title') }}</h1>
        <p class="page-subtitle">{{ t('collections.subtitle') }}</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        + {{ t('collections.new') }}
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="collections-grid">
      <div v-for="n in 6" :key="n" class="collection-card collection-card--skeleton">
        <div class="sk-badge"></div>
        <div class="sk-title"></div>
        <div class="sk-desc"></div>
        <div class="sk-footer"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="collections.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" class="empty-icon">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
      <p class="empty-text">{{ t('collections.empty') }}</p>
      <button class="btn-primary" @click="openCreateModal">
        + {{ t('collections.new') }}
      </button>
    </div>

    <!-- Collections grid -->
    <div v-else class="collections-grid">
      <article
        v-for="col in collections"
        :key="col.id"
        class="collection-card"
        role="button"
        tabindex="0"
        @click="navigateTo(col.id)"
        @keydown.enter="navigateTo(col.id)"
      >
        <!-- Public / private badge + action buttons -->
        <div class="card-top">
          <span class="badge" :class="col.is_public ? 'badge--public' : 'badge--private'">
            {{ col.is_public ? t('collections.public') : t('collections.private') }}
          </span>
          <div class="card-actions">
            <button class="icon-btn" :title="t('collections.edit')" @click.stop="openEditModal(col)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="icon-btn icon-btn--danger" :title="t('collections.delete')" @click.stop="confirmDelete(col)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Name + description -->
        <h2 class="card-name">{{ col.name }}</h2>
        <p v-if="col.description" class="card-desc">{{ col.description }}</p>

        <!-- Footer: asset count + actions -->
        <div class="card-footer">
          <span class="asset-count">{{ col.assets_count }} {{ t('collections.assets') }}</span>
          <div class="footer-actions">
            <button
              class="btn-visibility"
              :title="col.is_public ? t('collections.private') : t('collections.public')"
              @click.stop="toggleVisibility(col)"
            >
              {{ col.is_public ? '🌐' : '🔒' }}
            </button>
            <RouterLink
              :to="`/assets?collection_id=${col.id}`"
              class="btn-secondary btn-secondary--sm"
              @click.stop
            >
              {{ t('collections.viewAssets') }}
            </RouterLink>
          </div>
        </div>
      </article>
    </div>

    <!-- ─────────────────── Create / Edit modal ─────────────────── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card" role="dialog" aria-modal="true">
          <h2 class="modal-title">
            {{ editingCollection ? t('collections.edit') : t('collections.new') }}
          </h2>

          <form @submit.prevent="saveCollection" class="modal-form">
            <label class="field-label">
              {{ t('collections.name') }}
              <input
                v-model="form.name"
                type="text"
                class="field-input"
                :placeholder="t('collections.namePlaceholder')"
                required
                maxlength="120"
                autofocus
              />
            </label>

            <label class="field-label">
              {{ t('collections.description') }}
              <textarea
                v-model="form.description"
                class="field-input field-textarea"
                :placeholder="t('collections.descriptionPlaceholder')"
                rows="3"
                maxlength="500"
              ></textarea>
            </label>

            <div class="toggle-label">
              <span>{{ t('collections.isPublic') }}</span>
              <div
                class="toggle"
                :class="{ 'toggle--on': form.is_public }"
                @click="form.is_public = !form.is_public"
                role="switch"
                :aria-checked="form.is_public"
                tabindex="0"
                @keydown.space.prevent="form.is_public = !form.is_public"
              >
                <div class="toggle-thumb"></div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="closeModal">
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

    <!-- ───────────────────── Delete confirm modal ──────────────────── -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-card modal-card--sm" role="dialog" aria-modal="true">
          <h2 class="modal-title">{{ t('collections.delete') }}</h2>
          <p class="modal-body-text">{{ t('collections.deleteConfirm') }}</p>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showDeleteConfirm = false">
              {{ t('common.cancel') }}
            </button>
            <button class="btn-danger" :disabled="deleting" @click="deleteCollection">
              {{ deleting ? '…' : t('collections.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const router = useRouter()
const toast = useToastStore()

// ── State ──────────────────────────────────────────────────────────────────
const collections        = ref([])
const loading            = ref(true)
const saving             = ref(false)
const deleting           = ref(false)
const showModal          = ref(false)
const showDeleteConfirm  = ref(false)
const editingCollection  = ref(null)
const deletingCollection = ref(null)

const form = ref({ name: '', description: '', is_public: false })

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(fetchCollections)

// ── API ────────────────────────────────────────────────────────────────────
async function fetchCollections() {
  loading.value = true
  try {
    const { data } = await api.get('/collections')
    collections.value = data.data ?? []
  } catch {
    toast.error(t('collections.loadError'))
  } finally {
    loading.value = false
  }
}

async function saveCollection() {
  saving.value = true
  try {
    if (editingCollection.value) {
      const { data } = await api.patch(`/collections/${editingCollection.value.id}`, form.value)
      const idx = collections.value.findIndex(c => c.id === editingCollection.value.id)
      if (idx !== -1) collections.value[idx] = data.data
    } else {
      const { data } = await api.post('/collections', form.value)
      collections.value.push(data.data)
    }
    closeModal()
  } catch {
    toast.error(t('collections.saveError'))
  } finally {
    saving.value = false
  }
}

async function deleteCollection() {
  if (!deletingCollection.value) return
  deleting.value = true
  try {
    await api.delete(`/collections/${deletingCollection.value.id}`)
    collections.value = collections.value.filter(c => c.id !== deletingCollection.value.id)
    showDeleteConfirm.value = false
    deletingCollection.value = null
  } catch {
    toast.error(t('collections.deleteError'))
  } finally {
    deleting.value = false
  }
}

async function toggleVisibility(col) {
  try {
    const { data } = await api.patch(`/collections/${col.id}/visibility`)
    col.is_public = data.is_public
  } catch {
    toast.error(t('collections.saveError'))
  }
}

// ── Modal helpers ──────────────────────────────────────────────────────────
function navigateTo(id) {
  router.push(`/collections/${id}`)
}

function openCreateModal() {
  editingCollection.value = null
  form.value = { name: '', description: '', is_public: false }
  showModal.value = true
}

function openEditModal(col) {
  editingCollection.value = col
  form.value = { name: col.name, description: col.description ?? '', is_public: col.is_public }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCollection.value = null
}

function confirmDelete(col) {
  deletingCollection.value = col
  showDeleteConfirm.value = true
}
</script>

<style scoped>
/* ── Page header ── */
.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* ── Grid ── */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

/* ── Card ── */
.collection-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.collection-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 9999px;
}

.badge--public  { background: #d1fae5; color: #065f46; }
.badge--private { background: #f1f5f9; color: #475569; }

.card-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0.5px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: background 0.12s ease, color 0.12s ease;
}

.icon-btn svg { width: 13px; height: 13px; }
.icon-btn:hover { background: #f8fafc; color: #0f172a; }
.icon-btn--danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 10px;
  border-top: 0.5px solid #f1f5f9;
}

.asset-count { font-size: 12px; color: #94a3b8; }

.footer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-visibility {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.12s ease;
}

.btn-visibility:hover { background: #f1f5f9; }

/* ── Skeleton ── */
.collection-card--skeleton { pointer-events: none; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sk-badge, .sk-title, .sk-desc, .sk-footer {
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.sk-badge  { width: 60px;  height: 18px; }
.sk-title  { width: 70%;   height: 16px; margin-top: 4px; }
.sk-desc   { width: 90%;   height: 28px; }
.sk-footer { width: 100%;  height: 16px; margin-top: auto; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 40vh;
  text-align: center;
}

.empty-icon { width: 48px; height: 48px; color: #cbd5e1; }
.empty-text { font-size: 14px; color: #94a3b8; margin: 0; }

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

.btn-secondary {
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.12s ease;
  white-space: nowrap;
}

.btn-secondary--sm { font-size: 11px; padding: 4px 10px; }
.btn-secondary:hover { opacity: 0.85; }

.btn-ghost {
  background: transparent;
  border: 0.5px solid #e2e8f0;
  color: #475569;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
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

/* ── Modal overlay ── */
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
  gap: 20px;
}

.modal-card--sm { max-width: 380px; }

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

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

/* ── Form fields ── */
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
</style>
