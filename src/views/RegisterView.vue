<template>
  <div class="register-page">
    <div class="register-logo-area">
      <RouterLink to="/gallery" class="logo-link"><MnemosLogo /></RouterLink>
      <p class="register-tagline">{{ t('onboarding.tagline') }}</p>
    </div>

    <div class="register-card">
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label class="form-label">{{ t('auth.name') }}</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Jane Doe"
            class="form-input"
            :disabled="loading"
          />
        </div>

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

        <div class="form-group">
          <label class="form-label">{{ t('auth.confirmPassword') }}</label>
          <input
            v-model="passwordConfirmation"
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

        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? t('auth.registering') : t('auth.register') }}
        </button>
      </form>

      <p class="form-footer">
        {{ t('auth.alreadyAccount') }}
        <RouterLink to="/login" class="form-link">{{ t('auth.login') }}</RouterLink>
      </p>
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
import api from '../api/axios'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''

  if (password.value !== passwordConfirmation.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    const response = await api.post('/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    auth.setSession(response.data.token, response.data.user)

    router.push({ name: 'dashboard' })
  } catch (e) {
    const status = e.response?.status
    if (status === 422) {
      error.value = t('auth.emailTaken')
    } else {
      error.value = 'Error al crear la cuenta. Inténtalo de nuevo.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
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

.register-logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.register-logo-area :deep(.logo-img) {
  height: 112px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
}

.register-logo-area :deep(.logo-wordmark) {
  font-size: 22px;
  font-weight: 700;
}

.register-tagline {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

.register-card {
  background: #ffffff;
  border: 0.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 380px;
}

.register-form {
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
