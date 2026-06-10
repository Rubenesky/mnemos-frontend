<!-- AIProvenanceBadge.vue — RJC -->
<template>
  <span class="badge-row">
    <span
      class="badge badge--ai"
      :title="tooltipText"
    >
      {{ t('detail.provenance.aiBadge') }}
    </span>
    <span
      v-if="reviewedAt"
      class="badge badge--reviewed"
      :title="reviewedTooltip"
    >
      {{ t('detail.provenance.reviewedBadge') }}
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  model:       { type: String, default: null },
  generatedAt: { type: String, default: null },
  reviewedAt:  { type: String, default: null },
  reviewedBy:  { type: String, default: null },
})

const tooltipText = computed(() => {
  const parts = []
  if (props.model) parts.push(props.model)
  if (props.generatedAt) parts.push(new Date(props.generatedAt).toLocaleDateString())
  return parts.join(' · ')
})

const reviewedTooltip = computed(() => {
  if (!props.reviewedAt) return ''
  const date = new Date(props.reviewedAt).toLocaleDateString()
  return props.reviewedBy ? `${props.reviewedBy} · ${date}` : date
})
</script>

<style scoped>
.badge-row {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
  cursor: default;
}

.badge--ai       { background: #fef3c7; color: #92400e; }
.badge--reviewed { background: #dcfce7; color: #166534; }
</style>
