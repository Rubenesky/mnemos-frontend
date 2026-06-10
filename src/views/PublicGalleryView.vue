<template>
  <div class="gallery-page">

    <!-- Sticky Header -->
    <header class="gallery-header">
      <div class="header-logo">
        <MnemosLogo />
      </div>
      <div class="header-actions">
        <RouterLink v-if="pressRoomAvailable" to="/press-room" class="btn-pressroom">{{ t('gallery.pressRoom') }}</RouterLink>
        <RouterLink to="/register" class="btn-register">{{ t('auth.register') }}</RouterLink>
        <RouterLink to="/login" class="btn-primary">{{ t('auth.login') }}</RouterLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">{{ orgName }}</h1>
      <p class="hero-subtitle">{{ t('gallery.tagline') }}</p>

      <!-- Collection pills — optional filter tabs, shown when >= 1 public collection has assets -->
      <div
        v-if="!loadingCollections && publicCollections.length >= 1"
        class="collection-pills"
        role="tablist"
        aria-label="Collections"
      >
        <button
          class="collection-pill"
          :class="{ 'collection-pill--active': !selectedCollection }"
          @click="clearCollection"
          role="tab"
          :aria-selected="!selectedCollection"
        >
          {{ t('gallery.allCollections') }}
        </button>
        <button
          v-for="col in publicCollections"
          :key="col.id"
          class="collection-pill"
          :class="{ 'collection-pill--active': selectedCollection?.id === col.id }"
          @click="selectCollection(col)"
          role="tab"
          :aria-selected="selectedCollection?.id === col.id"
        >
          {{ col.name }}
        </button>
      </div>
    </section>

    <!-- Main content -->
    <main class="gallery-main">

      <!-- Loading assets skeleton -->
      <div v-if="loadingAssets" class="asset-grid">
        <div class="skeleton-card" v-for="n in 8" :key="n">
          <div class="skeleton-thumb"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--short"></div>
            <div class="skeleton-tags-row">
              <div class="skeleton-tag"></div>
              <div class="skeleton-tag"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state — no public assets -->
      <div v-else-if="assets.length === 0" class="empty-state">
        <MnemosLogo />
        <p class="empty-title">{{ t('gallery.noAssets') }}</p>
        <p class="empty-sub">{{ t('gallery.noAssetsSub') }}</p>
      </div>

      <!-- Asset grid -->
      <div v-else class="asset-grid">
        <article
          v-for="asset in assets"
          :key="asset.id"
          class="asset-card"
          role="button"
          tabindex="0"
          @click="openAsset(asset)"
          @keydown.enter="openAsset(asset)"
        >
          <div class="asset-thumb">
            <img
              v-if="isImage(asset)"
              :src="asset.cloudinary_url"
              :alt="getTitle(asset)"
              class="asset-thumb-img"
              loading="lazy"
            />
            <div v-else class="asset-type-icon">
              <span class="asset-type-emoji">{{ getTypeIcon(asset) }}</span>
              <span class="asset-type-label">{{ getMimeLabel(asset) }}</span>
            </div>
          </div>

          <div class="asset-body">
            <h3 class="asset-title">{{ getTitle(asset) }}</h3>
            <div v-if="getTags(asset).length" class="asset-tags">
              <span
                v-for="tag in getTags(asset)"
                :key="tag"
                class="asset-tag"
              >{{ tag }}</span>
            </div>
            <span class="asset-date">{{ formatDate(asset.created_at) }}</span>
          </div>
        </article>
      </div>

    </main>

    <!-- Embed widget panel — admin/editor only, when a collection is active -->
    <div
      v-if="(auth.isAdmin || auth.isEditor) && selectedCollection"
      class="gallery-main"
    >
      <EmbedCodePanel :slug="selectedCollection.slug" />
    </div>

    <!-- Asset detail modal -->
    <div
      v-if="activeAsset"
      class="modal-overlay"
      @click.self="closeAsset"
      @keydown.escape="closeAsset"
    >
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        :aria-label="getTitle(activeAsset)"
      >
        <button class="modal-close" @click="closeAsset" aria-label="Close">&times;</button>

        <div v-if="loadingDetail" class="modal-spinner-wrap">
          <div class="spinner"></div>
        </div>

        <template v-else>
          <div class="modal-media" v-if="isImage(activeAsset)">
            <img
              :src="activeAsset.cloudinary_url"
              :alt="getTitle(activeAsset)"
              class="modal-img"
            />
          </div>
          <div class="modal-media modal-media--icon" v-else>
            <span class="modal-type-emoji">{{ getTypeIcon(activeAsset) }}</span>
          </div>

          <div class="modal-body">
            <h2 class="modal-title">{{ getTitle(activeAsset) }}</h2>
            <p v-if="activeAsset.metadata?.description" class="modal-desc">
              {{ activeAsset.metadata.description }}
            </p>
            <div v-if="getTags(activeAsset).length" class="asset-tags">
              <span
                v-for="tag in getTags(activeAsset)"
                :key="tag"
                class="asset-tag"
              >{{ tag }}</span>
            </div>
            <p v-if="activeAsset.created_at" class="modal-meta">
              {{ t('gallery.addedOn') }} {{ formatDate(activeAsset.created_at) }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer -->
    <footer class="gallery-footer">
      <p class="footer-copy">{{ t('gallery.tagline') }}</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import MnemosLogo from '../components/MnemosLogo.vue'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import EmbedCodePanel from '@/components/EmbedCodePanel.vue'

const { t } = useI18n()
const toast = useToastStore()
const auth = useAuthStore()

// Public axios instance — no auth token attached
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// State
const collections        = ref([])
const selectedCollection = ref(null)
const assets             = ref([])
const loadingAssets      = ref(true)
const loadingCollections = ref(false)
const activeAsset        = ref(null)
const loadingDetail      = ref(false)
const pressRoomAvailable = ref(false)
const orgName            = ref('Mnemos')
const currentPage        = ref(1)
const lastPage           = ref(1)
const totalAssets        = ref(0)

// Only show collections that have at least one public processed asset
const publicCollections = computed(() =>
  collections.value.filter(c => (c.assets_count ?? 0) > 0)
)

onMounted(() => {
  Promise.all([fetchAssets(), fetchCollections(), checkPressRoom()])
})

async function fetchAssets(page = 1, collectionId = null) {
  loadingAssets.value = true
  try {
    const params = { page }
    if (collectionId) params.collection_id = collectionId

    const { data } = await publicApi.get('/public/assets', { params })
    orgName.value     = data.org_name ?? 'Mnemos'
    assets.value      = data.data ?? []
    currentPage.value = data.current_page ?? 1
    lastPage.value    = data.last_page    ?? 1
    totalAssets.value = data.total        ?? 0
  } catch {
    toast.error(t('gallery.loadError'))
    assets.value = []
  } finally {
    loadingAssets.value = false
  }
}

async function fetchCollections() {
  loadingCollections.value = true
  try {
    const { data } = await publicApi.get('/public/collections')
    collections.value = Array.isArray(data) ? data : (data.data ?? [])
  } catch {
    collections.value = []
  } finally {
    loadingCollections.value = false
  }
}

async function checkPressRoom() {
  try {
    const { data } = await publicApi.get('/public/press-room')
    pressRoomAvailable.value = (data.data?.length ?? 0) > 0
  } catch {
    // silent — link simply won't appear
  }
}

async function selectCollection(col) {
  selectedCollection.value = col
  await fetchAssets(1, col.id)
}

async function clearCollection() {
  selectedCollection.value = null
  await fetchAssets(1)
}

async function goToPage(page) {
  if (page < 1 || page > lastPage.value) return
  await fetchAssets(page, selectedCollection.value?.id ?? null)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function openAsset(asset) {
  activeAsset.value = asset
  loadingDetail.value = true
  try {
    const { data } = await publicApi.get(`/public/assets/${asset.id}`)
    activeAsset.value = data.data ?? data
  } catch {
    // keep data from list on detail load failure
  } finally {
    loadingDetail.value = false
  }
}

function closeAsset() { activeAsset.value = null }

function isImage(asset)  { return asset?.mime_type?.startsWith('image/') }
function getTitle(asset) { return asset?.metadata?.title || asset?.original_name || 'Untitled' }
function getTags(asset)  { const tg = asset?.metadata?.tags ?? []; return Array.isArray(tg) ? tg.slice(0, 3) : [] }

function getTypeIcon(asset) {
  const mime = asset?.mime_type ?? ''
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime === 'application/pdf') return '📄'
  return '📁'
}

function getMimeLabel(asset) {
  const mime = asset?.mime_type ?? ''
  if (mime.startsWith('video/')) return 'Video'
  if (mime.startsWith('audio/')) return 'Audio'
  if (mime === 'application/pdf') return 'PDF'
  return 'File'
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}
</script>

<style scoped>
/* ── Reset & page shell ── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.gallery-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  color: #0f172a;
}

/* ── Sticky header ── */
.gallery-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 0.5px solid #e2e8f0;
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-logo {
  flex: 0 0 auto;
}

.header-logo :deep(.logo-img) {
  height: 130px;
  width: auto;
  border-radius: 16px;
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.btn-pressroom {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #f59e0b;
  text-decoration: none;
  transition: background 0.12s ease;
  white-space: nowrap;
}

.btn-pressroom:hover {
  background: rgba(245, 158, 11, 0.1);
}

.btn-register {
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  text-decoration: none;
  transition: opacity 0.12s ease;
  white-space: nowrap;
}

.btn-register:hover {
  opacity: 0.88;
}

/* ── Login button ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  transition: opacity 0.15s ease;
  white-space: nowrap;
}

.btn-primary:hover {
  opacity: 0.88;
}

/* ── Hero ── */
.hero {
  padding: 32px 24px 24px;
  text-align: center;
}

.hero-title {
  font-size: 22px;
  font-weight: 500;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.hero-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0 0;
}

/* ── Collection pills ── */
.collection-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 16px 0 0;
}

.collection-pill {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-family: inherit;
  padding: 4px 14px;
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.collection-pill:hover {
  border-color: #cbd5e1;
  color: #0f172a;
}

.collection-pill:focus-visible {
  outline: 2px solid #0f172a;
  outline-offset: 2px;
}

.collection-pill--active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

/* ── Main content wrapper ── */
.gallery-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 48px;
}

/* ── Asset grid ── */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

/* ── Asset card ── */
.asset-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.asset-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.asset-card:focus-visible {
  outline: 2px solid #0f172a;
  outline-offset: 2px;
}

/* ── Card thumbnail ── */
.asset-thumb {
  width: 100%;
  height: 210px;
  background: #f8fafc;
  overflow: hidden;
  flex-shrink: 0;
}

.asset-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.asset-type-icon {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.asset-type-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.asset-type-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

/* ── Card body ── */
.asset-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.asset-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Tags ── */
.asset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.asset-tag {
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 6px;
}

.asset-date {
  font-size: 11px;
  color: #94a3b8;
  margin-top: auto;
}

/* ── Skeleton loading ── */
@keyframes shimmer {
  0% { background-position: 200% 0; }
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
  height: 160px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-line--title { width: 72%; }
.skeleton-line--short { width: 48%; }

.skeleton-tags-row {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.skeleton-tag {
  height: 18px;
  width: 52px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

/* ── Empty states ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 40vh;
  text-align: center;
  padding: 48px 24px;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
}

.empty-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.empty-collection {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  padding: 48px 0;
}

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ── Modal card ── */
.modal-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 8px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

/* ── Modal close button ── */
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.12s ease, border-color 0.12s ease;
}

.modal-close:hover {
  color: #0f172a;
  border-color: #cbd5e1;
}

/* ── Modal media ── */
.modal-media {
  width: 100%;
  max-height: 320px;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-img {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
}

.modal-media--icon {
  height: 180px;
}

.modal-type-emoji {
  font-size: 4rem;
}

/* ── Modal body ── */
.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-title {
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
}

.modal-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.modal-meta {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

/* ── Modal loading spinner ── */
.modal-spinner-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e2e8f0;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

/* ── Footer ── */
.gallery-footer {
  border-top: 0.5px solid #e2e8f0;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-copy {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.footer-github {
  font-size: 11px;
  color: #0f172a;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.12s ease;
}

.footer-github:hover {
  opacity: 0.7;
}
</style>
