<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="{
          'toast-item--success': toast.type === 'success',
          'toast-item--error':   toast.type === 'error',
          'toast-item--info':    toast.type === 'info',
        }"
      >
        <span class="toast-icon">
          <span v-if="toast.type === 'success'">✅</span>
          <span v-else-if="toast.type === 'error'">❌</span>
          <span v-else>ℹ️</span>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="dismiss(toast.id)" aria-label="Close">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { TransitionGroup } from 'vue'
import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores/toast'

const store = useToastStore()
const { toasts } = storeToRefs(store)
const { dismiss } = store
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 400px;
  width: calc(100vw - 32px);
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px 11px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  pointer-events: all;
  word-break: break-word;
}

.toast-item--success { background: #22c55e; color: #ffffff; }
.toast-item--error   { background: #ef4444; color: #ffffff; }
.toast-item--info    { background: #3b82f6; color: #ffffff; }

.toast-icon { flex-shrink: 0; font-size: 14px; line-height: 1; }

.toast-message { flex: 1; }

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.7;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: opacity 0.1s ease;
  font-family: inherit;
}

.toast-close:hover { opacity: 1; }

.toast-enter-active,
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(110%); }
.toast-leave-to     { opacity: 0; transform: translateX(110%); }
.toast-move         { transition: transform 0.25s ease; }
</style>
