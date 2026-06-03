<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-header">
        <MnemosLogo />
        <p class="login-tagline">Open memory for organizations that matter</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">{{ t('auth.email') }}</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('auth.password') }}</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="form-error" aria-live="polite" role="alert">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-primary"
        >
          {{ loading ? t('auth.signingIn') : t('auth.login') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MnemosLogo from '../components/MnemosLogo.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await auth.login(email.value, password.value)
    if (!localStorage.getItem('hasSeenOnboarding')) {
      router.push({ name: 'onboarding' })
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (e) {
    error.value = t('auth.invalidCredentials')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Full-page background ── */
.login-page {
  min-height: 100vh;
  background: var(--color-navy, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

/* ── Card ── */
.login-card {
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
}

/* ── Header ── */
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

/* Override logo wordmark color for card context (navy background gone) */
.login-header :deep(.mnemos-wordmark) {
  color: var(--color-navy, #0f172a);
}

.login-tagline {
  color: var(--color-muted, #94a3b8);
  font-size: 0.8125rem;
  text-align: center;
  margin: 0;
}

/* ── Form ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-form-text);
}

.form-input {
  border: 1px solid var(--color-form-border);
  border-radius: 8px;
  padding: 0.625rem 0.75rem;
  font-size: 0.9375rem;
  font-family: var(--font-sans, 'Inter', sans-serif);
  color: var(--color-form-text);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  background: #ffffff;
}

.form-input:focus {
  border-color: var(--color-gold, #f59e0b);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.form-input::placeholder {
  color: var(--color-input-placeholder);
}

/* ── Error ── */
.form-error {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  color: var(--color-error-text);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}

/* ── Primary button ── */
.btn-primary {
  width: 100%;
  background: var(--color-gold, #f59e0b);
  color: var(--color-navy, #0f172a);
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  font-size: 0.9375rem;
  font-weight: 700;
  font-family: var(--font-sans, 'Inter', sans-serif);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
