<!-- BulkUploadView.vue — RJC -->
<template>
  <AppLayout>
    <div class="bulk-upload">
      <!-- Header -->
      <div class="bulk-header">
        <div>
          <h1 class="bulk-title">{{ t('bulk.title') }}</h1>
          <p class="bulk-subtitle">{{ t('bulk.subtitle') }}</p>
        </div>
        <RouterLink to="/assets" class="bulk-back">{{ t('bulk.back') }}</RouterLink>
      </div>

      <!-- Drop zone -->
      <div
        class="drop-zone"
        :class="{ 'drop-zone--active': isDragging }"
        @click="!isUploading && fileInput.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="drop-zone-icon">📁</div>
        <p class="drop-zone-text">
          {{ isDragging ? t('bulk.dropZoneActive') : t('bulk.dropZone') }}
        </p>
        <p class="drop-zone-hint">{{ t('bulk.accepted') }}</p>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <!-- File counter -->
      <p v-if="files.length > 0" class="file-counter">
        {{ t('bulk.counter', files.length) }}
      </p>

      <!-- Global progress bar -->
      <div v-if="isUploading" class="progress-bar-wrap">
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: globalProgress + '%' }"
          />
        </div>
        <span class="progress-label">{{ globalProgress }}%</span>
      </div>

      <!-- File grid -->
      <div v-if="files.length > 0" class="file-grid">
        <div
          v-for="(item, index) in files"
          :key="index"
          class="file-card"
          :class="fileCardClass(item.status)"
        >
          <!-- Thumbnail / icon -->
          <div class="file-thumb">
            <img
              v-if="item.preview"
              :src="item.preview"
              :alt="item.file.name"
              class="thumb-img"
            />
            <span v-else class="thumb-icon">{{ fileIcon(item.file.type) }}</span>
          </div>

          <!-- Info -->
          <div class="file-info">
            <p class="file-name" :title="item.file.name">{{ item.file.name }}</p>
            <p class="file-size">{{ formatSize(item.file.size) }}</p>
            <p class="file-status" :class="statusClass(item.status)">
              {{ statusLabel(item) }}
            </p>
          </div>

          <!-- Remove button (pending only, not during upload) -->
          <button
            v-if="item.status === 'pending' && !isUploading"
            class="file-remove"
            :title="t('bulk.removeFile')"
            @click.stop="removeFile(index)"
          >
            ✕
          </button>

          <!-- Status icons after upload -->
          <span v-else-if="item.status === 'success'"   class="status-icon status-icon--success">✓</span>
          <span v-else-if="item.status === 'duplicate'" class="status-icon status-icon--duplicate">⚠</span>
          <span v-else-if="item.status === 'error'"     class="status-icon status-icon--error">✕</span>
          <span v-else-if="item.status === 'uploading'" class="status-icon status-icon--uploading">⏳</span>
        </div>
      </div>

      <!-- Actions (pre-upload) -->
      <div v-if="files.length > 0 && !uploadDone" class="bulk-actions">
        <button
          class="btn-clear"
          :disabled="isUploading"
          @click="clearAll"
        >
          {{ t('bulk.clearBtn') }}
        </button>
        <button
          class="btn-upload"
          :disabled="isUploading || files.length === 0"
          @click="uploadAll"
        >
          {{ isUploading ? t('bulk.uploading') : t('bulk.uploadBtn') }}
        </button>
      </div>

      <!-- Post-upload summary -->
      <div v-if="uploadDone" class="summary-panel">
        <div v-if="summary.success > 0" class="summary-row summary-row--success">
          <span class="summary-icon">✓</span>
          {{ t('bulk.summarySuccess', summary.success) }}
        </div>
        <div v-if="summary.duplicates > 0" class="summary-row summary-row--duplicate">
          <span class="summary-icon">⚠</span>
          {{ t('bulk.summaryDuplicates', summary.duplicates) }}
        </div>
        <div v-if="summary.errors > 0" class="summary-row summary-row--error">
          <span class="summary-icon">✕</span>
          {{ t('bulk.summaryErrors', summary.errors) }}
        </div>
        <div class="summary-actions">
          <button class="btn-upload-more" @click="uploadMore">
            {{ t('bulk.uploadMore') }}
          </button>
          <RouterLink to="/assets" class="btn-view-assets">
            {{ t('bulk.viewUploaded') }} →
          </RouterLink>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
