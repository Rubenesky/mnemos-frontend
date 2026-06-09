<template>
  <AppLayout>
    <div class="audit-wrapper">
      <!-- Header -->
      <div class="audit-header">
        <RouterLink :to="`/assets/${assetId}`" class="audit-back">
          {{ t('audit.back') }}
        </RouterLink>
        <h1 class="audit-title">{{ t('audit.title') }}</h1>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="audit-loading">
        {{ t('audit.loading') }}
      </div>

      <!-- Empty -->
      <div v-else-if="entries.length === 0" class="audit-empty">
        <span class="audit-empty-icon">📋</span>
        <p>{{ t('audit.empty') }}</p>
      </div>

      <!-- Timeline -->
      <div v-else class="timeline">
        <div
          v-for="(entry, index) in entries"
          :key="index"
          class="timeline-item"
        >
          <!-- Dot + connector line -->
          <div class="timeline-track">
            <div class="timeline-dot" :class="`timeline-dot--${entry.event}`">
              <span class="timeline-icon">{{ eventIcon(entry.event) }}</span>
            </div>
            <div v-if="index < entries.length - 1" class="timeline-line" />
          </div>

          <!-- Content card -->
          <div class="timeline-content">
            <div class="timeline-event-row">
              <span class="timeline-event-label">
                {{ t(`audit.event.${entry.event}`, entry.event) }}
              </span>
              <span class="timeline-time" :title="formatAbsolute(entry.timestamp)">
                {{ formatRelative(entry.timestamp) }}
              </span>
            </div>
            <p class="timeline-user">{{ t('audit.by') }} {{ entry.user }}</p>
            <p v-if="entry.detail" class="timeline-detail">{{ entry.detail }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'
import api from '../api/axios'

const { t } = useI18n()
const route = useRoute()

const assetId = route.params.id
const loading = ref(true)
const entries = ref([])

onMounted(async () => {
  try {
    const response = await api.get(`/assets/${assetId}/audit`)
    entries.value = response.data.data
  } finally {
    loading.value = false
  }
})

/** Returns an emoji icon for a given audit event type. */
function eventIcon(event) {
  const icons = {
    'upload':                 '⬆️',
    'edit':                   '✏️',
    'delete':                 '🗑️',
    'press-kit-toggle':       '📰',
    'emergency-kit-toggle':   '🚨',
    'emergency-kit-download': '⬇️',
    'consent-create':         '🛡️',
    'consent-update':         '🛡️',
  }
  return icons[event] ?? '📋'
}

/** Returns a short relative time string ("2h ago", "3d ago"). */
function formatRelative(iso) {
  const diff    = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours / 24)

  if (seconds < 60) return seconds <= 5 ? 'just now' : `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24)   return `${hours}h ago`
  if (days < 7)     return `${days}d ago`
  return formatAbsolute(iso)
}

/** Returns a full locale date string used as tooltip on the relative time. */
function formatAbsolute(iso) {
  return new Date(iso).toLocaleString()
}
</script>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────────────────────── */
.audit-wrapper {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.audit-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.audit-back {
  color: #f59e0b;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.audit-back:hover { opacity: 0.7; }

.audit-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

/* ── States ──────────────────────────────────────────────────────────────── */
.audit-loading,
.audit-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
  font-size: 0.95rem;
}

.audit-empty-icon {
  display: block;
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

/* ── Timeline ────────────────────────────────────────────────────────────── */
.timeline { position: relative; }

.timeline-item {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.timeline-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 2.5rem;
}

/* ── Dot ─────────────────────────────────────────────────────────────────── */
.timeline-dot {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px #e2e8f0;
}

.timeline-dot--upload               { background: #f59e0b; }
.timeline-dot--edit                 { background: #3b82f6; }
.timeline-dot--delete               { background: #ef4444; }
.timeline-dot--press-kit-toggle     { background: #8b5cf6; }
.timeline-dot--emergency-kit-toggle,
.timeline-dot--emergency-kit-download { background: #ef4444; }
.timeline-dot--consent-create,
.timeline-dot--consent-update       { background: #22c55e; }

.timeline-icon {
  font-size: 1rem;
  line-height: 1;
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 1.5rem;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

/* ── Content card ────────────────────────────────────────────────────────── */
.timeline-content {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.timeline-event-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.timeline-event-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #0f172a;
}

.timeline-time {
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
  cursor: default;
}

.timeline-user {
  font-size: 0.825rem;
  color: #64748b;
  margin: 0 0 0.25rem;
}

.timeline-detail {
  font-size: 0.825rem;
  color: #475569;
  background: #f8fafc;
  border-radius: 0.375rem;
  padding: 0.3rem 0.6rem;
  margin: 0.5rem 0 0;
  word-break: break-word;
}
</style>
