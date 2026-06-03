<template>
  <AppLayout>
    <div v-if="loading" class="text-center py-20 text-gray-400">{{ t('common.loading') }}</div>

    <div v-else-if="!asset" class="text-center py-20 text-gray-400">{{ t('detail.notFound') }}</div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {{ asset.metadata?.title ?? asset.original_name }}
        </h1>
        <div class="flex gap-3">
          <RouterLink
            :to="`/assets/${asset.id}/edit`"
            class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
          >
            {{ t('common.edit') }}
          </RouterLink>
          <button
            v-if="auth.isAdmin"
            @click="handleDelete"
            class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            {{ t('common.delete') }}
          </button>
          <RouterLink to="/assets" class="text-gray-500 dark:text-gray-400 hover:underline text-sm">
            {{ t('detail.back') }}
          </RouterLink>
        </div>
      </div>

      <!-- Preview -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <img
          v-if="asset.mime_type.startsWith('image/')"
          :src="asset.url"
          :alt="asset.original_name"
          class="max-h-96 mx-auto rounded-lg"
        />
        <div
          v-else
          class="flex items-center justify-center h-40 bg-gray-100 dark:bg-gray-700 rounded-lg"
        >
          <span class="text-6xl">📄</span>
        </div>
      </div>

      <!-- Information and Metadata -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 class="font-semibold text-gray-800 dark:text-gray-200 mb-4">{{ t('detail.information') }}</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('detail.originalName') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200 font-medium">
                {{ asset.original_name }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('detail.type') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ asset.mime_type }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('detail.size') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ asset.size_kb }} KB</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('detail.uploadedBy') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ asset.uploaded_by }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('detail.status') }}</dt>
              <dd>
                <span
                  v-if="asset.status === 'processed'"
                  class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
                >
                  {{ t('assets.status.processed') }}
                </span>
                <span v-else class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {{ t('assets.status.pending') }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">{{ t('detail.date') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200">{{ formatDate(asset.created_at) }}</dd>
            </div>
            <div v-if="asset.mime_type.startsWith('image/')" class="flex justify-between items-start gap-4">
              <dt class="text-gray-500 dark:text-gray-400 shrink-0">{{ t('detail.altText') }}</dt>
              <dd class="text-right text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span v-if="asset.alt_text">{{ asset.alt_text }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">{{ t('detail.notGeneratedYet') }}</span>
                <span
                  v-if="asset.alt_text"
                  class="ai-badge"
                >{{ t('detail.aiGenerated') }}</span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- AI Metadata -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6" v-if="asset.metadata">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-gray-800 dark:text-gray-200">{{ t('detail.metadata') }}</h2>
            <span
              v-if="asset.metadata.ai_generated"
              class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full"
            >
              ✨ AI generated
            </span>
          </div>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-gray-500 dark:text-gray-400 mb-1">{{ t('detail.title') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200 font-medium">
                {{ asset.metadata.title ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400 mb-1">{{ t('detail.description') }}</dt>
              <dd class="text-gray-800 dark:text-gray-200">
                {{ asset.metadata.description ?? '—' }}
              </dd>
            </div>
            <div v-if="asset.metadata.tags?.length">
              <dt class="text-gray-500 dark:text-gray-400 mb-2">{{ t('detail.tags') }}</dt>
              <dd class="flex flex-wrap gap-2">
                <span
                  v-for="tag in asset.metadata.tags"
                  :key="tag"
                  class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {{ tag }}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- GDPR Consent Status (admin/editor only) -->
      <div
        v-if="auth.isAdmin || auth.isEditor"
        class="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-semibold text-gray-800 dark:text-gray-200">{{ t('detail.consentStatus') }}</h2>
          <RouterLink
            :to="`/consents?asset_id=${asset.id}`"
            class="text-sm text-amber-600 hover:underline font-medium"
          >
            {{ t('detail.manageConsents') }}
          </RouterLink>
        </div>

        <div v-if="consentsLoading" class="text-sm text-gray-400">{{ t('detail.loadingConsents') }}</div>

        <div v-else-if="assetConsents.length === 0" class="text-sm text-gray-400">
          {{ t('detail.noConsents') }}
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="consent in assetConsents"
            :key="consent.id"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="text-gray-800 dark:text-gray-200 font-medium">{{ consent.person_name }}</span>
            <ConsentBadge :status="consent.status" />
          </li>
        </ul>
      </div>

      <!-- AI variant generator -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="font-semibold text-gray-800 dark:text-gray-200">{{ t('detail.aiSuggestions') }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('detail.aiSuggestionsDesc') }}
            </p>
          </div>
          <button
            @click="generateVariants"
            :disabled="variantsLoading"
            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            {{ variantsLoading ? t('detail.generating') : t('detail.generateBtn') }}
          </button>
        </div>

        <!-- Generated variants -->
        <div v-if="variants" class="space-y-4">
          <!-- Alternative titles -->
          <div v-if="variants.titles?.length">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('detail.alternativeTitles') }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="(title, i) in variants.titles"
                :key="i"
                class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span class="text-sm text-gray-800 dark:text-gray-200">{{ title }}</span>
                <button
                  @click="applyVariant('title', title)"
                  class="text-xs text-blue-600 hover:underline ml-2 shrink-0"
                >
                  {{ t('detail.useThis') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Improved descriptions -->
          <div v-if="variants.descriptions?.length">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('detail.improvedDescriptions') }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="(desc, i) in variants.descriptions"
                :key="i"
                class="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span class="text-sm text-gray-800 dark:text-gray-200">{{ desc }}</span>
                <button
                  @click="applyVariant('description', desc)"
                  class="text-xs text-blue-600 hover:underline ml-2 shrink-0"
                >
                  {{ t('detail.useThis') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Additional tags -->
          <div v-if="variants.additional_tags?.length">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('detail.suggestedTags') }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in variants.additional_tags"
                :key="tag"
                @click="applyTag(tag)"
                class="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full hover:bg-purple-200 transition"
              >
                + {{ tag }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              {{ t('detail.clickTagHint') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import ConsentBadge from '../components/ConsentBadge.vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import api from '../api/axios'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const loading = ref(true)
const asset = ref(null)
const variants = ref(null)
const variantsLoading = ref(false)
const assetConsents = ref([])
const consentsLoading = ref(false)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleDelete() {
  if (!confirm(t('detail.deleteConfirm'))) return

  try {
    await api.delete(`/assets/${route.params.id}`)
    toast.success('Asset deleted successfully.')
    router.push({ name: 'assets' })
  } catch (e) {
    toast.error('Error deleting asset.')
  }
}

async function generateVariants() {
  variantsLoading.value = true
  variants.value = null

  try {
    const response = await api.post(`/assets/${route.params.id}/variants`)
    variants.value = response.data.variants
    toast.success('Suggestions generated successfully.')
  } catch (e) {
    toast.error('Error generating suggestions. Please try again.')
  } finally {
    variantsLoading.value = false
  }
}

async function applyVariant(field, value) {
  try {
    const currentTags = asset.value.metadata?.tags?.join(', ') ?? ''
    await api.patch(`/assets/${route.params.id}`, {
      title: field === 'title' ? value : asset.value.metadata?.title,
      description: field === 'description' ? value : asset.value.metadata?.description,
      tags: currentTags,
    })

    // Update asset locally
    if (field === 'title') asset.value.metadata.title = value
    if (field === 'description') asset.value.metadata.description = value

    toast.success('Metadata updated successfully.')
  } catch (e) {
    toast.error('Error applying suggestion.')
  }
}

async function applyTag(tag) {
  try {
    const currentTags = asset.value.metadata?.tags ?? []
    if (currentTags.includes(tag)) {
      toast.info('That tag already exists in the metadata.')
      return
    }

    const newTags = [...currentTags, tag]
    await api.patch(`/assets/${route.params.id}`, {
      title: asset.value.metadata?.title,
      description: asset.value.metadata?.description,
      tags: newTags.join(', '),
    })

    asset.value.metadata.tags = newTags
    toast.success(`Tag "${tag}" added successfully.`)
  } catch (e) {
    toast.error('Error adding tag.')
  }
}

async function fetchAssetConsents(assetId) {
  if (!auth.isAdmin && !auth.isEditor) return
  consentsLoading.value = true
  try {
    const { data } = await api.get('/consents', { params: { asset_id: assetId } })
    assetConsents.value = data.data?.data ?? data.data ?? []
  } catch {
    // Non-critical — section is simply empty on error
  } finally {
    consentsLoading.value = false
  }
}

onMounted(async () => {
  try {
    const response = await api.get(`/assets/${route.params.id}`)
    asset.value = response.data.data
    await fetchAssetConsents(route.params.id)
  } catch (e) {
    // error handled by axios interceptor
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ai-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background-color: #fef3c7;
  color: #92400e;
  white-space: nowrap;
}
</style>
