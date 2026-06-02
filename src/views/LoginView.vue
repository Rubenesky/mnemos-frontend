<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-gray-800 mb-1 text-center">Mnemos</h1>
      <p class="text-sm text-gray-500 text-center mb-6">Open memory for organizations that matter</p>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1"> Password </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
    router.push({ name: 'dashboard' })
  } catch (e) {
    error.value = 'Invalid credentials. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
