import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      assets: 'Assets',
      consents: 'GDPR',
      aiChat: 'AI Chat',
      publicGallery: 'Public Gallery',
      logout: 'Logout',
    },
    auth: {
      login: 'Sign In',
      email: 'Email address',
      password: 'Password',
      signingIn: 'Signing in...',
      invalidCredentials: 'Invalid credentials. Please try again.',
    },
    assets: {
      title: 'Assets',
      upload: 'Upload asset',
      search: 'Search assets...',
      noResults: 'No assets found.',
      status: {
        processed: 'Processed',
        pending: 'Pending',
        error: 'Error',
      },
    },
    consent: {
      title: 'GDPR Consent Management',
      subtitle: 'Track and document consent for individuals appearing in your assets',
      add: 'Add Consent',
      exportCsv: 'Export CSV',
      status: {
        obtained: 'Obtained',
        pending: 'Pending',
        denied: 'Denied',
      },
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      loading: 'Loading...',
      confirm: 'Confirm',
    },
    onboarding: {
      tagline: 'Open memory for organizations that matter',
      getStarted: 'Get started',
      features: {
        archive: { title: 'Archive', desc: 'Organize your digital assets in structured collections' },
        gdpr: { title: 'GDPR', desc: 'Track consent and comply with data protection laws' },
        share: { title: 'Share', desc: 'Share collections publicly with donors and press' },
      },
    },
  },
  es: {
    nav: {
      dashboard: 'Panel',
      assets: 'Recursos',
      consents: 'RGPD',
      aiChat: 'Chat IA',
      publicGallery: 'Galería Pública',
      logout: 'Cerrar sesión',
    },
    auth: {
      login: 'Iniciar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      signingIn: 'Iniciando sesión...',
      invalidCredentials: 'Credenciales incorrectas. Inténtalo de nuevo.',
    },
    assets: {
      title: 'Recursos',
      upload: 'Subir recurso',
      search: 'Buscar recursos...',
      noResults: 'No se encontraron recursos.',
      status: {
        processed: 'Procesado',
        pending: 'Pendiente',
        error: 'Error',
      },
    },
    consent: {
      title: 'Gestión de Consentimientos RGPD',
      subtitle: 'Registra y documenta el consentimiento de personas en tus recursos',
      add: 'Añadir consentimiento',
      exportCsv: 'Exportar CSV',
      status: {
        obtained: 'Obtenido',
        pending: 'Pendiente',
        denied: 'Denegado',
      },
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Volver',
      loading: 'Cargando...',
      confirm: 'Confirmar',
    },
    onboarding: {
      tagline: 'Memoria abierta para las organizaciones que importan',
      getStarted: 'Empezar',
      features: {
        archive: { title: 'Archivo', desc: 'Organiza tus recursos digitales en colecciones estructuradas' },
        gdpr: { title: 'RGPD', desc: 'Gestiona consentimientos y cumple con la protección de datos' },
        share: { title: 'Compartir', desc: 'Comparte colecciones públicamente con donantes y prensa' },
      },
    },
  },
}

const savedLocale = localStorage.getItem('locale') || 'en'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
})

export default i18n
