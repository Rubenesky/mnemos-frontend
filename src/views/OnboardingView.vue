<template>
  <div class="onboarding-page">
    <div class="onboarding-container">
      <!-- Logo -->
      <div class="onboarding-logo-wrap">
        <MnemosLogo />
      </div>

      <!-- Tagline -->
      <p class="onboarding-tagline">{{ t('onboarding.tagline') }}</p>

      <!-- Divider -->
      <div class="onboarding-divider"></div>

      <!-- Three feature blocks -->
      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon">📁</div>
          <h3 class="feature-title">{{ t('onboarding.features.archive.title') }}</h3>
          <p class="feature-desc">{{ t('onboarding.features.archive.desc') }}</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔒</div>
          <h3 class="feature-title">{{ t('onboarding.features.gdpr.title') }}</h3>
          <p class="feature-desc">{{ t('onboarding.features.gdpr.desc') }}</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🌐</div>
          <h3 class="feature-title">{{ t('onboarding.features.share.title') }}</h3>
          <p class="feature-desc">{{ t('onboarding.features.share.desc') }}</p>
        </div>
      </div>

      <!-- CTA -->
      <button type="button" class="btn-get-started" @click="handleGetStarted">
        {{ t('onboarding.getStarted') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import MnemosLogo from '@/components/MnemosLogo.vue'

const { t } = useI18n()
const router = useRouter()

function handleGetStarted() {
  localStorage.setItem('hasSeenOnboarding', 'true')
  router.push('/dashboard')
}
</script>

<style scoped>
/* ── Page ── */
.onboarding-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  font-family: var(--font-sans, 'Inter', sans-serif);
}

/* ── Container ── */
.onboarding-container {
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
}

/* ── Logo — scaled up for hero ── */
.onboarding-logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.onboarding-logo-wrap :deep(.logo-img) {
  height: 112px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ── Tagline ── */
.onboarding-tagline {
  color: var(--color-muted, #94a3b8);
  font-size: 1rem;
  text-align: center;
  margin: 0;
}

/* ── Divider ── */
.onboarding-divider {
  width: 100%;
  height: 1px;
  background: rgba(148, 163, 184, 0.2);
}

/* ── Features grid ── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  width: 100%;
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.feature-icon {
  font-size: 2rem;
  line-height: 1;
}

.feature-title {
  color: #0f172a;
  font-size: 0.9375rem;
  font-weight: 700;
  margin: 0;
}

.feature-desc {
  color: var(--color-muted, #94a3b8);
  font-size: 0.8125rem;
  margin: 0;
  line-height: 1.5;
}

/* ── CTA button ── */
.btn-get-started {
  background: var(--color-gold, #f59e0b);
  color: var(--color-navy, #0f172a);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 700;
  font-family: var(--font-sans, 'Inter', sans-serif);
  cursor: pointer;
  transition: opacity 0.15s ease;
  margin-top: 0.5rem;
}

.btn-get-started:hover {
  opacity: 0.9;
}

.btn-get-started:focus-visible {
  outline: 2px solid var(--color-white, #ffffff);
  outline-offset: 3px;
}
</style>
