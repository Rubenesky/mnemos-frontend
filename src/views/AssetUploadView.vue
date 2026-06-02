<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Upload asset</h1>
        <RouterLink to="/assets" class="text-gray-500 dark:text-gray-400 hover:underline text-sm">
          ← Back
        </RouterLink>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-2xl">
        <form @submit.prevent="handleUpload">
          <!-- Upload zone -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              File
            </label>

            <!-- Preview if image -->
            <div v-if="preview" class="mb-4 relative">
              <img
                :src="preview"
                alt="Preview"
                class="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                @click="clearFile"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 text-sm"
              >
                ✕
              </button>
            </div>

            <!-- Drop zone -->
            <div
              v-if="!selectedFile"
              class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
              @click="fileInput.click()"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <p class="text-gray-400 text-sm">
                Drag a file here or click to select
              </p>
              <p class="text-gray-300 text-xs mt-1">Maximum 10MB</p>
            </div>

            <!-- Selected file info (non-image) -->
            <div
              v-else-if="selectedFile && !preview"
              class="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-blue-700 dark:text-blue-300">{{ selectedFile.name }}</p>
                <p class="text-sm text-blue-400 mt-1">
                  {{ (selectedFile.size / 1024).toFixed(1) }} KB
                </p>
              </div>
              <button
                type="button"
                @click="clearFile"
                class="text-red-500 hover:text-red-700 text-sm"
              >
                ✕ Remove
              </button>
            </div>

            <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" />
          </div>

          <!-- File info with image -->
          <div
            v-if="selectedFile && preview"
            class="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300"
          >
            <p><span class="font-medium">Name:</span> {{ selectedFile.name }}</p>
            <p>
              <span class="font-medium">Size:</span>
              {{ (selectedFile.size / 1024).toFixed(1) }} KB
            </p>
            <p><span class="font-medium">Type:</span> {{ selectedFile.type }}</p>
          </div>

          <!-- AI processing status -->
          <div
            v-if="pollingMessage"
            class="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2"
          >
            <span class="animate-spin inline-block">⏳</span>
            {{ pollingMessage }}
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3">
            <RouterLink
              to="/assets"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              Cancel
            </RouterLink>
            <button
              type="submit"
              :disabled="!selectedFile || loading || !!pollingMessage"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {{ loading ? 'Uploading...' : 'Upload asset' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

let activeInterval = null

const router = useRouter()
const toast = useToastStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const preview = ref(null)
const loading = ref(false)
const pollingMessage = ref('')

onUnmounted(() => {
  if (activeInterval) clearInterval(activeInterval)
})

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) setFile(file)
}

function handleDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file) setFile(file)
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'audio/mpeg', 'audio/wav',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function setFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error('File type not allowed. Use images, PDF, video or audio.')
    return
  }
  if (file.size > MAX_SIZE_BYTES) {
    toast.error('File exceeds the 10MB limit.')
    return
  }
  selectedFile.value = file
  preview.value = null
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function clearFile() {
  selectedFile.value = null
  preview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function handleUpload() {
  if (!selectedFile.value) return

  loading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await api.post('/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const assetId = response.data.data.id
    clearFile()
    loading.value = false
    pollingMessage.value = 'AI is analyzing your file...'

    await pollStatus(assetId)

  } catch (e) {
    loading.value = false
    if (e.response?.status === 409) {
      toast.error('❌ This exact file already exists on the platform. It has not been uploaded.')
    } else {
      toast.error('Error uploading file. Please try again.')
    }
  }
}

function pollStatus(assetId) {
  return new Promise((resolve) => {
    const MAX_ATTEMPTS = 20
    let attempts = 0

    activeInterval = setInterval(async () => {
      attempts++

      try {
        const res = await api.get(`/assets/${assetId}/status`)
        const { status } = res.data

        if (status === 'processed') {
          clearInterval(activeInterval)
          pollingMessage.value = ''
          toast.success('Asset processed successfully ✨')
          router.push({ name: 'asset-detail', params: { id: assetId } })
          resolve()
        } else if (status === 'failed') {
          clearInterval(activeInterval)
          pollingMessage.value = ''
          toast.error('Could not generate metadata. The asset is available without it.')
          router.push({ name: 'asset-detail', params: { id: assetId } })
          resolve()
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(activeInterval)
          pollingMessage.value = ''
          router.push({ name: 'asset-detail', params: { id: assetId } })
          resolve()
        }
      } catch {
        clearInterval(activeInterval)
        pollingMessage.value = ''
        router.push({ name: 'asset-detail', params: { id: assetId } })
        resolve()
      }
    }, 3000)
  })
}
</script>
