<template>
  <div class="embed-page">

    <header class="embed-header">
      <svg class="embed-brand" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="5" fill="#0f172a"/>
        <path d="M5 17V7l4 5 3-4 3 4 4-5v10" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h1 class="embed-title">{{ collection?.name }}</h1>
    </header>

    <main class="embed-main">
      <div v-if="loading" class="embed-loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="notFound" class="embed-empty">Collection not found.</div>

      <div v-else-if="assets.length === 0" class="embed-empty">No assets available.</div>

      <div v-else class="embed-grid">
        <div v-for="asset in assets" :key="asset.id" class="embed-card">
          <div class="embed-thumb">
            <img
              v-if="asset.mime_type?.startsWith('image/') && asset.cloudinary_url"
              :src="asset.cloudinary_url"
              :alt="asset.metadata?.title ?? asset.original_name"
              loading="lazy"
            />
            <span v-else class="embed-thumb-icon">{{ getTypeIcon(asset) }}</span>
          </div>
          <div class="embed-card-body">
            <p class="embed-card-title">{{ asset.metadata?.title ?? asset.original_name }}</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="embed-footer">
      <RouterLink to="/gallery" class="embed-powered">Powered by Mnemos</RouterLink>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

const collection = ref(null)
const assets = ref([])
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    const slug = route.params.slug
    const { data } = await publicApi.get(`/public/collections/${slug}`)
    collection.value = data.collection ?? { name: slug }
    const raw = data.assets?.data ?? data.assets ?? data.data ?? []
    assets.value = Array.isArray(raw) ? raw : []
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function getTypeIcon(asset) {
  const mime = asset?.mime_type ?? ''
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime === 'application/pdf') return '📄'
  return '📁'
}
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.embed-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
}

.embed-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.embed-brand { width: 24px; height: 24px; flex-shrink: 0; }

.embed-title {
  font-size: 1.125rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.embed-main { flex: 1; }

.embed-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.875rem;
}

@media (max-width: 480px) {
  .embed-grid { grid-template-columns: repeat(2, 1fr); }
}

.embed-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.embed-card:hover { box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1); }

.embed-thumb {
  aspect-ratio: 4/3;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.embed-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.embed-thumb-icon { font-size: 2rem; opacity: 0.5; }

.embed-card-body { padding: 0.625rem 0.75rem; }

.embed-card-title {
  font-size: 0.8rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.embed-footer { margin-top: 1rem; text-align: right; }

.embed-powered { font-size: 0.7rem; color: #64748b; text-decoration: none; opacity: 0.6; }
.embed-powered:hover { opacity: 1; }

.embed-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.875rem;
}

.embed-loading { display: flex; justify-content: center; padding: 3rem; }

@keyframes spin { to { transform: rotate(360deg); } }

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e2e8f0;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
</style>