// RJC — Bulk upload view
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t } = useI18n()
const toast = useToastStore()

const fileInput = ref(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadDone = ref(false)

const MAX_FILES = 20
const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav',
]

// Each item: { file, preview, status: 'pending'|'uploading'|'success'|'error'|'duplicate', errorMsg }
const files = ref([])

const globalProgress = computed(() => {
  if (files.value.length === 0) return 0
  const done = files.value.filter(f => ['success', 'error', 'duplicate'].includes(f.status)).length
  return Math.round((done / files.value.length) * 100)
})

const summary = computed(() => ({
  success:    files.value.filter(f => f.status === 'success').length,
  duplicates: files.value.filter(f => f.status === 'duplicate').length,
  errors:     files.value.filter(f => f.status === 'error').length,
}))

function handleFileChange(event) {
  addFiles(Array.from(event.target.files))
  event.target.value = ''
}

function handleDrop(event) {
  isDragging.value = false
  addFiles(Array.from(event.dataTransfer.files))
}

function addFiles(newFiles) {
  const remaining = MAX_FILES - files.value.length
  if (remaining <= 0) {
    toast.error(t('bulk.tooManyFiles'))
    return
  }
  const toAdd = newFiles.slice(0, remaining)
  if (newFiles.length > remaining) {
    toast.error(t('bulk.tooManyFiles'))
  }

  for (const file of toAdd) {
    if (!ALLOWED_TYPES.includes(file.type)) continue
    if (file.size > MAX_SIZE_BYTES) continue

    const item = { file, preview: null, status: 'pending', errorMsg: '' }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => { item.preview = e.target.result }
      reader.onerror = () => { item.preview = null }
      reader.readAsDataURL(file)
    }
    files.value.push(item)
  }
}

function removeFile(index) {
  files.value.splice(index, 1)
}

function clearAll() {
  files.value = []
  uploadDone.value = false
}

function uploadMore() {
  clearAll()
}

