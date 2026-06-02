import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Theme store.
 *
 * Persists the user's dark/light mode preference in localStorage and applies
 * the corresponding CSS class to `document.documentElement` so Tailwind's
 * `dark:` variant activates correctly. The stored preference is restored
 * automatically when the store is first instantiated.
 *
 * @returns {{ isDark: import('vue').Ref<boolean>, toggle: Function }}
 */
export const useThemeStore = defineStore('theme', () => {
  /** @type {import('vue').Ref<boolean>} Whether dark mode is currently active. */
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  /**
   * Toggle between dark and light mode, persist the choice, and apply it to
   * the document root element.
   */
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  /**
   * Sync the `dark` class on `<html>` with the current `isDark` value.
   * Called on store init and after every toggle.
   */
  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Apply the saved preference immediately on store creation
  applyTheme()

  return { isDark, toggle }
})
