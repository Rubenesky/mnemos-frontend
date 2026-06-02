<template>
  <span class="consent-badge" :class="`consent-badge--${status}`">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }, // 'obtained' | 'pending' | 'denied'
})

const labels = { obtained: 'Obtained', pending: 'Pending', denied: 'Denied' }
const label = computed(() => labels[props.status] || props.status)
</script>

<style scoped>
.consent-badge {
  display: inline-block;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.consent-badge--obtained { background: var(--color-consent-green, #22c55e); color: #fff; }
.consent-badge--pending  { background: var(--color-consent-yellow, #f59e0b); color: #0f172a; }
.consent-badge--denied   { background: var(--color-consent-red, #ef4444); color: #fff; }
</style>