async function uploadAll() {
  if (files.value.length === 0) return
  isUploading.value = true

  const formData = new FormData()
  for (const item of files.value) {
    formData.append('files[]', item.file)
    item.status = 'uploading'
  }

  try {
    const response = await api.post('/assets/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // Backend returns { results: [...] } — not { data: [...] }
    const results = response.data.results ?? []

    files.value.forEach((item, i) => {
      const r = results[i]
      if (!r || r.status === 'success') {
        item.status = r ? 'success' : 'error'
        item.errorMsg = ''
      } else {
        const err = (r.error ?? '').toLowerCase()
        if (err.includes('duplicate') || err.includes('already uploaded')) {
          item.status = 'duplicate'
          item.errorMsg = t('bulk.errorDuplicate')
        } else if (err.includes('failed to upload')) {
          item.status = 'error'
          item.errorMsg = t('bulk.errorFailedUpload')
        } else {
          item.status = 'error'
          item.errorMsg = r.error || t('bulk.statusError')
        }
      }
    })

    const successCount   = files.value.filter(f => f.status === 'success').length
    const duplicateCount = files.value.filter(f => f.status === 'duplicate').length
    const errorCount     = files.value.filter(f => f.status === 'error').length

    if (errorCount === 0 && duplicateCount === 0) {
      toast.success(t('bulk.allDone'))
    } else if (errorCount > 0) {
      toast.error(t('bulk.partialError'))
    } else if (successCount === 0 && duplicateCount > 0) {
      toast.success(t('bulk.allDone'))
    }

    uploadDone.value = true
  } catch {
    files.value.forEach(item => {
      if (item.status === 'uploading') {
        item.status = 'error'
        item.errorMsg = t('bulk.errorFailedUpload')
      }
    })
    toast.error(t('bulk.overallError'))
    uploadDone.value = true
  } finally {
    isUploading.value = false
  }
}

function statusLabel(item) {
  if ((item.status === 'error' || item.status === 'duplicate') && item.errorMsg) {
    return item.errorMsg
  }
  return t('bulk.status' + capitalize(item.status))
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fileIcon(type) {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.startsWith('video/')) return '🎬'
  if (type.startsWith('audio/')) return '🎵'
  return '📎'
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function fileCardClass(status) {
  return {
    'file-card--success':   status === 'success',
    'file-card--duplicate': status === 'duplicate',
    'file-card--error':     status === 'error',
    'file-card--uploading': status === 'uploading',
  }
}

function statusClass(status) {
  return {
    'text-green-600':  status === 'success',
    'text-orange-500': status === 'duplicate',
    'text-red-500':    status === 'error',
    'text-gray-400':   status === 'uploading' || status === 'pending',
  }
}
</script>

<style scoped>
.bulk-upload {
  max-width: 860px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  color: #0f172a;
}

.bulk-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.bulk-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.bulk-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.bulk-back {
  font-size: 0.875rem;
  color: #64748b;
  text-decoration: none;
}
.bulk-back:hover { text-decoration: underline; }

.drop-zone {
  border: 2px dashed #0f172a;
  border-radius: 0.75rem;
  padding: 2.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  background: #f8fafc;
}
.drop-zone--active {
  background: #e0f2fe;
  border-color: #f59e0b;
}
.drop-zone:hover { background: #f1f5f9; }

.drop-zone-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.drop-zone-text { font-size: 0.95rem; color: #334155; font-weight: 500; }
.drop-zone-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 0.35rem; }

.file-counter {
  font-size: 0.875rem;
  color: #475569;
  margin: 0.75rem 0 0.25rem;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0;
}
.progress-bar-track {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 999px;
  transition: width 0.3s ease;
}
.progress-label { font-size: 0.75rem; color: #64748b; min-width: 2.5rem; text-align: right; }

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 0.625rem 0.75rem;
  position: relative;
  transition: border-color 0.15s;
}
.file-card--success   { border-color: #86efac; background: #f0fdf4; }
.file-card--duplicate { border-color: #fed7aa; background: #fff7ed; }
.file-card--error     { border-color: #fca5a5; background: #fef2f2; }
.file-card--uploading { border-color: #cbd5e1; background: #f8fafc; opacity: 0.8; }

.file-thumb {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 0.4rem;
  overflow: hidden;
}
.thumb-img { width: 100%; height: 100%; object-fit: cover; }
.thumb-icon { font-size: 1.4rem; }

.file-info { flex: 1; min-width: 0; }
.file-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-size { font-size: 0.7rem; color: #94a3b8; margin-top: 0.1rem; }
.file-status { font-size: 0.7rem; margin-top: 0.1rem; font-weight: 500; }

.file-remove {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 0.9rem;
  padding: 0.2rem 0.3rem;
  border-radius: 0.3rem;
  line-height: 1;
}
.file-remove:hover { background: #fee2e2; }

.status-icon {
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 700;
}
.status-icon--success   { color: #16a34a; }
.status-icon--duplicate { color: #ea580c; }
.status-icon--error     { color: #dc2626; }
.status-icon--uploading { color: #94a3b8; }

.bulk-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-clear {
  background: none;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-clear:hover:not(:disabled) { background: #fee2e2; }
.btn-clear:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-upload {
  background: #f59e0b;
  color: #0f172a;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-upload:hover:not(:disabled) { background: #d97706; }
.btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }

/* Post-upload summary panel */
.summary-panel {
  margin-top: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 1px solid #e2e8f0;
}

.summary-row--success   { background: #f0fdf4; color: #166534; }
.summary-row--duplicate { background: #fff7ed; color: #9a3412; }
.summary-row--error     { background: #fef2f2; color: #991b1b; }

.summary-icon { font-size: 1rem; }

.summary-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 0.875rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-upload-more {
  background: none;
  border: 1px solid #0f172a;
  color: #0f172a;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-upload-more:hover { background: #f1f5f9; }

.btn-view-assets {
  background: #0f172a;
  color: #fff;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: opacity 0.15s;
}
.btn-view-assets:hover { opacity: 0.85; }

.hidden { display: none; }
</style>
