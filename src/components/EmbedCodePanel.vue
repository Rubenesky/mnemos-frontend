<template>
  <div class="embed-panel">
    <h3 class="panel-title">{{ t('embed.title') }}</h3>

    <!-- Controls -->
    <div class="panel-controls">
      <label class="ctrl-label">
        {{ t('embed.theme') }}
        <select v-model="theme" class="ctrl-select">
          <option value="light">{{ t('embed.themeLight') }}</option>
          <option value="dark">{{ t('embed.themeDark') }}</option>
        </select>
      </label>

      <label class="ctrl-label">
        {{ t('embed.cols') }}
        <select v-model="cols" class="ctrl-select">
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
        </select>
      </label>

      <label class="ctrl-label">
        {{ t('embed.limit') }}
        <select v-model="limit" class="ctrl-select">
          <option :value="6">6</option>
          <option :value="12">12</option>
          <option :value="24">24</option>
        </select>
      </label>
    </div>

    <!-- Live preview -->
    <p class="section-label">{{ t('embed.preview') }}</p>
    <div class="preview-wrap">
      <iframe
        :src="embedUrl"
        class="preview-frame"
        frameborder="0"
        scrolling="auto"
        :title="t('embed.preview')"
      ></iframe>
    </div>

    <!-- Code snippet -->
    <p class="section-label">{{ t('embed.code') }}</p>
    <div class="snippet-wrap">
      <pre class="snippet-code">{{ snippet }}</pre>
      <button class="copy-btn" @click="copyCode">
        {{ copied ? t('embed.copied') : t('embed.copy') }}
      </button>
    </div>

    <p class="usage-hint">{{ t('embed.usage') }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  slug: { type: String, required: true },
})

const { t } = useI18n()

const theme = ref('light')
const cols = ref(3)
const limit = ref(6)
const copied = ref(false)

const BASE = import.meta.env.VITE_API_URL  // e.g. http://localhost:8001/api

const embedUrl = computed(
  () => `${BASE}/public/embed/${props.slug}?theme=${theme.value}&cols=${cols.value}&limit=${limit.value}`,
)

const snippet = computed(
  () => `<iframe src="${embedUrl.value}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`,
)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(snippet.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // clipboard unavailable — silently ignore
  }
}
</script>

<style scoped>
.embed-panel {
  margin-top: 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 1rem;
}

.panel-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.ctrl-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.ctrl-select {
  font-size: 13px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
}

.ctrl-select:focus { outline: 2px solid #0f172a; outline-offset: 1px; }

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin: 0 0 0.5rem;
}

.preview-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1.25rem;
  height: 320px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.snippet-wrap {
  position: relative;
  margin-bottom: 0.75rem;
}

.snippet-code {
  background: #0f172a;
  color: #f1f5f9;
  font-size: 12px;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  line-height: 1.6;
  padding: 0.875rem 1rem;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f59e0b;
  color: #0f172a;
  font-size: 11px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.copy-btn:hover { opacity: 0.85; }

.usage-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}
</style>
