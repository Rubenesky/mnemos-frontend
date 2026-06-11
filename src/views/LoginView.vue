<template>
  <div class="login-page">
    <!-- Logo area above the card -->
    <div class="login-logo-area">
      <RouterLink to="/gallery" class="logo-link"><MnemosLogo /></RouterLink>
      <p class="login-tagline">{{ t('onboarding.tagline') }}</p>
    </div>

    <div class="login-card">
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
          class="btn-submit"
        >
          {{ loading ? t('auth.signingIn') : t('auth.login') }}
        </button>
      </form>

    </div>
    <RouterLink to="/gallery" class="gallery-link">{{ t('auth.viewGallery') }}</RouterLink>
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
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 12% 60%, rgba(245, 158, 11, 0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 88% 10%, rgba(15, 23, 42, 0.10) 0%, transparent 48%),
    radial-gradient(ellipse at 60% 90%, rgba(245, 158, 11, 0.08) 0%, transparent 40%),
    #fafaf8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  gap: 1.5rem;
}

.logo-link { display: contents; text-decoration: none; }

.login-logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.login-logo-area :deep(.logo-img) {
  height: 112px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
}

.login-logo-area :deep(.logo-wordmark) {
  font-size: 22px;
  font-weight: 700;
}

.login-tagline {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.login-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 380px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.form-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0 10px;
  height: 34px;
  font-size: 13px;
  font-family: inherit;
  color: #0f172a;
  outline: none;
  background: #ffffff;
  transition: border-color 0.12s ease;
}

.form-input:focus { border-color: #0f172a; }
.form-input::placeholder { color: #94a3b8; }
.form-input:disabled { opacity: 0.55; cursor: not-allowed; }

.form-error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
}

.btn-submit {
  width: 100%;
  background: #0f172a;
  color: #f59e0b;
  border: none;
  border-radius: 6px;
  height: 36px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.12s ease;
  margin-top: 4px;
}

.btn-submit:hover:not(:disabled) { opacity: 0.88; }
.btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

.form-footer {
  margin: 16px 0 0;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.form-link {
  color: #0f172a;
  font-weight: 500;
  text-decoration: none;
}

.form-link:hover { text-decoration: underline; }

.gallery-link {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
  text-align: center;
  transition: color 0.12s ease;
}

.gallery-link:hover { color: #64748b; }
</style>
