<template>
  <div class="lang-selector">
    <button
      v-for="lang in ['en', 'es']"
      :key="lang"
      type="button"
      class="lang-btn"
      :class="{ 'lang-btn--active': locale === lang }"
      @click="switchLang(lang)"
    >
      {{ lang.toUpperCase() }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function switchLang(lang) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<style scoped>
.lang-selector { display: flex; gap: 0.25rem; align-items: center; }
.lang-btn {
  background: transparent;
  border: 1px solid var(--color-muted, #94a3b8);
  color: var(--color-muted, #94a3b8);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.15s;
}
.lang-btn:hover { color: var(--color-white, #fff); border-color: var(--color-white, #fff); }
.lang-btn--active { background: var(--color-gold, #f59e0b); border-color: var(--color-gold, #f59e0b); color: var(--color-navy, #0f172a); }
</style>
