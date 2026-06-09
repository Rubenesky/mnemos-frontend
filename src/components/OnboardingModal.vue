<template>
  <div class="ob-overlay" role="dialog" aria-modal="true" aria-labelledby="ob-title" @click.self="close">
    <div class="ob-card">

      <!-- Close button -->
      <button class="ob-close" aria-label="Cerrar" @click="close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- ── STEP 1 ── -->
      <div v-if="step === 1" class="ob-step">
        <div class="ob-logo-mark" aria-hidden="true">
          <span class="ob-logo-m">M</span>
        </div>
        <h1 id="ob-title" class="ob-title">Bienvenido a Mnemos</h1>
        <p class="ob-body">
          Tu archivo digital para gestionar, proteger y compartir el patrimonio
          visual de tu organización.
        </p>
      </div>

      <!-- ── STEP 2 ── -->
      <div v-else-if="step === 2" class="ob-step">
        <h1 id="ob-title" class="ob-title">Lo que puedes hacer</h1>
        <div class="ob-tiles">
          <div class="ob-tile">
            <span class="ob-tile-icon" aria-hidden="true">📁</span>
            <h3 class="ob-tile-heading">Archiva</h3>
            <p class="ob-tile-text">Sube fotos, vídeos y audios. La IA los etiqueta y describe automáticamente.</p>
          </div>
          <div class="ob-tile">
            <span class="ob-tile-icon" aria-hidden="true">🔒</span>
            <h3 class="ob-tile-heading">Protege</h3>
            <p class="ob-tile-text">Gestiona el consentimiento GDPR de cada persona que aparece en tu material.</p>
          </div>
          <div class="ob-tile">
            <span class="ob-tile-icon" aria-hidden="true">🌐</span>
            <h3 class="ob-tile-heading">Comparte</h3>
            <p class="ob-tile-text">Publica colecciones en la galería pública sin necesidad de cuenta.</p>
          </div>
        </div>
      </div>

      <!-- ── STEP 3 ── -->
      <div v-else class="ob-step">
        <div class="ob-check" aria-hidden="true">
          <svg viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" stroke="#f59e0b" stroke-width="2"/>
            <polyline points="14,27 22,35 38,18" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 id="ob-title" class="ob-title">¡Todo listo!</h1>
        <p class="ob-body">
          Empieza explorando el panel o subiendo tu primer archivo.
        </p>
      </div>

      <!-- Dots -->
      <div class="ob-dots" role="tablist" aria-label="Pasos del tutorial">
        <button
          v-for="n in 3"
          :key="n"
          class="ob-dot"
          :class="{ 'ob-dot--active': step === n }"
          :aria-label="`Paso ${n}`"
          :aria-selected="step === n"
          role="tab"
          @click="step = n"
        />
      </div>

      <!-- Navigation -->
      <div class="ob-nav">
        <button v-if="step > 1" class="ob-btn ob-btn--ghost" @click="prev">
          ← Anterior
        </button>
        <span v-else class="ob-nav-spacer" />

        <button v-if="step < 3" class="ob-btn ob-btn--primary" @click="next">
          Siguiente →
        </button>
        <button v-else class="ob-btn ob-btn--cta" @click="finish">
          Empezar ahora
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['done'])

const step = ref(1)

function next () {
  if (step.value < 3) step.value++
}

function prev () {
  if (step.value > 1) step.value--
}

function finish () {
  localStorage.setItem('mnemos_onboarding_completed', '1')
  emit('done')
}

function close () {
  localStorage.setItem('mnemos_onboarding_completed', '1')
  emit('done')
}

function handleKey (e) {
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}

onMounted(() => document.addEventListener('keydown', handleKey))
onUnmounted(() => document.removeEventListener('keydown', handleKey))
</script>

<style scoped>
/* ── Overlay ── */
.ob-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(2px);
}

/* ── Card ── */
.ob-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 40px 36px 32px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
  animation: ob-enter 0.22s ease-out;
}

@keyframes ob-enter {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
}

/* ── Close ── */
.ob-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: background 0.15s, color 0.15s;
}
.ob-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.ob-close svg {
  width: 16px;
  height: 16px;
}

/* ── Step container ── */
.ob-step {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ── Step 1 logo mark ── */
.ob-logo-mark {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
}
.ob-logo-m {
  font-size: 38px;
  font-weight: 700;
  color: #f59e0b;
  line-height: 1;
  letter-spacing: -0.03em;
  font-family: Georgia, serif;
}

/* ── Step 3 checkmark ── */
.ob-check {
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
}
.ob-check svg {
  width: 100%;
  height: 100%;
}

/* ── Title ── */
.ob-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

/* ── Body text ── */
.ob-body {
  font-size: 15px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  max-width: 380px;
}

/* ── Feature tiles (step 2) ── */
.ob-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}

.ob-tile {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ob-tile:hover {
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
}

.ob-tile-icon {
  font-size: 24px;
  line-height: 1;
}
.ob-tile-heading {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.ob-tile-text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

/* ── Step dots ── */
.ob-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 28px 0 24px;
}

.ob-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.ob-dot--active {
  background: #f59e0b;
  border-color: #f59e0b;
  transform: scale(1.25);
}

/* ── Navigation row ── */
.ob-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ob-nav-spacer {
  flex: 1;
}

/* ── Buttons ── */
.ob-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.1s;
  white-space: nowrap;
}
.ob-btn:active {
  transform: scale(0.97);
}

.ob-btn--primary {
  background: #0f172a;
  color: #ffffff;
}
.ob-btn--primary:hover {
  background: #1e293b;
}

.ob-btn--ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
.ob-btn--ghost:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.ob-btn--cta {
  background: #f59e0b;
  color: #0f172a;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}
.ob-btn--cta:hover {
  background: #d97706;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .ob-card {
    padding: 32px 20px 24px;
  }
  .ob-tiles {
    grid-template-columns: 1fr;
  }
  .ob-step {
    min-height: auto;
  }
}
</style>
