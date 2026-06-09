<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">{{ t('edit.title') }}</h1>
        <RouterLink
          :to="`/assets/${route.params.id}`"
          class="text-gray-500 dark:text-gray-400 hover:underline text-sm"
        >
          {{ t('edit.back') }}
        </RouterLink>
      </div>

      <div v-if="loading" class="text-center py-20 text-gray-400">{{ t('common.loading') }}</div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-w-2xl">
        <form @submit.prevent="handleUpdate">
          <!-- Title -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('edit.titleLabel') }}
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
              {{ t('edit.descriptionLabel') }}
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
              {{ t('edit.tagsLabel') }} <span class="text-gray-400 font-normal">{{ t('edit.tagsHint') }}</span>
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
              {{ t('edit.altTextLabel') }} <span class="text-gray-400 font-normal">{{ t('edit.altTextHint') }}</span>
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
              {{ t('edit.altTextNote') }}
            </p>
          </div>

          <!-- Publish toggle — hidden for volunteers -->
          <div v-if="!auth.isVolunteer" class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.is_public"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('edit.publishLabel') }}
              </span>
            </label>
            <p class="mt-1 text-xs text-gray-400">
              {{ t('edit.publishNote') }}
            </p>
          </div>

          <!-- AI notice -->
          <div
            class="mb-6 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg text-sm text-purple-700 dark:text-purple-300"
          >
            {{ t('edit.aiNotice') }}
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-3">
            <RouterLink
              :to="`/assets/${route.params.id}`"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              {{ t('edit.cancel') }}
            </RouterLink>
            <button
              type="submit"
              :disabled="saving"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {{ saving ? t('edit.saving') : t('edit.saveBtn') }}
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
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const loading = ref(true)
const saving = ref(false)
const form = ref({
  title: '',
  description: '',
  tags: '',
  alt_text: '',
  is_public: false,
})

onMounted(async () => {
  try {
    const response = await api.get(`/assets/${route.params.id}`)
    const asset = response.data.data

    form.value.title = asset.metadata?.title ?? ''
    form.value.description = asset.metadata?.description ?? ''
    form.value.tags = asset.metadata?.tags?.join(', ') ?? ''
    form.value.alt_text = asset.alt_text ?? ''
    form.value.is_public = asset.is_public ?? false
  } catch (e) {
    toast.error(t('edit.loadError'))
  } finally {
    loading.value = false
  }
})

async function handleUpdate() {
  saving.value = true

  try {
    const payload = {
      title: form.value.title,
      description: form.value.description,
      tags: form.value.tags,
      alt_text: form.value.alt_text,
    }
    // Only send is_public if the user is allowed to toggle it
    if (!auth.isVolunteer) {
      payload.is_public = form.value.is_public
    }
    await api.patch(`/assets/${route.params.id}`, payload)

    toast.success(t('edit.saved'))
    router.push({ name: 'asset-detail', params: { id: route.params.id } })
  } catch (e) {
    toast.error(t('edit.saveError'))
  } finally {
    saving.value = false
  }
}
</script>
