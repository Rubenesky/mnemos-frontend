<template>
  <div class="mnemos-logo">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="#0f172a" rx="6"/>
      <path d="M6 22 L6 10 L13 17 L16 14 L19 17 L26 10 L26 22" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <line x1="6" y1="22" x2="26" y2="22" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span class="mnemos-wordmark">mnemos</span>
  </div>
</template>

<style scoped>
.mnemos-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.mnemos-wordmark {
  color: var(--color-white, #ffffff);
  font-family: var(--font-sans, 'Inter', sans-serif);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  line-height: 1;
}
</style>
