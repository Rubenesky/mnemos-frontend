import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  const timers = new Map()

  let _nextId = 1

  function add(message, type = 'success', duration) {
    const durations = { success: 3000, info: 4000, error: 6000 }
    const ms = duration ?? durations[type] ?? 3000
    const id = _nextId++
    toasts.value.push({ id, message, type })
    timers.set(
      id,
      setTimeout(() => remove(id), ms),
    )
  }

  function remove(id) {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function success(message) {
    add(message, 'success')
  }
  function error(message) {
    add(message, 'error')
  }
  function info(message) {
    add(message, 'info')
  }

  return { toasts, success, error, info, dismiss: remove }
})
