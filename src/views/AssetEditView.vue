<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Edit asset</h1>
        <RouterLink
          :to="`/assets/${route.params.id}`"
          class="text-gray-500 dark:text-gray-400 hover:underline text-sm"
        >
          ← Back
        </RouterLink>
      </div>

      <div v-if="loading" class="text-center py-20 text-gray-400">Loading...</div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-2xl">
        <form @submit.prevent="handleUpdate">
          <!-- Title -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              v-model="form.title"
              type="text"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Description -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Tags -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags <span class="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              v-model="form.tags"
              type="text"
              placeholder="design, logo, web"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Alt-text -->
          <div class="mb-6">
            <label
              for="alt_text"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Alt-text <span class="text-gray-400 font-normal">(accessibility description)</span>
            </label>
            <textarea
              id="alt_text"
              v-model="form.alt_text"
              rows="3"
              maxlength="500"
              placeholder="Describe what's in this image for screen readers..."
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <p class="mt-1 text-xs text-gray-400">
              Used by screen readers. Auto-generated for images — you can edit it.
            </p>
          </div>

          <!-- AI notice -->
          <div
            class="mb-6 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg text-sm text-purple-700 dark:text-purple-300"
          >
            ✨ The current metadata was AI-generated. Saving will mark it as manually edited.
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3">
            <RouterLink
              :to="`/assets/${route.params.id}`"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              Cancel
            </RouterLink>
            <button
              type="submit"
              :disabled="saving"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const loading = ref(true)
const saving = ref(false)
const form = ref({
  title: '',
  description: '',
  tags: '',
  alt_text: '',
})

onMounted(async () => {
  try {
    const response = await api.get(`/assets/${route.params.id}`)
    const asset = response.data.data

    form.value.title = asset.metadata?.title ?? ''
    form.value.description = asset.metadata?.description ?? ''
    form.value.tags = asset.metadata?.tags?.join(', ') ?? ''
    form.value.alt_text = asset.alt_text ?? ''
  } catch (e) {
    toast.error('Error loading asset.')
  } finally {
    loading.value = false
  }
})

async function handleUpdate() {
  saving.value = true

  try {
    await api.patch(`/assets/${route.params.id}`, {
      title: form.value.title,
      description: form.value.description,
      tags: form.value.tags,
      alt_text: form.value.alt_text,
    })

    toast.success('Asset updated successfully.')
    router.push({ name: 'asset-detail', params: { id: route.params.id } })
  } catch (e) {
    toast.error('Error updating asset.')
  } finally {
    saving.value = false
  }
}
</script>
