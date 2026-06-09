<template>
  <div class="public-consent-page">
    <div class="consent-card">
      <!-- Logo -->
      <div class="consent-logo">
        <span class="consent-logo-m">M</span>
        <span class="consent-logo-text">nemos</span>
      </div>

      <!-- Loading -->
      <div v-if="state === 'loading'" class="consent-state">
        <p class="state-text">Cargando solicitud...</p>
      </div>

      <!-- Not found / expired -->
      <div v-else-if="state === 'invalid'" class="consent-state consent-state--error">
        <div class="state-icon">&#10007;</div>
        <h2 class="state-title">Enlace no válido</h2>
        <p class="state-text">Este enlace ha caducado o ya ha sido utilizado.</p>
      </div>

      <!-- Confirmation after responding -->
      <div v-else-if="state === 'done'" class="consent-state consent-state--done">
        <div class="state-icon" :class="responseStatus === 'obtained' ? 'state-icon--success' : 'state-icon--denied'">
          {{ responseStatus === 'obtained' ? '✓' : '✗' }}
        </div>
        <h2 class="state-title">Tu respuesta ha sido registrada</h2>
        <p class="state-text">Puedes cerrar esta ventana.</p>
      </div>

      <!-- Network / server error -->
      <div v-else-if="state === 'error'" class="consent-state consent-state--error">
        <div class="state-icon">&#10007;</div>
        <h2 class="state-title">Ha ocurrido un error</h2>
        <p class="state-text">Por favor inténtalo de nuevo o contacta con la organización.</p>
        <button class="btn-retry" @click="state = 'ready'">Reintentar</button>
      </div>

      <!-- Consent form -->
      <div v-else-if="state === 'ready'" class="consent-body">
        <h1 class="consent-title">Solicitud de consentimiento</h1>
        <p class="consent-subtitle">Se solicita tu consentimiento para el uso de material audiovisual.</p>

        <dl class="consent-details">
          <div class="detail-row">
            <dt>Persona</dt>
            <dd>{{ consent.person_name }}</dd>
          </div>
          <div class="detail-row">
            <dt>Tipo</dt>
            <dd>{{ typeLabel(consent.consent_type) }}</dd>
          </div>
          <div class="detail-row">
            <dt>Material</dt>
            <dd>{{ consent.asset_title }}</dd>
          </div>
          <div class="detail-row">
            <dt>Fecha de solicitud</dt>
            <dd>{{ formatDate(consent.consent_date) }}</dd>
          </div>
          <div class="detail-row">
            <dt>Válido hasta</dt>
            <dd>{{ formatDate(consent.expires_at) }}</dd>
          </div>
        </dl>

        <p class="consent-notice">
          Al pulsar <strong>Acepto</strong> autorizas el uso del material indicado. Si pulsas
          <strong>No acepto</strong> quedará registrado y el material no podrá publicarse.
        </p>

        <div class="consent-actions">
          <button class="btn-deny" :disabled="responding" @click="respond('denied')">
            {{ responding ? 'Guardando...' : 'No acepto' }}
          </button>
          <button class="btn-accept" :disabled="responding" @click="respond('obtained')">
            {{ responding ? 'Guardando...' : 'Acepto' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const token = route.params.token

const state = ref('loading')   // loading | invalid | ready | done
const consent = ref(null)
const responding = ref(false)
const responseStatus = ref(null)

const apiBase = import.meta.env.VITE_API_URL ?? '/api'

onMounted(async () => {
  try {
    const { data } = await axios.get(`${apiBase}/public/consents/${token}`)
    consent.value = data.data
    state.value = 'ready'
  } catch {
    state.value = 'invalid'
  }
})

async function respond(status) {
  responding.value = true
  try {
    await axios.post(`${apiBase}/public/consents/${token}`, { status }, { timeout: 10000 })
    responseStatus.value = status
    state.value = 'done'
  } catch {
    state.value = 'error'
  } finally {
    responding.value = false
  }
}

function typeLabel(type) {
  const map = { photo: 'Fotografía', video: 'Vídeo', audio: 'Audio', general: 'General' }
  return map[type] ?? type
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.public-consent-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.consent-card {
  background: white;
  border: 0.5px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  max-width: 480px;
  width: 100%;
  padding: 40px 36px;
  box-sizing: border-box;
}

.consent-logo {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0;
  margin-bottom: 32px;
}

.consent-logo-m {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.consent-logo-text {
  font-size: 22px;
  font-weight: 300;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1;
}

.consent-state {
  text-align: center;
  padding: 16px 0;
}

.state-icon {
  font-size: 40px;
  color: #991b1b;
  margin-bottom: 12px;
  line-height: 1;
}

.state-icon--success {
  color: #166534;
}

.state-icon--denied {
  color: #991b1b;
}

.btn-retry {
  margin-top: 16px;
  height: 38px;
  padding: 0 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}
.btn-retry:hover {
  background: #f1f5f9;
}

.state-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 8px;
}

.state-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.consent-title {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px;
  text-align: center;
}

.consent-subtitle {
  font-size: 13px;
  color: #64748b;
  text-align: center;
  margin: 0 0 28px;
}

.consent-details {
  background: #f8fafc;
  border-radius: 8px;
  border: 0.5px solid #e2e8f0;
  padding: 16px 20px;
  margin: 0 0 20px;
}

.detail-row {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 0.5px solid #e2e8f0;
  font-size: 13px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row dt {
  color: #64748b;
  min-width: 130px;
  flex-shrink: 0;
}

.detail-row dd {
  color: #0f172a;
  font-weight: 500;
  margin: 0;
  word-break: break-word;
}

.consent-notice {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 24px;
  text-align: center;
}

.consent-notice strong {
  color: #64748b;
}

.consent-actions {
  display: flex;
  gap: 10px;
}

.btn-deny {
  flex: 1;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.12s, color 0.12s;
}

.btn-deny:hover:not(:disabled) {
  border-color: #991b1b;
  color: #991b1b;
}

.btn-deny:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-accept {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #0f172a;
  color: #f59e0b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.12s;
}

.btn-accept:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-accept:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 520px) {
  .consent-card {
    padding: 28px 20px;
  }
}
</style>
