<template>
  <div class="gallery-page">
    <!-- Header -->
    <header class="gallery-header">
      <div class="gallery-header-inner">
        <MnemosLogo />
        <p class="gallery-tagline">Open memory for organizations that matter</p>
        <p class="gallery-subtitle">
          Discover the digital archive of
          <span class="gallery-org-name">{{ orgName }}</span>
        </p>
      </div>
    </header>

    <!-- Main content -->
    <main class="gallery-main">
      <!-- Loading state -->
      <div v-if="loadingCollections" class="gallery-loading" aria-live="polite">
        <div class="skeleton-pills">
          <div class="skeleton-pill" v-for="n in 3" :key="n"></div>
        </div>
        <div class="asset-grid">
          <div class="skeleton-card" v-for="n in 8" :key="n">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-body">
              <div class="skeleton-line skeleton-line--title"></div>
              <div class="skeleton-line skeleton-line--short"></div>
              <div class="skeleton-tags">
                <div class="skeleton-tag"></div>
                <div class="skeleton-tag"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="collections.length === 0" class="gallery-empty">
        <MnemosLogo />
        <p class="gallery-empty-title">No public collections yet</p>
        <p class="gallery-empty-sub">Check back soon — this archive will be published shortly.</p>
      </div>

      <template v-else>
        <!-- Collection selector pills -->
        <div v-if="collections.length > 1" class="collection-pills" role="tablist" aria-label="Collections">
          <button
            v-for="col in collections"
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

        <!-- Asset grid: loading -->
        <div v-if="loadingAssets" class="asset-grid">
          <div class="skeleton-card" v-for="n in 8" :key="n">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-body">
              <div class="skeleton-line skeleton-line--title"></div>
              <div class="skeleton-line skeleton-line--short"></div>
              <div class="skeleton-tags">
                <div class="skeleton-tag"></div>
                <div class="skeleton-tag"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Asset grid: empty collection -->
        <div v-else-if="assets.length === 0" class="assets-empty">
          <p>No assets in this collection yet.</p>
        </div>

        <!-- Asset grid: cards -->
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
            <!-- Thumbnail or type icon -->
            <div class="asset-card-thumb">
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

            <!-- Card body -->
            <div class="asset-card-body">
              <h3 class="asset-title">{{ getTitle(asset) }}</h3>
              <div v-if="getTags(asset).length" class="asset-tags">
                <span
                  v-for="tag in getTags(asset)"
                  :key="tag"
                  class="asset-tag"
                >
                  {{ tag }}
                </span>
              </div>
              <span class="asset-view-link">View →</span>
            </div>
          </article>
        </div>
      </template>
    </main>

    <!-- Asset detail modal -->
    <div v-if="activeAsset" class="modal-overlay" @click.self="closeAsset" @keydown.escape="closeAsset">
      <div class="modal-card" role="dialog" aria-modal="true" :aria-label="getTitle(activeAsset)">
        <button class="modal-close" @click="closeAsset" aria-label="Close">&times;</button>

        <div v-if="loadingDetail" class="modal-loading">
          <div class="spinner"></div>
        </div>

        <template v-else>
          <div class="modal-thumb" v-if="isImage(activeAsset)">
            <img :src="activeAsset.cloudinary_url" :alt="getTitle(activeAsset)" class="modal-img" />
          </div>
          <div class="modal-type-icon" v-else>
            <span class="modal-type-emoji">{{ getTypeIcon(activeAsset) }}</span>
          </div>

          <div class="modal-body">
            <h2 class="modal-title">{{ getTitle(activeAsset) }}</h2>
            <p v-if="activeAsset.metadata?.description" class="modal-description">
              {{ activeAsset.metadata.description }}
            </p>
            <div v-if="getTags(activeAsset).length" class="asset-tags modal-tags">
              <span v-for="tag in getTags(activeAsset)" :key="tag" class="asset-tag">{{ tag }}</span>
            </div>
            <p v-if="activeAsset.created_at" class="modal-meta">
              Added {{ formatDate(activeAsset.created_at) }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer -->
    <footer class="gallery-footer">
      <p class="footer-tagline">Open memory for organizations that matter</p>
      <a
        href="https://github.com/rubenesky/mnemos-frontend"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-github"
      >
        GitHub
      </a>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import MnemosLogo from '@/components/MnemosLogo.vue'
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()

// Public axios instance — no auth token attached
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// State
const collections = ref([])
const selectedCollection = ref(null)
const assets = ref([])
const loadingCollections = ref(true)
const loadingAssets = ref(false)
const activeAsset = ref(null)
const loadingDetail = ref(false)

// Derived org name from first collection or fallback
const orgName = computed(() => {
  if (collections.value.length > 0 && collections.value[0].organization) {
    return collections.value[0].organization
  }
  return 'your organization'
})

onMounted(async () => {
  await fetchCollections()
})

async function fetchCollections() {
  loadingCollections.value = true
  try {
    const { data } = await publicApi.get('/public/collections')
    collections.value = Array.isArray(data) ? data : (data.data ?? [])
    if (collections.value.length > 0) {
      await selectCollection(collections.value[0])
    }
  } catch {
    toast.error('Failed to load collections. Please try again.')
    collections.value = []
  } finally {
    loadingCollections.value = false
  }
}

async function selectCollection(col) {
  selectedCollection.value = col
  loadingAssets.value = true
  try {
    const slug = col.slug ?? col.id
    const { data } = await publicApi.get(`/public/collections/${slug}`)
    if (Array.isArray(data)) {
      assets.value = data
    } else if (Array.isArray(data.assets)) {
      assets.value = data.assets
    } else if (Array.isArray(data.data)) {
      assets.value = data.data
    } else {
      assets.value = []
    }
  } catch {
    toast.error('Failed to load collection. Please try again.')
    assets.value = []
  } finally {
    loadingAssets.value = false
  }
}

async function openAsset(asset) {
  activeAsset.value = asset
  loadingDetail.value = true
  try {
    const { data } = await publicApi.get(`/public/assets/${asset.id}`)
    activeAsset.value = data.data ?? data
  } catch {
    toast.error('Failed to load asset details.')
    // keep the data we already have from the list
  } finally {
    loadingDetail.value = false
  }
}

function closeAsset() {
  activeAsset.value = null
}

function isImage(asset) {
  return asset?.mime_type?.startsWith('image/')
}

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

function getTitle(asset) {
  return asset?.metadata?.title || asset?.original_name || 'Untitled'
}

function getTags(asset) {
  const tags = asset?.metadata?.tags ?? asset?.tags ?? []
  return Array.isArray(tags) ? tags.slice(0, 3) : []
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
/* ── Page ── */
.gallery-page {
  min-height: 100vh;
  background: var(--color-navy, #0f172a);
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans, 'Inter', sans-serif);
}

/* ── Header ── */
.gallery-header {
  padding: 3rem 1.5rem 2rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.gallery-header-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 700px;
  margin: 0 auto;
}

.gallery-tagline {
  color: var(--color-muted, #94a3b8);
  font-size: 1rem;
  margin: 0;
}

.gallery-subtitle {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.875rem;
  margin: 0;
}

.gallery-org-name {
  color: var(--color-gold, #f59e0b);
  font-weight: 600;
}

/* ── Main ── */
.gallery-main {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ── Collection pills ── */
.collection-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  margin-bottom: 2rem;
}

.collection-pill {
  background: transparent;
  border: 1px solid var(--color-muted, #94a3b8);
  color: #ffffff;
  padding: 0.4rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-sans, 'Inter', sans-serif);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.collection-pill:hover {
  border-color: #ffffff;
}

.collection-pill:focus-visible {
  outline: 2px solid var(--color-gold, #f59e0b);
  outline-offset: 2px;
}

.collection-pill--active {
  background: var(--color-gold, #f59e0b);
  border-color: var(--color-gold, #f59e0b);
  color: var(--color-navy, #0f172a);
  font-weight: 700;
}

/* ── Asset grid ── */
.asset-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .asset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .asset-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .asset-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* ── Asset card ── */
.asset-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
}

.asset-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}

.asset-card:focus-visible {
  outline: 2px solid var(--color-gold, #f59e0b);
  outline-offset: 2px;
}

/* ── Card thumbnail ── */
.asset-card-thumb {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: #f1f5f9;
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
  gap: 0.5rem;
}

.asset-type-emoji {
  font-size: 2.5rem;
  line-height: 1;
}

.asset-type-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted, #94a3b8);
}

/* ── Card body ── */
.asset-card-body {
  padding: 0.875rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.asset-title {
  font-size: 0.9375rem;
  font-weight: 600;
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
  gap: 0.375rem;
}

.asset-tag {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.15rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.asset-view-link {
  font-size: 0.8125rem;
  color: var(--color-muted, #94a3b8);
  margin-top: auto;
}

/* ── Skeleton loading ── */
.gallery-loading {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-pills {
  display: flex;
  gap: 0.625rem;
}

.skeleton-pill {
  height: 2rem;
  width: 6rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
}

.skeleton-thumb {
  width: 100%;
  height: 160px;
  background: rgba(255, 255, 255, 0.08);
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-body {
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 0.8rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-line--title { width: 75%; }
.skeleton-line--short { width: 50%; }

.skeleton-tags {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.25rem;
}

.skeleton-tag {
  height: 1.25rem;
  width: 3.5rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* ── Empty states ── */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 40vh;
  text-align: center;
}

.gallery-empty-title {
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.gallery-empty-sub {
  color: var(--color-muted, #94a3b8);
  font-size: 0.9rem;
  margin: 0;
}

.assets-empty {
  color: var(--color-muted, #94a3b8);
  text-align: center;
  padding: 3rem 0;
  font-size: 0.9375rem;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.875rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-muted, #94a3b8);
  line-height: 1;
  transition: color 0.15s ease;
  z-index: 1;
}

.modal-close:hover {
  color: var(--color-navy, #0f172a);
}

.modal-thumb {
  width: 100%;
  max-height: 360px;
  overflow: hidden;
}

.modal-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.modal-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  background: #f1f5f9;
}

.modal-type-emoji {
  font-size: 4rem;
}

.modal-body {
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-navy, #0f172a);
  margin: 0;
}

.modal-description {
  color: #374151;
  font-size: 0.9375rem;
  margin: 0;
  line-height: 1.6;
}

.modal-meta {
  font-size: 0.8125rem;
  color: var(--color-muted, #94a3b8);
  margin: 0;
}

.modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(245, 158, 11, 0.2);
  border-top-color: var(--color-gold, #f59e0b);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Footer ── */
.gallery-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-tagline {
  color: var(--color-muted, #94a3b8);
  font-size: 0.8125rem;
  margin: 0;
}

.footer-github {
  color: var(--color-gold, #f59e0b);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.footer-github:hover {
  opacity: 0.8;
}
</style>
