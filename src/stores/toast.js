import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Toast notification store.
 *
 * Provides a lightweight in-memory queue of transient UI notifications.
 * Each toast is automatically removed after its duration expires.
 * Convenience methods `success`, `error`, and `info` wrap the generic
 * `add` method with the appropriate type.
 *
 * @returns {{ toasts: import('vue').Ref<Array<{id: number, message: string, type: string}>>, success: Function, error: Function, info: Function }}
 */
export const useToastStore = defineStore('toast', () => {
  /** @type {import('vue').Ref<Array<{id: number, message: string, type: string}>>} Active toast list. */
  const toasts = ref([])

  /**
   * Add a toast notification and schedule its removal.
   *
   * @param {string} message - Text to display.
   * @param {'success'|'error'|'info'} [type='success'] - Visual variant.
   * @param {number} [duration=3000] - Auto-dismiss delay in milliseconds.
   */
  function add(message, type = 'success', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, duration)
  }

  /**
   * Show a success toast.
   * @param {string} message
   */
  function success(message) {
    add(message, 'success')
  }

  /**
   * Show an error toast.
   * @param {string} message
   */
  function error(message) {
    add(message, 'error')
  }

  /**
   * Show an informational toast.
   * @param {string} message
   */
  function info(message) {
    add(message, 'info')
  }

  return { toasts, success, error, info }
})
